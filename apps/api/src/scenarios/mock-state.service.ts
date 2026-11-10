import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from "@nestjs/common";
import Redis from "ioredis";
import * as crypto from "node:crypto";

export interface BucketItem {
  id: string;
  createdAt: string;
  updatedAt: string;
  [key: string]: unknown;
}

export interface TransitionLog {
  id: string;
  projectId: string;
  scenarioKey: string;
  resource?: string;
  scenarioName?: string;
  action: "CREATE" | "UPDATE" | "DELETE" | "RESET" | "TRANSITION";
  targetId?: string;
  summary: string;
  timestamp: string;
}

export interface ScenarioDefinition {
  name: string;
  currentState: string;
  initialState: string;
  states: string[];
  transitions: Array<{
    from: string;
    to: string;
    trigger: string; // e.g. "POST /orders/:id/pay"
    method: string;
    pathPattern: string;
  }>;
  updatedAt: string;
}

@Injectable()
export class MockStateService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(MockStateService.name);
  private redisClient: Redis | null = null;
  public isRedisActive = false;

  // In-memory fallback: key -> (field -> JSON string)
  private memoryBuckets: Map<string, Map<string, string>> = new Map();
  // Key -> JSON string for scenario state definitions
  private memoryScenarios: Map<string, string> = new Map();
  // ProjectId -> TransitionLog[]
  private transitionLogs: Map<string, TransitionLog[]> = new Map();
  // Registered stateful resources per project: projectId -> Set<string>
  private registeredResources: Map<string, Set<string>> = new Map();

  async onModuleInit() {
    const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";
    try {
      this.redisClient = new Redis(redisUrl, {
        maxRetriesPerRequest: null,
        connectTimeout: 2000,
        lazyConnect: true,
        retryStrategy: () => null, // don't hang if offline
      });

      this.redisClient.on("error", (err) => {
        if (this.isRedisActive) {
          this.logger.warn(`Redis disconnected, falling back to in-memory state: ${err.message}`);
          this.isRedisActive = false;
        }
      });

      await this.redisClient.connect();
      await this.redisClient.ping();
      this.isRedisActive = true;
      this.logger.log("Connected to Redis for stateful buckets & scenarios");
    } catch {
      this.isRedisActive = false;
      this.logger.log("Redis unavailable; operating in robust in-memory bucket mode");
    }
  }

  async onModuleDestroy() {
    if (this.redisClient) {
      try {
        await this.redisClient.quit();
      } catch {
        // ignore shutdown error
      }
    }
  }

  // ── Helper Key Generators ──
  getBucketKey(projectId: string, scenarioKey: string, resource: string): string {
    const sanitizedScenario = (scenarioKey || "default").trim().toLowerCase();
    const sanitizedResource = resource.trim().toLowerCase();
    return `mock:${projectId}:${sanitizedScenario}:bucket:${sanitizedResource}`;
  }

  getScenarioKey(projectId: string, scenarioKey: string, scenarioName: string): string {
    const sanitizedScenario = (scenarioKey || "default").trim().toLowerCase();
    const sanitizedName = scenarioName.trim().toLowerCase();
    return `mock:${projectId}:${sanitizedScenario}:scenario:${sanitizedName}`;
  }

  // ── Bucket Registration ──
  registerResource(projectId: string, resource: string): void {
    const r = resource.trim().toLowerCase();
    if (!this.registeredResources.has(projectId)) {
      this.registeredResources.set(projectId, new Set());
    }
    this.registeredResources.get(projectId)!.add(r);
  }

  isResourceRegistered(projectId: string, resource: string): boolean {
    const r = resource.trim().toLowerCase();
    return !!this.registeredResources.get(projectId)?.has(r);
  }

  // ── CRUD Operations ──

  async createItem(
    projectId: string,
    scenarioKey: string,
    resource: string,
    data: Record<string, unknown>
  ): Promise<BucketItem> {
    this.registerResource(projectId, resource);
    const key = this.getBucketKey(projectId, scenarioKey, resource);
    const now = new Date().toISOString();

    // Server-generated UUID (never trust client-supplied ID)
    const id = crypto.randomUUID();

    // Strip client ID to ensure new unique record is created every time
    const { id: _ignoredId, ...payloadWithoutId } = data || {};

    const newItem: BucketItem = {
      ...payloadWithoutId,
      id,
      createdAt: now,
      updatedAt: now,
    };

    const serialized = JSON.stringify(newItem);

    if (this.isRedisActive && this.redisClient) {
      try {
        await this.redisClient.hset(key, id, serialized);
      } catch {
        this.setMemoryItem(key, id, serialized);
      }
    } else {
      this.setMemoryItem(key, id, serialized);
    }

    this.logTransition({
      id: crypto.randomUUID(),
      projectId,
      scenarioKey: scenarioKey || "default",
      resource,
      action: "CREATE",
      targetId: id,
      summary: `Created ${resource} item ${id.slice(0, 8)}`,
      timestamp: now,
    });

    return newItem;
  }

  async getItem(
    projectId: string,
    scenarioKey: string,
    resource: string,
    id: string
  ): Promise<BucketItem | null> {
    const key = this.getBucketKey(projectId, scenarioKey, resource);
    let serialized: string | null | undefined = null;

    if (this.isRedisActive && this.redisClient) {
      try {
        serialized = await this.redisClient.hget(key, id);
      } catch {
        serialized = this.getMemoryItem(key, id);
      }
    } else {
      serialized = this.getMemoryItem(key, id);
    }

    if (!serialized) return null;
    try {
      return JSON.parse(serialized);
    } catch {
      return null;
    }
  }

  async listItems(
    projectId: string,
    scenarioKey: string,
    resource: string,
    search?: string
  ): Promise<BucketItem[]> {
    const key = this.getBucketKey(projectId, scenarioKey, resource);
    let itemsMap: Record<string, string> = {};

    if (this.isRedisActive && this.redisClient) {
      try {
        itemsMap = await this.redisClient.hgetall(key);
      } catch {
        itemsMap = this.getMemoryAll(key);
      }
    } else {
      itemsMap = this.getMemoryAll(key);
    }

    const items: BucketItem[] = [];
    for (const val of Object.values(itemsMap)) {
      try {
        items.push(JSON.parse(val));
      } catch {
        // skip malformed
      }
    }

    // Sort newest first
    items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    if (!search || !search.trim()) {
      return items;
    }

    const query = search.toLowerCase().trim();
    return items.filter((item) => {
      const content = JSON.stringify(item).toLowerCase();
      return content.includes(query);
    });
  }

  async updateItem(
    projectId: string,
    scenarioKey: string,
    resource: string,
    id: string,
    updates: Record<string, unknown>
  ): Promise<BucketItem | null> {
    const existing = await this.getItem(projectId, scenarioKey, resource, id);
    if (!existing) return null;

    const key = this.getBucketKey(projectId, scenarioKey, resource);
    const now = new Date().toISOString();

    // Prevent overwriting primary key & creation timestamp
    const { id: _ignoreId, createdAt: _ignoreCreated, ...safeUpdates } = updates || {};

    const updatedItem: BucketItem = {
      ...existing,
      ...safeUpdates,
      id,
      createdAt: existing.createdAt,
      updatedAt: now,
    };

    const serialized = JSON.stringify(updatedItem);

    if (this.isRedisActive && this.redisClient) {
      try {
        await this.redisClient.hset(key, id, serialized);
      } catch {
        this.setMemoryItem(key, id, serialized);
      }
    } else {
      this.setMemoryItem(key, id, serialized);
    }

    this.logTransition({
      id: crypto.randomUUID(),
      projectId,
      scenarioKey: scenarioKey || "default",
      resource,
      action: "UPDATE",
      targetId: id,
      summary: `Updated ${resource} item ${id.slice(0, 8)}`,
      timestamp: now,
    });

    return updatedItem;
  }

  async deleteItem(
    projectId: string,
    scenarioKey: string,
    resource: string,
    id: string
  ): Promise<boolean> {
    const key = this.getBucketKey(projectId, scenarioKey, resource);
    let deleted = false;

    if (this.isRedisActive && this.redisClient) {
      try {
        const count = await this.redisClient.hdel(key, id);
        deleted = count > 0;
      } catch {
        deleted = this.deleteMemoryItem(key, id);
      }
    } else {
      deleted = this.deleteMemoryItem(key, id);
    }

    if (deleted) {
      this.logTransition({
        id: crypto.randomUUID(),
        projectId,
        scenarioKey: scenarioKey || "default",
        resource,
        action: "DELETE",
        targetId: id,
        summary: `Deleted ${resource} item ${id.slice(0, 8)}`,
        timestamp: new Date().toISOString(),
      });
    }

    return deleted;
  }

  async listBuckets(
    projectId: string,
    scenarioKey: string
  ): Promise<Array<{ resource: string; count: number }>> {
    const registered = Array.from(this.registeredResources.get(projectId) || []);
    // Also discover any created buckets in memory or Redis
    const discovered = new Set<string>(registered);

    const prefix = `mock:${projectId}:${(scenarioKey || "default").trim().toLowerCase()}:bucket:`;

    if (this.isRedisActive && this.redisClient) {
      try {
        const keys = await this.redisClient.keys(`${prefix}*`);
        for (const k of keys) {
          discovered.add(k.substring(prefix.length));
        }
      } catch {
        for (const k of this.memoryBuckets.keys()) {
          if (k.startsWith(prefix)) {
            discovered.add(k.substring(prefix.length));
          }
        }
      }
    } else {
      for (const k of this.memoryBuckets.keys()) {
        if (k.startsWith(prefix)) {
          discovered.add(k.substring(prefix.length));
        }
      }
    }

    const results: Array<{ resource: string; count: number }> = [];
    for (const res of discovered) {
      const items = await this.listItems(projectId, scenarioKey, res);
      results.push({ resource: res, count: items.length });
    }

    return results;
  }

  // ── Reset State ──
  async resetState(projectId: string, scenarioKey?: string): Promise<{ success: boolean; cleared: number }> {
    const targetScenario = scenarioKey?.trim().toLowerCase();
    let clearedCount = 0;

    const pattern = targetScenario
      ? `mock:${projectId}:${targetScenario}:*`
      : `mock:${projectId}:*`;

    if (this.isRedisActive && this.redisClient) {
      try {
        const keys = await this.redisClient.keys(pattern);
        if (keys.length > 0) {
          clearedCount = await this.redisClient.del(...keys);
        }
      } catch {
        clearedCount = this.clearMemoryPattern(pattern);
      }
    } else {
      clearedCount = this.clearMemoryPattern(pattern);
    }

    this.logTransition({
      id: crypto.randomUUID(),
      projectId,
      scenarioKey: targetScenario || "all",
      action: "RESET",
      summary: `Reset state cleared ${clearedCount} bucket/scenario keys`,
      timestamp: new Date().toISOString(),
    });

    return { success: true, cleared: clearedCount };
  }

  // ── Scenario State Machines ──

  async getScenario(
    projectId: string,
    scenarioKey: string,
    scenarioName: string
  ): Promise<ScenarioDefinition | null> {
    const key = this.getScenarioKey(projectId, scenarioKey, scenarioName);
    let serialized: string | null = null;

    if (this.isRedisActive && this.redisClient) {
      try {
        serialized = await this.redisClient.get(key);
      } catch {
        serialized = this.memoryScenarios.get(key) || null;
      }
    } else {
      serialized = this.memoryScenarios.get(key) || null;
    }

    if (!serialized) {
      // Return default template if Order Lifecycle is requested
      if (scenarioName === "order-lifecycle" || scenarioName === "orders") {
        return this.getDefaultOrderLifecycle(projectId, scenarioKey);
      }
      return null;
    }

    try {
      return JSON.parse(serialized);
    } catch {
      return null;
    }
  }

  async saveScenario(
    projectId: string,
    scenarioKey: string,
    scenario: ScenarioDefinition
  ): Promise<ScenarioDefinition> {
    const key = this.getScenarioKey(projectId, scenarioKey, scenario.name);
    const serialized = JSON.stringify(scenario);

    if (this.isRedisActive && this.redisClient) {
      try {
        await this.redisClient.set(key, serialized);
      } catch {
        this.memoryScenarios.set(key, serialized);
      }
    } else {
      this.memoryScenarios.set(key, serialized);
    }

    return scenario;
  }

  async transitionScenario(
    projectId: string,
    scenarioKey: string,
    scenarioName: string,
    toState: string,
    trigger?: string
  ): Promise<ScenarioDefinition | null> {
    let scenario = await this.getScenario(projectId, scenarioKey, scenarioName);
    if (!scenario) {
      scenario = this.getDefaultOrderLifecycle(projectId, scenarioKey);
    }

    const fromState = scenario.currentState;
    scenario.currentState = toState;
    scenario.updatedAt = new Date().toISOString();
    await this.saveScenario(projectId, scenarioKey, scenario);

    this.logTransition({
      id: crypto.randomUUID(),
      projectId,
      scenarioKey: scenarioKey || "default",
      scenarioName: scenario.name,
      action: "TRANSITION",
      summary: `Scenario '${scenario.name}' transitioned from ${fromState} to ${toState}${trigger ? ` via ${trigger}` : ""}`,
      timestamp: scenario.updatedAt,
    });

    return scenario;
  }

  // ── Transition Logs ──

  private logTransition(log: TransitionLog) {
    if (!this.transitionLogs.has(log.projectId)) {
      this.transitionLogs.set(log.projectId, []);
    }
    const list = this.transitionLogs.get(log.projectId)!;
    list.unshift(log);
    // Cap at 100 entries in memory
    if (list.length > 100) list.pop();
  }

  getTransitionLogs(projectId: string, scenarioKey?: string, limit = 50): TransitionLog[] {
    const list = this.transitionLogs.get(projectId) || [];
    if (!scenarioKey || scenarioKey === "all") {
      return list.slice(0, limit);
    }
    return list.filter((l) => l.scenarioKey === scenarioKey).slice(0, limit);
  }

  // ── Templates Setup ──

  async applyTemplate(
    projectId: string,
    scenarioKey: string,
    templateName: "orders" | "crud" | "auth",
    resourceName = "pets"
  ): Promise<{ message: string; scenario?: ScenarioDefinition; bucket?: string }> {
    const key = scenarioKey || "default";

    if (templateName === "orders") {
      const orderDef = this.getDefaultOrderLifecycle(projectId, key);
      await this.saveScenario(projectId, key, orderDef);
      this.registerResource(projectId, "orders");
      // Seed one sample order
      await this.createItem(projectId, key, "orders", {
        customer: "Ada Lovelace",
        items: [{ sku: "BOOK-01", qty: 2, price: 29.99 }],
        total: 59.98,
        status: "created",
      });
      return { message: "Applied Order Lifecycle scenario template (Created → Paid → Shipped)", scenario: orderDef, bucket: "orders" };
    }

    if (templateName === "crud") {
      const res = resourceName.toLowerCase();
      this.registerResource(projectId, res);
      await this.createItem(projectId, key, res, { name: "Fluffy", category: "Cat", status: "available" });
      await this.createItem(projectId, key, res, { name: "Barky", category: "Dog", status: "pending" });
      return { message: `Applied CRUD bucket template for '${res}' with initial seed records`, bucket: res };
    }

    if (templateName === "auth") {
      const authDef: ScenarioDefinition = {
        name: "auth-lifecycle",
        initialState: "logged_out",
        currentState: "logged_out",
        states: ["logged_out", "authenticated", "token_expired"],
        transitions: [
          { from: "logged_out", to: "authenticated", trigger: "POST /auth/login", method: "POST", pathPattern: "/auth/login" },
          { from: "authenticated", to: "logged_out", trigger: "POST /auth/logout", method: "POST", pathPattern: "/auth/logout" },
          { from: "authenticated", to: "token_expired", trigger: "Wait / Expiry", method: "POST", pathPattern: "/auth/refresh" },
        ],
        updatedAt: new Date().toISOString(),
      };
      await this.saveScenario(projectId, key, authDef);
      return { message: "Applied Auth Lifecycle scenario template (logged_out → authenticated)", scenario: authDef };
    }

    return { message: "Unknown template" };
  }

  private getDefaultOrderLifecycle(projectId: string, scenarioKey: string): ScenarioDefinition {
    return {
      name: "order-lifecycle",
      initialState: "created",
      currentState: "created",
      states: ["created", "paid", "shipped", "delivered"],
      transitions: [
        { from: "created", to: "paid", trigger: "POST /orders/:id/pay", method: "POST", pathPattern: "/orders/*/pay" },
        { from: "paid", to: "shipped", trigger: "POST /orders/:id/ship", method: "POST", pathPattern: "/orders/*/ship" },
        { from: "shipped", to: "delivered", trigger: "POST /orders/:id/deliver", method: "POST", pathPattern: "/orders/*/deliver" },
      ],
      updatedAt: new Date().toISOString(),
    };
  }

  // ── In-Memory Helpers ──

  private setMemoryItem(key: string, id: string, serialized: string): void {
    if (!this.memoryBuckets.has(key)) {
      this.memoryBuckets.set(key, new Map());
    }
    this.memoryBuckets.get(key)!.set(id, serialized);
  }

  private getMemoryItem(key: string, id: string): string | null {
    return this.memoryBuckets.get(key)?.get(id) || null;
  }

  private getMemoryAll(key: string): Record<string, string> {
    const bucket = this.memoryBuckets.get(key);
    if (!bucket) return {};
    const res: Record<string, string> = {};
    for (const [k, v] of bucket.entries()) {
      res[k] = v;
    }
    return res;
  }

  private deleteMemoryItem(key: string, id: string): boolean {
    const bucket = this.memoryBuckets.get(key);
    if (!bucket) return false;
    return bucket.delete(id);
  }

  private clearMemoryPattern(pattern: string): number {
    let cleared = 0;
    // Simple wildcard match: e.g. mock:proj123:* or mock:proj123:test:*
    const regex = new RegExp("^" + pattern.replace(/\*/g, ".*") + "$");

    for (const key of Array.from(this.memoryBuckets.keys())) {
      if (regex.test(key)) {
        this.memoryBuckets.delete(key);
        cleared++;
      }
    }

    for (const key of Array.from(this.memoryScenarios.keys())) {
      if (regex.test(key)) {
        this.memoryScenarios.delete(key);
        cleared++;
      }
    }

    return cleared;
  }
}
