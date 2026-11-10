import { describe, it, expect, beforeEach } from "vitest";
import { DataStoreService } from "../prisma/data-store.service";
import { ApiKeysService } from "./api-keys.service";
import { ApiKeysController } from "./api-keys.controller";
import { WorkspacesService } from "../workspaces/workspaces.service";
import { WorkspacesController } from "../workspaces/workspaces.controller";
import { MockController } from "../mock/mock.controller";
import { MockEngineService } from "../mock/mock-engine.service";
import { MockStateService } from "../scenarios/mock-state.service";
import { RequestLoggerService } from "../logs/request-logger.service";
import { Role, Plan, MockAuth, ProjectStatus, Protocol } from "@prisma/client";
import { ForbiddenException, NotFoundException } from "@nestjs/common";

describe("Phase 10 API Keys, Rate Limits, Teams, Billing & Settings Acceptance Suite", () => {
  let dataStore: DataStoreService;
  let apiKeysService: ApiKeysService;
  let apiKeysController: ApiKeysController;
  let workspacesService: WorkspacesService;
  let workspacesController: WorkspacesController;
  let mockEngine: MockEngineService;
  let mockState: MockStateService;
  let requestLogger: RequestLoggerService;
  let mockController: MockController;

  let ownerUser: { id: string; email: string };
  let editorUser: { id: string; email: string };
  let workspace: { id: string; name: string; slug: string };
  let project: { id: string; name: string; slug: string };

  beforeEach(async () => {
    dataStore = new DataStoreService();
    dataStore.clear();

    apiKeysService = new ApiKeysService(dataStore);
    apiKeysController = new ApiKeysController(apiKeysService);
    workspacesService = new WorkspacesService(dataStore);
    workspacesController = new WorkspacesController(workspacesService);

    mockEngine = new MockEngineService();
    mockState = new MockStateService(dataStore);
    requestLogger = new RequestLoggerService(dataStore);
    mockController = new MockController(
      dataStore,
      mockEngine,
      mockState,
      requestLogger,
      apiKeysService
    );

    // Setup initial workspace with Owner and Editor
    ownerUser = await dataStore.createUser({
      email: "owner@mocklab.io",
      name: "Owner User",
      passwordHash: "hash123",
    });

    editorUser = await dataStore.createUser({
      email: "editor@mocklab.io",
      name: "Editor User",
      passwordHash: "hash456",
    });

    workspace = await dataStore.createWorkspace({
      name: "Acme Corp",
      slug: "acme-corp",
      plan: Plan.FREE,
    });

    await dataStore.addWorkspaceMember(workspace.id, ownerUser.id, Role.OWNER);
    await dataStore.addWorkspaceMember(workspace.id, editorUser.id, Role.EDITOR);

    // Setup project with PRIVATE mockAuth requiring API key
    project = await dataStore.createProject({
      workspaceId: workspace.id,
      name: "Payment API",
      slug: "payments-mock",
      environment: "development",
      status: ProjectStatus.LIVE,
      mockAuth: MockAuth.PRIVATE,
      protocol: Protocol.REST,
      realProviderUrl: null,
      realProviderAuth: null,
    });

    // Create a mock rule for GET /charges
    await dataStore.createMockRule({
      projectId: project.id,
      operationId: "GET /charges",
      name: "List Charges",
      priority: 1,
      enabled: true,
      matcher: { method: "GET", path: "/charges" },
      response: {
        statusCode: 200,
        headers: { "Content-Type": "application/json" },
        body: [{ id: "ch_123", amount: 2000, currency: "usd" }],
      },
    });
  });

  it("1. Acceptance Criteria: Revoked key is rejected with 401 Unauthorized", async () => {
    // Generate an API key
    const { rawKey, key } = await apiKeysService.createKey(workspace.id, {
      name: "CI Key",
      prefix: "mk_live_",
      rateLimitPerMin: 100,
    });

    expect(rawKey.startsWith("mk_live_")).toBe(true);
    expect(key.last4).toBe(rawKey.slice(-4));
    expect(key.revokedAt).toBeNull();

    // Verify key works initially
    let statusSent: number = 0;
    let jsonSent: any = null;
    const mockRes = () => ({
      status: (s: number) => {
        statusSent = s;
        return { json: (j: any) => (jsonSent = j) };
      },
      setHeader: () => {},
    });

    await mockController.handleMockRequest(
      {
        params: { slug: "payments-mock" },
        originalUrl: "/m/payments-mock/charges",
        method: "GET",
        headers: { "x-mocklab-key": rawKey },
      } as any,
      mockRes() as any
    );

    expect(statusSent).toBe(200);
    expect(jsonSent).toEqual([{ id: "ch_123", amount: 2000, currency: "usd" }]);

    // Revoke the key
    await apiKeysService.revokeKey(workspace.id, key.id);

    // Try accessing mock with revoked key -> rejected with 401
    await mockController.handleMockRequest(
      {
        params: { slug: "payments-mock" },
        originalUrl: "/m/payments-mock/charges",
        method: "GET",
        headers: { "x-mocklab-key": rawKey },
      } as any,
      mockRes() as any
    );

    expect(statusSent).toBe(401);
    expect(jsonSent.error).toBe("Unauthorized");
    expect(jsonSent.message).toContain("revoked");
  });

  it("2. Acceptance Criteria: Rate-limited key gets 429 with Retry-After header", async () => {
    // Create key with strict limit of 3 requests per minute
    const { rawKey } = await apiKeysService.createKey(workspace.id, {
      name: "Restricted Key",
      prefix: "mk_test_",
      rateLimitPerMin: 3,
    });

    let headersSet: Record<string, string> = {};
    let statusSent = 0;
    let jsonSent: any = null;

    const mockRes = () => ({
      status: (s: number) => {
        statusSent = s;
        return { json: (j: any) => (jsonSent = j) };
      },
      setHeader: (name: string, val: string) => {
        headersSet[name.toLowerCase()] = val;
      },
    });

    // Make 3 allowed requests
    for (let i = 0; i < 3; i++) {
      await mockController.handleMockRequest(
        {
          params: { slug: "payments-mock" },
          originalUrl: "/m/payments-mock/charges",
          method: "GET",
          headers: { "x-mocklab-key": rawKey },
        } as any,
        mockRes() as any
      );
      expect(statusSent).toBe(200);
    }

    // 4th request exceeds rate limit -> 429 with Retry-After
    await mockController.handleMockRequest(
      {
        params: { slug: "payments-mock" },
        originalUrl: "/m/payments-mock/charges",
        method: "GET",
        headers: { "x-mocklab-key": rawKey },
      } as any,
      mockRes() as any
    );

    expect(statusSent).toBe(429);
    expect(jsonSent.error).toBe("Too Many Requests");
    expect(jsonSent.message).toContain("Rate limit of 3 req/min exceeded");
    expect(headersSet["retry-after"]).toBeDefined();
    expect(Number(headersSet["retry-after"])).toBeGreaterThan(0);
  });

  it("3. Acceptance Criteria: Editor role cannot access billing or delete workspace (403)", async () => {
    // Editor attempts to access billing -> 403 Forbidden
    await expect(
      workspacesService.getBilling(workspace.id, editorUser.id)
    ).rejects.toThrow(ForbiddenException);

    // Editor attempts to update billing plan -> 403 Forbidden
    await expect(
      workspacesService.updateBilling(workspace.id, editorUser.id, Plan.PRO)
    ).rejects.toThrow(ForbiddenException);

    // Editor attempts to delete workspace -> 403 Forbidden
    await expect(
      workspacesService.deleteWorkspace(workspace.id, editorUser.id)
    ).rejects.toThrow(ForbiddenException);

    // Owner CAN access billing
    const billing = await workspacesService.getBilling(workspace.id, ownerUser.id);
    expect(billing.plan).toBe(Plan.FREE);
    expect(billing.limits.price).toBe(0);
    expect(billing.limits.mockRequests).toBe(10000);
    expect(billing.usage.projectsCount).toBe(1);

    // Owner CAN update billing plan
    const updatedBilling = await workspacesService.updateBilling(
      workspace.id,
      ownerUser.id,
      Plan.PRO
    );
    expect(updatedBilling.plan).toBe(Plan.PRO);
    expect(updatedBilling.limits.price).toBe(19);
    expect(updatedBilling.limits.mockRequests).toBe(250000);

    // Owner CAN delete workspace
    const deleteRes = await workspacesService.deleteWorkspace(workspace.id, ownerUser.id);
    expect(deleteRes.success).toBe(true);
  });

  it("4. Workspace Settings and Danger Zone: Pause All Mocks pauses all projects", async () => {
    // Create a 2nd project in workspace
    const project2 = await dataStore.createProject({
      workspaceId: workspace.id,
      name: "Orders API",
      slug: "orders-mock",
      environment: "staging",
      status: ProjectStatus.LIVE,
      mockAuth: MockAuth.PUBLIC,
      protocol: Protocol.REST,
      realProviderUrl: null,
      realProviderAuth: null,
    });

    expect(project.status).toBe(ProjectStatus.LIVE);
    expect(project2.status).toBe(ProjectStatus.LIVE);

    // Owner pauses all mocks
    const pauseRes = await workspacesService.pauseAllProjects(workspace.id, ownerUser.id);
    expect(pauseRes.success).toBe(true);
    expect(pauseRes.pausedCount).toBe(2);

    const checkProj1 = await dataStore.findProjectById(project.id);
    const checkProj2 = await dataStore.findProjectById(project2.id);

    expect(checkProj1?.status).toBe(ProjectStatus.PAUSED);
    expect(checkProj2?.status).toBe(ProjectStatus.PAUSED);

    // Mocks now return 503 Service Unavailable
    let statusSent = 0;
    let jsonSent: any = null;
    const mockRes = () => ({
      status: (s: number) => {
        statusSent = s;
        return { json: (j: any) => (jsonSent = j) };
      },
      setHeader: () => {},
    });

    await mockController.handleMockRequest(
      {
        params: { slug: "orders-mock" },
        originalUrl: "/m/orders-mock/orders",
        method: "GET",
        headers: {},
      } as any,
      mockRes() as any
    );

    expect(statusSent).toBe(503);
    expect(jsonSent.error).toBe("Project Paused");
  });

  it("5. Team Member Management: Owner invites Admin, updates role, and removes member", async () => {
    // Owner invites new member as ADMIN
    const inviteRes = await workspacesService.inviteMember(
      workspace.id,
      ownerUser.id,
      { email: "colleague@mocklab.io", role: Role.ADMIN }
    );
    expect(inviteRes.success).toBe(true);
    expect(inviteRes.member.role).toBe(Role.ADMIN);
    expect(inviteRes.member.email).toBe("colleague@mocklab.io");

    // List members
    const members = await workspacesService.listMembers(workspace.id, ownerUser.id);
    expect(members.length).toBe(3); // Owner, Editor, Admin

    // Demote invited user to VIEWER
    const updatedMember = await workspacesService.updateMemberRole(
      workspace.id,
      ownerUser.id,
      inviteRes.member.userId,
      Role.VIEWER
    );
    expect(updatedMember?.role).toBe(Role.VIEWER);

    // Remove member
    const removeRes = await workspacesService.removeMember(
      workspace.id,
      ownerUser.id,
      inviteRes.member.userId
    );
    expect(removeRes.success).toBe(true);

    const membersAfter = await workspacesService.listMembers(workspace.id, ownerUser.id);
    expect(membersAfter.length).toBe(2);
  });
});
