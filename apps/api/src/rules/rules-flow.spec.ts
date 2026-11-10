import { describe, it, expect, beforeEach } from "vitest";
import { DataStoreService } from "../prisma/data-store.service";
import { PrismaService } from "../prisma/prisma.service";
import { MockEngineService } from "../mock/mock-engine.service";
import { MockStateService } from "../scenarios/mock-state.service";
import { MockController } from "../mock/mock.controller";
import { RulesService } from "./rules.service";
import { MockAuth } from "@prisma/client";

describe("Phase 5 Rules Editor, Templating & Faults Acceptance Suite", () => {
  let dataStore: DataStoreService;
  let mockEngine: MockEngineService;
  let mockController: MockController;
  let rulesService: RulesService;
  let projectId: string;

  beforeEach(async () => {
    const mockPrisma = {} as PrismaService;
    dataStore = new DataStoreService(mockPrisma);
    dataStore.clear();

    mockEngine = new MockEngineService();
    const mockState = new MockStateService();
    mockController = new MockController(dataStore, mockEngine, mockState);
    rulesService = new RulesService(dataStore, mockEngine);

    const ws = await dataStore.createWorkspace({ name: "Rules WS", slug: "rulesws" });
    const project = await dataStore.createProject({
      workspaceId: ws.id,
      name: "Rules Project",
      slug: "rules-demo",
      mockAuth: MockAuth.PUBLIC,
    });
    projectId = project.id;
  });

  const createMockReqRes = (options: {
    method: string;
    originalUrl: string;
    headers?: Record<string, string>;
    query?: Record<string, string>;
    body?: any;
  }) => {
    const req: any = {
      params: { slug: "rules-demo" },
      method: options.method,
      originalUrl: options.originalUrl,
      headers: options.headers || {},
      query: options.query || {},
      body: options.body || {},
    };

    const resHeaders: Record<string, string> = {};
    let statusCode = 200;
    let jsonBody: any = null;

    const res: any = {
      setHeader: (k: string, v: string) => {
        resHeaders[k.toLowerCase()] = v;
      },
      status: (code: number) => {
        statusCode = code;
        return res;
      },
      json: (data: any) => {
        jsonBody = data;
        return res;
      },
      send: (data: any) => {
        jsonBody = data;
        return res;
      },
    };

    return { req, res, getStatus: () => statusCode, getBody: () => jsonBody, getHeaders: () => resHeaders };
  };

  it("1. F3 (Break it on purpose): header X-Fail = true -> 500 with injected latency and matched rule header", async () => {
    // High priority fault rule: header X-Fail: true -> 500, delay 100 ms (shortened for test speed)
    await rulesService.createRule(projectId, {
      operationId: "GET /checkout",
      priority: 1,
      name: "Simulated Outage Fault",
      matcher: {
        method: "GET",
        path: "/checkout",
        headers: { "x-fail": "true" },
      },
      response: {
        status: 500,
        latencyMs: 50,
        body: { error: "Simulated Payment Gateway Error" },
      },
    });

    // Default rule: 200 OK
    await rulesService.createRule(projectId, {
      operationId: "GET /checkout",
      priority: 2,
      name: "Checkout Success",
      matcher: { method: "GET", path: "/checkout" },
      response: { status: 200, body: { status: "ready" } },
    });

    const start = Date.now();
    const { req, res, getStatus, getBody, getHeaders } = createMockReqRes({
      method: "GET",
      originalUrl: "/m/rules-demo/checkout",
      headers: { "x-fail": "true" },
    });

    await mockController.handleMockRequest(req, res);
    const elapsed = Date.now() - start;

    expect(getStatus()).toBe(500);
    expect(getBody().error).toBe("Simulated Payment Gateway Error");
    expect(getHeaders()["x-mocklab-rule"]).toBe("Simulated Outage Fault");
    expect(elapsed).toBeGreaterThanOrEqual(45);
  });

  it("2. Templating: {{body.name}} and {{uuid}} renders request values dynamically in response", async () => {
    await rulesService.createRule(projectId, {
      operationId: "POST /users",
      priority: 1,
      name: "Create User Echo",
      matcher: { method: "POST", path: "/users" },
      response: {
        status: 201,
        body: {
          id: "{{uuid}}",
          greeting: "Hello, {{body.name}}!",
          city: "{{body.address.city}}",
          role: "{{query.role}}",
        },
      },
    });

    const { req, res, getStatus, getBody } = createMockReqRes({
      method: "POST",
      originalUrl: "/m/rules-demo/users?role=developer",
      query: { role: "developer" },
      body: {
        name: "Ada Lovelace",
        address: { city: "London" },
      },
    });

    await mockController.handleMockRequest(req, res);

    expect(getStatus()).toBe(201);
    const body = getBody();
    expect(body.greeting).toBe("Hello, Ada Lovelace!");
    expect(body.city).toBe("London");
    expect(body.role).toBe("developer");
    expect(body.id).toMatch(/^[0-9a-f-]{36}$/); // Valid UUIDv4
  });

  it("3. Drag-reorder flips which rule matches first (first match wins)", async () => {
    // Rule A: Priority 1 initially -> matches query status=active
    const ruleA = await rulesService.createRule(projectId, {
      operationId: "GET /items",
      priority: 1,
      name: "Rule A - Active Items",
      matcher: { method: "GET", path: "/items" },
      response: { status: 200, body: { matched: "Rule A" } },
    });

    // Rule B: Priority 2 initially
    const ruleB = await rulesService.createRule(projectId, {
      operationId: "GET /items",
      priority: 2,
      name: "Rule B - General Items",
      matcher: { method: "GET", path: "/items" },
      response: { status: 200, body: { matched: "Rule B" } },
    });

    // Request before reorder: matches Rule A (priority 1)
    const { req: req1, res: res1, getBody: getBody1, getHeaders: getHeaders1 } = createMockReqRes({
      method: "GET",
      originalUrl: "/m/rules-demo/items",
    });
    await mockController.handleMockRequest(req1, res1);
    expect(getBody1().matched).toBe("Rule A");
    expect(getHeaders1()["x-mocklab-rule"]).toBe("Rule A - Active Items");

    // Reorder: Move Rule B to Priority 1, Rule A to Priority 2
    await rulesService.reorderRules(projectId, [ruleB.id, ruleA.id]);

    // Request after reorder: now matches Rule B!
    const { req: req2, res: res2, getBody: getBody2, getHeaders: getHeaders2 } = createMockReqRes({
      method: "GET",
      originalUrl: "/m/rules-demo/items",
    });
    await mockController.handleMockRequest(req2, res2);
    expect(getBody2().matched).toBe("Rule B");
    expect(getHeaders2()["x-mocklab-rule"]).toBe("Rule B - General Items");
  });
});
