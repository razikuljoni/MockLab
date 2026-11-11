import { Injectable, Logger, NotFoundException, UnauthorizedException } from "@nestjs/common";
import { DataStoreService, ApiKeyRecord } from "../prisma/data-store.service";
import * as crypto from "node:crypto";

export interface CreateApiKeyDto {
  name: string;
  prefix?: "mk_live_" | "mk_test_";
  scopes?: string[];
  rateLimitPerMin?: number;
  monthlyQuota?: number;
}

@Injectable()
export class ApiKeysService {
  private readonly logger = new Logger(ApiKeysService.name);

  // In-memory sliding window rate-limit tracker: keyId -> { windowStart, count }
  private rateLimitWindows = new Map<string, { windowStart: number; count: number }>();
  // Monthly quota tracker: keyId:YYYY-MM -> count
  private monthlyQuotaUsage = new Map<string, number>();

  constructor(private readonly dataStore: DataStoreService) {}

  /**
   * Generates a Stripe-style API key (shown ONCE at creation, stored only as SHA-256 hash) (§6.7)
   */
  async createKey(
    workspaceId: string,
    dto: CreateApiKeyDto
  ): Promise<{ rawKey: string; key: ApiKeyRecord }> {
    const ws = await this.dataStore.findWorkspaceById(workspaceId);
    if (!ws) throw new NotFoundException("Workspace not found");

    const prefix = dto.prefix || "mk_live_";
    const randomHex = crypto.randomBytes(20).toString("hex");
    const rawKey = `${prefix}${randomHex}`;

    const keyHash = crypto.createHash("sha256").update(rawKey).digest("hex");
    const last4 = rawKey.slice(-4);

    const record = await this.dataStore.createApiKey({
      workspaceId,
      name: dto.name,
      prefix,
      keyHash,
      last4,
      scopes: dto.scopes || ["mock:read", "mock:write", "tests:run"],
      rateLimitPerMin: dto.rateLimitPerMin || 100,
      monthlyQuota: dto.monthlyQuota || 0,
    });

    return { rawKey, key: record };
  }

  async listKeys(workspaceId: string): Promise<ApiKeyRecord[]> {
    return this.dataStore.listApiKeys(workspaceId);
  }

  async revokeKey(workspaceId: string, keyId: string): Promise<ApiKeyRecord> {
    const key = await this.dataStore.findApiKeyById(keyId);
    if (!key || key.workspaceId !== workspaceId) {
      throw new NotFoundException("API key not found");
    }
    const revoked = await this.dataStore.revokeApiKey(keyId);
    return revoked!;
  }

  async deleteKey(workspaceId: string, keyId: string): Promise<boolean> {
    const key = await this.dataStore.findApiKeyById(keyId);
    if (!key || key.workspaceId !== workspaceId) {
      throw new NotFoundException("API key not found");
    }
    return this.dataStore.deleteApiKey(keyId);
  }

  /**
   * Validates raw key and enforces per-key rate limit (§6.7 & §10)
   */
  async validateAndRateLimit(rawKey: string): Promise<{
    valid: boolean;
    rateLimited: boolean;
    key?: ApiKeyRecord;
    error?: string;
    limit?: number;
    remaining?: number;
    resetSec?: number;
  }> {
    if (!rawKey) return { valid: false, rateLimited: false, error: "Missing API key" };

    const keyHash = crypto.createHash("sha256").update(rawKey.trim()).digest("hex");
    const key = await this.dataStore.findApiKeyByHash(keyHash);

    if (!key) {
      return { valid: false, rateLimited: false, error: "Invalid API key" };
    }

    if (key.revokedAt !== null) {
      return { valid: false, rateLimited: false, error: "API key has been revoked" };
    }

    // Monthly Quota Enforcement (§6.7, §9.3 & §10)
    const monthKey = `${key.id}:${new Date().getUTCFullYear()}-${new Date().getUTCMonth() + 1}`;
    const currentMonthly = (this.monthlyQuotaUsage.get(monthKey) || 0) + 1;
    this.monthlyQuotaUsage.set(monthKey, currentMonthly);

    if (key.monthlyQuota && key.monthlyQuota > 0 && currentMonthly > key.monthlyQuota) {
      return {
        valid: true,
        rateLimited: true,
        key,
        limit: key.rateLimitPerMin,
        remaining: 0,
        resetSec: 3600,
        error: `Monthly quota of ${key.monthlyQuota} requests exceeded for this API key`,
      };
    }

    // Rate Limiting (Sliding Window 60s)
    const now = Date.now();
    let window = this.rateLimitWindows.get(key.id);

    if (!window || now - window.windowStart >= 60000) {
      window = { windowStart: now, count: 1 };
      this.rateLimitWindows.set(key.id, window);
    } else {
      window.count++;
    }

    const resetSec = Math.max(1, Math.ceil((window.windowStart + 60000 - now) / 1000));
    const limit = key.rateLimitPerMin;
    const remaining = Math.max(0, limit - window.count);

    if (window.count > limit) {
      return {
        valid: true,
        rateLimited: true,
        key,
        limit,
        remaining: 0,
        resetSec,
        error: `Rate limit of ${limit} req/min exceeded (Too Many Requests)`,
      };
    }

    // Update lastUsedAt
    key.lastUsedAt = new Date();

    return {
      valid: true,
      rateLimited: false,
      key,
      limit,
      remaining,
      resetSec,
    };
  }
}
