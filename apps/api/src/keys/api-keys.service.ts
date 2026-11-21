import { Injectable, Logger, NotFoundException, OnModuleInit, OnModuleDestroy, Optional } from "@nestjs/common";
import { DataStoreService, ApiKeyRecord } from "../prisma/data-store.service";
import Redis from "ioredis";
import * as crypto from "node:crypto";

export interface CreateApiKeyDto {
  name: string;
  prefix?: "mk_live_" | "mk_test_";
  scopes?: string[];
  rateLimitPerMin?: number;
  monthlyQuota?: number;
}

@Injectable()
export class ApiKeysService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(ApiKeysService.name);
  private redisClient: Redis | null = null;
  public isRedisActive = false;

  // Resilient fallback storage when Redis is unavailable (e.g. unit tests without Redis)
  private fallbackCounters = new Map<string, { count: number; expiresAt: number }>();

  constructor(
    private readonly dataStore: DataStoreService,
    @Optional() redisClientOverride?: Redis
  ) {
    if (redisClientOverride) {
      this.redisClient = redisClientOverride;
      this.isRedisActive = true;
    }
  }

  async onModuleInit() {
    if (this.redisClient) return;
    const redisUrl = process.env.REDIS_URL;
    if (!redisUrl) {
      this.logger.log("REDIS_URL not configured. Operating API key rate limits in fallback mode.");
      return;
    }

    try {
      this.redisClient = new Redis(redisUrl, {
        connectTimeout: 2000,
        maxRetriesPerRequest: null,
        lazyConnect: true,
        retryStrategy: () => null,
      });
      await this.redisClient.connect();
      this.isRedisActive = true;
      this.logger.log("Redis connected for persistent rate limits and monthly quotas.");
    } catch (err: any) {
      this.logger.warn(`Redis rate-limit connection failed (${err.message}). Using fallback.`);
      this.isRedisActive = false;
      this.redisClient = null;
    }
  }

  async onModuleDestroy() {
    if (this.redisClient) {
      try {
        await this.redisClient.quit();
      } catch {}
      this.redisClient = null;
      this.isRedisActive = false;
    }
  }

  /**
   * Consumes 1 request token for a given identifier key in a fixed window.
   * State persists in Redis across API restarts (§R3).
   */
  async consumeRateLimit(
    identifierKey: string,
    limit: number,
    windowSec: number = 60
  ): Promise<{ count: number; remaining: number; resetSec: number; exceeded: boolean }> {
    const now = Math.floor(Date.now() / 1000);
    const windowBucket = Math.floor(now / windowSec);
    const redisKey = `${identifierKey}:${windowBucket}`;
    const resetSec = Math.max(1, (windowBucket + 1) * windowSec - now);

    let count = 1;

    if (this.isRedisActive && this.redisClient) {
      try {
        count = await this.redisClient.incr(redisKey);
        if (count === 1) {
          await this.redisClient.expire(redisKey, windowSec + 5);
        }
      } catch (err: any) {
        this.logger.warn(`Redis incr error (${err.message}). Using fallback.`);
        count = this.fallbackIncr(redisKey, windowSec + 5);
      }
    } else {
      count = this.fallbackIncr(redisKey, windowSec + 5);
    }

    const remaining = Math.max(0, limit - count);
    const exceeded = count > limit;

    return { count, remaining, resetSec, exceeded };
  }

  /**
   * Increments monthly quota counter for a key in Redis (§R3).
   */
  async consumeMonthlyQuota(
    keyId: string,
    monthlyQuota: number
  ): Promise<{ current: number; exceeded: boolean }> {
    const d = new Date();
    const monthStr = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
    const redisKey = `quota:key:${keyId}:${monthStr}`;
    const expireSec = 35 * 86400; // 35 days

    let current = 1;

    if (this.isRedisActive && this.redisClient) {
      try {
        current = await this.redisClient.incr(redisKey);
        if (current === 1) {
          await this.redisClient.expire(redisKey, expireSec);
        }
      } catch (err: any) {
        this.logger.warn(`Redis quota incr error (${err.message}). Using fallback.`);
        current = this.fallbackIncr(redisKey, expireSec);
      }
    } else {
      current = this.fallbackIncr(redisKey, expireSec);
    }

    return {
      current,
      exceeded: monthlyQuota > 0 && current > monthlyQuota,
    };
  }

  private fallbackIncr(key: string, ttlSec: number): number {
    const now = Date.now();
    const existing = this.fallbackCounters.get(key);
    if (!existing || now >= existing.expiresAt) {
      this.fallbackCounters.set(key, { count: 1, expiresAt: now + ttlSec * 1000 });
      return 1;
    }
    existing.count += 1;
    return existing.count;
  }

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
   * Validates raw key and enforces per-key rate limit & quotas via Redis (§6.7, §R3 & §10)
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

    // Monthly Quota Enforcement in Redis (§R3)
    if (key.monthlyQuota && key.monthlyQuota > 0) {
      const quotaResult = await this.consumeMonthlyQuota(key.id, key.monthlyQuota);
      if (quotaResult.exceeded) {
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
    }

    // Sliding Window Rate Limiting in Redis (§R3)
    const { count, remaining, resetSec, exceeded } = await this.consumeRateLimit(
      `ratelimit:key:${key.id}`,
      key.rateLimitPerMin,
      60
    );

    if (exceeded) {
      return {
        valid: true,
        rateLimited: true,
        key,
        limit: key.rateLimitPerMin,
        remaining: 0,
        resetSec,
        error: `Rate limit of ${key.rateLimitPerMin} req/min exceeded (Too Many Requests)`,
      };
    }

    // Update lastUsedAt
    key.lastUsedAt = new Date();

    return {
      valid: true,
      rateLimited: false,
      key,
      limit: key.rateLimitPerMin,
      remaining,
      resetSec,
    };
  }
}
