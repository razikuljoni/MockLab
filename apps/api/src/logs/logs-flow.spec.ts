import { describe, it, expect, beforeEach } from "vitest";
import { DataStoreService } from "../prisma/data-store.service";
import { PrismaService } from "../prisma/prisma.service";
import { MockEngineService } from "../mock/mock-engine.service";
import { MockStateService } from "../scenarios/mock-state.service";
import { RequestLoggerService } from "./request-logger.service";
import { LogsService } from "./logs.service";
import { MockController } from "../mock/mock.controller";
import { MockAuth } from "@prisma/client";

function createMockResponse() {
  const headers: Record<string, string> = {};
  let statusCode = 200;
  let body: any = null;

  return {
    setHeader(key: string, value: string) {
      headers[key.toLowerCase()] = value;
      return this;
    },
    getHeader(key: string) {
      return headers[key.toLowerCase()];
    },
    status(code: number) {
      statusCode = code;
      return this;
    },
    json(data: any) {
      body = data;
      return this;
    },
    send(data: any) {
      body = data;
      return this;
    },
    get _statusCode() {
      return statusCode;
    },
    get _body() {
      return body;
    },
    get _headers() {
      return headers;
    },
  };
}

describe("Phase 7 Traffic Inspector Acceptance Suite", () => {
  let dataStore: DataStoreService;
  let mockEngine: MockEngineService;
  let mockState: MockStateService;
  let requestLogger: RequestLoggerService;
  let logsService: LogsService;
  let mockController: MockController;
  let projectId: string;

  beforeEach(async () => {
    const mockPrisma = {} as PrismaService;
    dataStore = new DataStoreService(mockPrisma);
    dataStore.clear();

    mockEngine = new MockEngineService();
    mockState = new MockStateService();
    await mockState.onModuleInit();

    requestLogger = new RequestLoggerService(dataStore);
    requestLogger.onModuleInit();

    logsService = new LogsService(dataStore);
    mockController = new MockController(dataStore, mockEngine, mockState, requestLogger);

    const ws = await dataStore.createWorkspace({ name: "Logs WS", slug: "logsws" });
    const project = await dataStore.createProject({
      workspaceId: ws.id,
      name: "Petstore",
      slug: "petstore",
      mockAuth: MockAuth.PUBLIC,
    });
    projectId = project.id;
  });

  it("1. F5 Acceptance Criteria (Debug a 404): unmatched request logged with nearMiss -> Create rule from request prefills working rule -> retry succeeds with 200", async () => {
    // 1a. Create existing rule for /users with required header X-Admin = true
    await dataStore.createMockRule({
      projectId,
      operationId: "GET /users",
      priority: 1,
      name: "List Users (Admin Only)",
      enabled: true,
      generated: false,
      edited: false,
      matcher: {
        method: "GET",
        path: "/users",
        headers: { "x-admin": "true" },
      },
      response: {
        status: 200,
        body: [{ id: "usr_1", name: "Superadmin" }],
      },
    });

    // 1b. Send GET /m/petstore/users WITHOUT the x-admin header -> 404 Near Miss
    const unmatchedReq: any = {
      params: { slug: "petstore" },
      originalUrl: "/m/petstore/users",
      method: "GET",
      query: {},
      headers: { "x-client": "test-client" },
      body: {},
    };
    const unmatchedRes = createMockResponse();
    await mockController.handleMockRequest(unmatchedReq, unmatchedRes as any);

    expect(unmatchedRes._statusCode).toBe(404);
    expect(unmatchedRes._body.error).toBe("Unmatched Request");
    expect(unmatchedRes._body.nearMiss).toBeDefined();

    // Flush batch queue so logs are written to store
    await requestLogger.flush();

    // 1c. Verify the unmatched request appears in traffic inspector
    const logList = await logsService.listLogs(projectId, { onlyUnmatched: true });
    expect(logList.total).toBe(1);
    const loggedUnmatched = logList.logs[0];
    expect(loggedUnmatched.status).toBe(404);
    expect(loggedUnmatched.path).toBe("/users");
    expect(loggedUnmatched.nearMiss).toBeDefined();
    expect(loggedUnmatched.matchedRuleId).toBeNull();

    // 1d. Click "Create rule from this request" -> generates working rule
    const ruleCreation = await logsService.createRuleFromLog(projectId, loggedUnmatched.id);
    expect(ruleCreation.rule).toBeDefined();
    expect(ruleCreation.rule.matcher.path).toBe("/users");
    expect(ruleCreation.rule.matcher.method).toBe("GET");
    expect(ruleCreation.rule.matcher.headers?.["x-client"]).toBe("test-client");

    // 1e. Retry the exact same request -> NOW SUCCEEDS WITH 200!
    const retryRes = createMockResponse();
    await mockController.handleMockRequest(unmatchedReq, retryRes as any);

    expect(retryRes._statusCode).toBe(200);
    expect(retryRes._headers["x-mocklab-rule"]).toBe(ruleCreation.rule.name);
  });

  it("2. Non-blocking Hot Path: 1,000 mock hits queue asynchronously without blocking the hot path", async () => {
    // Register rule
    await dataStore.createMockRule({
      projectId,
      operationId: "GET /ping",
      priority: 0,
      name: "Ping",
      enabled: true,
      generated: true,
      edited: false,
      matcher: { method: "GET", path: "/ping" },
      response: { status: 200, body: { pong: true } },
    });

    const pingReq: any = {
      params: { slug: "petstore" },
      originalUrl: "/m/petstore/ping",
      method: "GET",
      query: {},
      headers: {},
      body: {},
    };

    const startTime = Date.now();
    for (let i = 0; i < 1000; i++) {
      const res = createMockResponse();
      await mockController.handleMockRequest(pingReq, res as any);
      expect(res._statusCode).toBe(200);
    }
    const elapsedMs = Date.now() - startTime;

    // 1,000 in-memory requests executed swiftly on hot path
    expect(elapsedMs).toBeLessThan(1500);

    // Buffer should hold entries waiting for periodic batch or flush
    const buffered = requestLogger.getBufferSize();
    expect(buffered).toBeGreaterThan(0);

    // Flush batch writes all remaining entries in batch
    await requestLogger.flush();
    expect(requestLogger.getBufferSize()).toBe(0);

    const logs = await logsService.listLogs(projectId, { path: "/ping" }, { limit: 10 });
    expect(logs.total).toBe(1000);
  });

  it("3. Sensitive Auth Header & Body Redaction: authorization tokens and credentials are never stored plain", async () => {
    const authReq: any = {
      params: { slug: "petstore" },
      originalUrl: "/m/petstore/auth/login",
      method: "POST",
      query: {},
      headers: {
        authorization: "Bearer super-secret-jwt-token-12345",
        "x-mocklab-key": "mk_live_secret_key_9999",
        cookie: "session=sensitive_cookie_value",
      },
      body: {
        email: "alice@mocklab.dev",
        password: "MySuperSecretPassword!2026",
      },
    };

    const authRes = createMockResponse();
    await mockController.handleMockRequest(authReq, authRes as any);

    await requestLogger.flush();

    const list = await logsService.listLogs(projectId, { path: "/auth/login" });
    expect(list.total).toBe(1);
    const log = list.logs[0];

    // Verify header redactions
    expect(log.requestHeaders?.["authorization"]).toBe("[REDACTED]");
    expect(log.requestHeaders?.["x-mocklab-key"]).toBe("[REDACTED]");
    expect(log.requestHeaders?.["cookie"]).toBe("[REDACTED]");

    // Verify body password redaction
    expect(log.requestBody?.email).toBe("alice@mocklab.dev");
    expect(log.requestBody?.password).toBe("[REDACTED]");
  });

  it("4. Scale Honesty: >100 KB payload is capped and carries truncation notice", async () => {
    // Generate 150 KB payload
    const largeData = "x".repeat(150 * 1024);
    const largeReq: any = {
      params: { slug: "petstore" },
      originalUrl: "/m/petstore/data/upload",
      method: "POST",
      query: {},
      headers: {},
      body: { payload: largeData },
    };

    const largeRes = createMockResponse();
    await mockController.handleMockRequest(largeReq, largeRes as any);

    await requestLogger.flush();

    const list = await logsService.listLogs(projectId, { path: "/data/upload" });
    const log = list.logs[0];

    expect(log.requestBody._truncated).toBe(true);
    expect(log.requestBody._originalBytes).toBeGreaterThan(100 * 1024);
    expect(log.requestBody._note).toContain("Body exceeded 100 KB cap");
  });

  it("5. Retention Purge: nightly purge cleans rows older than plan window", async () => {
    // Inject old log
    const oldLog = await dataStore.createRequestLog({
      projectId,
      method: "GET",
      path: "/old/endpoint",
      status: 200,
      matchedRuleId: null,
      nearMiss: null,
      latencyMs: 12,
      injectedMs: 0,
      requestSize: 50,
      responseSize: 50,
      requestHeaders: {},
      requestBody: {},
      responseHeaders: {},
      responseBody: {},
    });

    // Artificially age the log past 14 days
    (oldLog as any).createdAt = new Date(Date.now() - 20 * 24 * 60 * 60 * 1000);

    const purgeResult = await logsService.purgeLogs(projectId, 14, 2500);
    expect(purgeResult.purged).toBeGreaterThanOrEqual(1);

    const remaining = await logsService.listLogs(projectId, { path: "/old/endpoint" });
    expect(remaining.total).toBe(0);
  });
});
