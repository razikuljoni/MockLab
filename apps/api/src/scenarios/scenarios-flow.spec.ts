import { describe, it, expect, beforeEach } from "vitest";
import { DataStoreService } from "../prisma/data-store.service";
import { PrismaService } from "../prisma/prisma.service";
import { MockEngineService } from "../mock/mock-engine.service";
import { MockStateService } from "./mock-state.service";
import { ScenariosService } from "./scenarios.service";
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

describe("Phase 6 Stateful Scenarios & Buckets Acceptance Suite", () => {
  let dataStore: DataStoreService;
  let mockEngine: MockEngineService;
  let mockState: MockStateService;
  let scenariosService: ScenariosService;
  let mockController: MockController;
  let projectId: string;

  beforeEach(async () => {
    const mockPrisma = {} as PrismaService;
    dataStore = new DataStoreService(mockPrisma);
    dataStore.clear();

    mockEngine = new MockEngineService();
    mockState = new MockStateService();
    // Initialize in-memory mode
    await mockState.onModuleInit();

    scenariosService = new ScenariosService(dataStore, mockState);
    mockController = new MockController(dataStore, mockEngine, mockState);

    const ws = await dataStore.createWorkspace({ name: "Scenarios WS", slug: "scenariosws" });
    const project = await dataStore.createProject({
      workspaceId: ws.id,
      name: "Petstore",
      slug: "petstore",
      mockAuth: MockAuth.PUBLIC,
    });
    projectId = project.id;
  });

  it("1. F2 Acceptance Criteria: POST creates with UUID -> GET returns it -> Scenarios shows stored object -> Reset -> GET 404", async () => {
    // 1. POST /m/petstore/pets creates item with server-generated UUID (never trust client body id)
    const postReq: any = {
      params: { slug: "petstore" },
      originalUrl: "/m/petstore/pets",
      method: "POST",
      query: {},
      headers: {},
      body: { id: "new", name: "Fido", tag: "dog" },
    };
    const postRes = createMockResponse();
    await mockController.handleMockRequest(postReq, postRes as any);

    expect(postRes._statusCode).toBe(201);
    expect(postRes._body.name).toBe("Fido");
    expect(postRes._body.tag).toBe("dog");
    // Verify server-generated UUID (not client "new")
    expect(postRes._body.id).not.toBe("new");
    expect(typeof postRes._body.id).toBe("string");
    expect(postRes._body.id.length).toBeGreaterThan(10);
    const createdId = postRes._body.id;

    // 2. GET /m/petstore/pets/:id returns stored object
    const getReq: any = {
      params: { slug: "petstore" },
      originalUrl: `/m/petstore/pets/${createdId}`,
      method: "GET",
      query: {},
      headers: {},
      body: {},
    };
    const getRes = createMockResponse();
    await mockController.handleMockRequest(getReq, getRes as any);

    expect(getRes._statusCode).toBe(200);
    expect(getRes._body.id).toBe(createdId);
    expect(getRes._body.name).toBe("Fido");

    // 3. Scenarios overview & bucket listing shows the stored object
    const bucketOverview = await scenariosService.listBucketItems(projectId, "pets", "default");
    expect(bucketOverview.count).toBe(1);
    expect(bucketOverview.items[0].id).toBe(createdId);
    expect(bucketOverview.items[0].name).toBe("Fido");

    // 4. Reset state clears bucket
    const resetResult = await scenariosService.resetProjectState(projectId, "default");
    expect(resetResult.success).toBe(true);
    expect(resetResult.cleared).toBeGreaterThanOrEqual(1);

    // 5. GET /m/petstore/pets/:id returns 404 after Reset
    const getAfterResetReq: any = {
      params: { slug: "petstore" },
      originalUrl: `/m/petstore/pets/${createdId}`,
      method: "GET",
      query: {},
      headers: {},
      body: {},
    };
    const getAfterResetRes = createMockResponse();
    await mockController.handleMockRequest(getAfterResetReq, getAfterResetRes as any);

    expect(getAfterResetRes._statusCode).toBe(404);
    expect(getAfterResetRes._body.error).toBe("Not Found");
  });

  it("2. State Isolation: two different scenario keys do not share state", async () => {
    // Client A sends POST under scenario "test-run-A"
    const reqA: any = {
      params: { slug: "petstore" },
      originalUrl: "/m/petstore/pets",
      method: "POST",
      query: {},
      headers: { "x-mocklab-scenario": "test-run-A" },
      body: { name: "Pet A" },
    };
    const resA = createMockResponse();
    await mockController.handleMockRequest(reqA, resA as any);
    expect(resA._statusCode).toBe(201);
    const idA = resA._body.id;

    // Client B sends POST under scenario "test-run-B"
    const reqB: any = {
      params: { slug: "petstore" },
      originalUrl: "/m/petstore/pets",
      method: "POST",
      query: {},
      headers: { "x-mocklab-scenario": "test-run-B" },
      body: { name: "Pet B" },
    };
    const resB = createMockResponse();
    await mockController.handleMockRequest(reqB, resB as any);
    expect(resB._statusCode).toBe(201);
    const idB = resB._body.id;

    // Client A lists pets -> should contain only Pet A
    const listA: any = {
      params: { slug: "petstore" },
      originalUrl: "/m/petstore/pets",
      method: "GET",
      query: {},
      headers: { "x-mocklab-scenario": "test-run-A" },
      body: {},
    };
    const resListA = createMockResponse();
    await mockController.handleMockRequest(listA, resListA as any);
    expect(resListA._statusCode).toBe(200);
    expect(resListA._body.length).toBe(1);
    expect(resListA._body[0].id).toBe(idA);
    expect(resListA._body[0].name).toBe("Pet A");

    // Client B fetches Pet A's ID -> should return 404 because state is isolated
    const getIsolatedReq: any = {
      params: { slug: "petstore" },
      originalUrl: `/m/petstore/pets/${idA}`,
      method: "GET",
      query: {},
      headers: { "x-mocklab-scenario": "test-run-B" },
      body: {},
    };
    const resIsolated = createMockResponse();
    await mockController.handleMockRequest(getIsolatedReq, resIsolated as any);
    expect(resIsolated._statusCode).toBe(404);
  });

  it("3. Nonce Client IDs: a client sending id: 'new' twice creates two distinct objects", async () => {
    // 1st request
    const req1: any = {
      params: { slug: "petstore" },
      originalUrl: "/m/petstore/pets",
      method: "POST",
      query: {},
      headers: {},
      body: { id: "new", name: "First Dog" },
    };
    const res1 = createMockResponse();
    await mockController.handleMockRequest(req1, res1 as any);
    expect(res1._statusCode).toBe(201);
    const id1 = res1._body.id;

    // 2nd request with same body id: "new"
    const req2: any = {
      params: { slug: "petstore" },
      originalUrl: "/m/petstore/pets",
      method: "POST",
      query: {},
      headers: {},
      body: { id: "new", name: "Second Dog" },
    };
    const res2 = createMockResponse();
    await mockController.handleMockRequest(req2, res2 as any);
    expect(res2._statusCode).toBe(201);
    const id2 = res2._body.id;

    expect(id1).not.toBe(id2);

    // List all
    const listReq: any = {
      params: { slug: "petstore" },
      originalUrl: "/m/petstore/pets",
      method: "GET",
      query: {},
      headers: {},
      body: {},
    };
    const resList = createMockResponse();
    await mockController.handleMockRequest(listReq, resList as any);
    expect(resList._statusCode).toBe(200);
    expect(resList._body.length).toBe(2);
    const ids = resList._body.map((item: any) => item.id);
    expect(ids).toContain(id1);
    expect(ids).toContain(id2);
  });

  it("4. Scenario State Machine & Stepper: Order lifecycle transitions (Created -> Paid -> Shipped)", async () => {
    // Apply template
    const templateResult = await scenariosService.applyTemplate(projectId, "default", "orders");
    expect(templateResult.scenario?.name).toBe("order-lifecycle");
    expect(templateResult.scenario?.currentState).toBe("created");

    // Transition via mock request: POST /m/petstore/orders/ord-999/pay
    const payReq: any = {
      params: { slug: "petstore" },
      originalUrl: "/m/petstore/orders/ord-999/pay",
      method: "POST",
      query: {},
      headers: {},
      body: {},
    };
    const payRes = createMockResponse();
    await mockController.handleMockRequest(payReq, payRes as any);

    expect(payRes._statusCode).toBe(200);
    expect(payRes._body.state).toBe("paid");

    const scenario = await mockState.getScenario(projectId, "default", "order-lifecycle");
    expect(scenario?.currentState).toBe("paid");

    // Stepper transition to shipped
    const shippedRes = await scenariosService.transitionScenarioState(
      projectId,
      "default",
      "order-lifecycle",
      "shipped",
      "Manual Stepper Transition"
    );
    expect(shippedRes?.currentState).toBe("shipped");
  });
});
