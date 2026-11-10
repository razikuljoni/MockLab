import { describe, it, expect, beforeEach } from "vitest";
import { DataStoreService } from "../prisma/data-store.service";
import { PrismaService } from "../prisma/prisma.service";
import { MockEngineService } from "./mock-engine.service";
import { MockStateService } from "../scenarios/mock-state.service";
import { MockController } from "./mock.controller";
import { ProjectStatus, MockAuth, Role } from "@prisma/client";

describe("Phase 3 Mock Engine Core Acceptance Suite", () => {
  let dataStore: DataStoreService;
  let mockEngine: MockEngineService;
  let mockController: MockController;
  let projectId: string;

  beforeEach(async () => {
    const mockPrisma = {} as PrismaService;
    dataStore = new DataStoreService(mockPrisma);
    dataStore.clear();

    mockEngine = new MockEngineService();
    const mockState = new MockStateService();
    mockController = new MockController(dataStore, mockEngine, mockState);

    const ws = await dataStore.createWorkspace({ name: "Demo WS", slug: "demows" });
    const project = await dataStore.createProject({
      workspaceId: ws.id,
      name: "Petstore",
      slug: "petstore",
      mockAuth: MockAuth.PUBLIC, // Public demo
    });
    projectId = project.id;

    // Create default rule: GET /users -> 200 with spec example
    await dataStore.createMockRule({
      projectId,
      operationId: "GET /users",
      priority: 1,
      name: "Get Users Example",
      matcher: { method: "GET", path: "/users" },
      response: {
        status: 200,
        body: [{ id: 1, name: "Alice" }, { id: 2, name: "Bob" }],
      },
    });

    // Create second rule: GET /users/:id -> 200 with user detail
    await dataStore.createMockRule({
      projectId,
      operationId: "GET /users/{id}",
      priority: 2,
      name: "Get User By ID",
      matcher: { method: "GET", path: "/users/{id}" },
      response: {
        status: 200,
        body: { id: 42, name: "Asha" },
      },
    });
  });

  const createMockReqRes = (options: {
    method: string;
    originalUrl: string;
    headers?: Record<string, string>;
    query?: Record<string, string>;
    body?: any;
  }) => {
    const req: any = {
      params: { slug: "petstore" },
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

  it("1. GET /users returns the spec example with 200 and X-MockLab-Rule header", async () => {
    const { req, res, getStatus, getBody, getHeaders } = createMockReqRes({
      method: "GET",
      originalUrl: "/m/petstore/users",
    });

    await mockController.handleMockRequest(req, res);

    expect(getStatus()).toBe(200);
    expect(getBody()).toEqual([{ id: 1, name: "Alice" }, { id: 2, name: "Bob" }]);
    expect(getHeaders()["x-mocklab-rule"]).toBe("Get Users Example");
    expect(getHeaders()["x-ratelimit-limit"]).toBe("100");
  });

  it("2. GET /nope returns 404 with near-miss report naming closest rule", async () => {
    const { req, res, getStatus, getBody, getHeaders } = createMockReqRes({
      method: "GET",
      originalUrl: "/m/petstore/nope",
    });

    await mockController.handleMockRequest(req, res);

    expect(getStatus()).toBe(404);
    expect(getHeaders()["x-mocklab-rule"]).toBe("UNMATCHED");

    const body = getBody();
    expect(body.error).toBe("Unmatched Request");
    expect(body.nearMiss).toBeDefined();
    expect(body.nearMiss.closestRule).toBeDefined();
    expect(body.nearMiss.reason).toContain("did not match pattern");
  });

  it("3. A private project rejects requests without a key with 401 Unauthorized", async () => {
    // Create private project
    const ws = await dataStore.createWorkspace({ name: "Private WS", slug: "privws" });
    const privateProj = await dataStore.createProject({
      workspaceId: ws.id,
      name: "Private API",
      slug: "private-api",
      mockAuth: MockAuth.PRIVATE,
    });

    const { req, res, getStatus, getBody } = createMockReqRes({
      method: "GET",
      originalUrl: "/m/private-api/data",
    });
    req.params.slug = "private-api";

    // Request without key
    await mockController.handleMockRequest(req, res);
    expect(getStatus()).toBe(401);
    expect(getBody().error).toBe("Unauthorized");

    // Request with valid X-MockLab-Key header
    const { req: authReq, res: authRes, getStatus: getAuthStatus } = createMockReqRes({
      method: "GET",
      originalUrl: "/m/private-api/data",
      headers: { "x-mocklab-key": "mk_live_secret123" },
    });
    authReq.params.slug = "private-api";

    await mockController.handleMockRequest(authReq, authRes);
    // Should pass auth check (may 404 if no rules, but not 401)
    expect(getAuthStatus()).not.toBe(401);
  });

  it("4. A paused project returns 503 Service Unavailable with explanatory JSON", async () => {
    await dataStore.updateProjectStatus(projectId, ProjectStatus.PAUSED);

    const { req, res, getStatus, getBody } = createMockReqRes({
      method: "GET",
      originalUrl: "/m/petstore/users",
    });

    await mockController.handleMockRequest(req, res);

    expect(getStatus()).toBe(503);
    expect(getBody().error).toBe("Project Paused");
    expect(getBody().message).toContain("mock server is currently paused");
  });
});
