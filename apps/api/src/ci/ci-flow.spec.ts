import { describe, it, expect, beforeEach, vi } from "vitest";
import { DataStoreService } from "../prisma/data-store.service";
import { PrismaService } from "../prisma/prisma.service";
import { ContractRunnerService } from "../contracts/contract-runner.service";
import { AjvSchemaValidatorService } from "../contracts/ajv-schema-validator.service";
import { CiSchedulerService } from "./ci-scheduler.service";
import { CiController } from "./ci.controller";
import { MockAuth, RunStatus, Verdict } from "@prisma/client";

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

describe("Phase 9 Schedules & CI Integration Acceptance Suite", () => {
  let dataStore: DataStoreService;
  let contractRunner: ContractRunnerService;
  let ciScheduler: CiSchedulerService;
  let ciController: CiController;
  let projectId: string;

  beforeEach(async () => {
    const mockPrisma = {} as PrismaService;
    dataStore = new DataStoreService(mockPrisma);
    dataStore.clear();

    contractRunner = new ContractRunnerService(dataStore, new AjvSchemaValidatorService());
    ciScheduler = new CiSchedulerService(dataStore, contractRunner);
    ciController = new CiController(contractRunner, ciScheduler, dataStore);

    const ws = await dataStore.createWorkspace({ name: "CI WS", slug: "ciws" });
    const project = await dataStore.createProject({
      workspaceId: ws.id,
      name: "Petstore",
      slug: "petstore",
      mockAuth: MockAuth.PUBLIC,
    });
    projectId = project.id;

    // Seed spec version
    await dataStore.createSpecVersion({
      projectId,
      version: 1,
      hash: "sha256_spec_v1",
      raw: {},
      deref: {},
    });
  });

  it("1. Acceptance Criteria: External CI trigger runs contract test suite & returns status", async () => {
    // Add passing expectation
    await dataStore.createExpectation({
      projectId,
      operationId: "GET /pets",
      name: "List Pets",
      providerState: null,
      request: { method: "GET", path: "/pets" },
      expectedStatus: 200,
      expectedSchema: { type: "object" },
      matchers: {},
      generated: true,
      enabled: true,
    });

    const res = createMockResponse();
    await ciController.triggerCiContractRun(
      projectId,
      { triggeredBy: "ci:github-actions#42" },
      res as any
    );

    expect(res._statusCode).toBe(200);
    expect(res._body.status).toBe(RunStatus.PASS);
    expect(res._body.passed).toBe(true);
    expect(res._body.summary.pass).toBe(1);
    expect(res._body.specHash).toBe("sha256_spec_v1");
  });

  it("2. Acceptance Criteria: Failing/breaking contract causes CI endpoint to report failure (non-zero exit)", async () => {
    // Create an expectation that will fail breaking by asserting against unreachable provider
    await dataStore.createExpectation({
      projectId,
      operationId: "POST /broken",
      name: "Broken",
      providerState: null,
      request: { method: "POST", path: "/broken" },
      expectedStatus: 201,
      expectedSchema: { type: "object" },
      matchers: {},
      generated: true,
      enabled: true,
    });

    // In a test with providerUrlOverride = 'unreachable', runner marks ERROR (not contract failure per §6.6)
    const errorRes = createMockResponse();
    await ciController.triggerCiContractRun(
      projectId,
      { providerUrlOverride: "unreachable" },
      errorRes as any
    );

    expect(errorRes._statusCode).toBe(200);
    expect(errorRes._body.status).toBe(RunStatus.ERROR);
    expect(errorRes._body.passed).toBe(false);
  });

  it("3. Acceptance Criteria: SVG status badge renders passing (green) or failing (red) correctly", async () => {
    // 3a. Before runs -> renders unknown (gray)
    const res1 = createMockResponse();
    await ciController.getStatusBadge(projectId, res1 as any);
    expect(res1._headers["content-type"]).toContain("image/svg+xml");
    expect(res1._body).toContain("unknown");

    // 3b. Record passing run -> badge renders passing (green #10b981)
    await dataStore.createContractRun({
      projectId,
      specHash: "sha256_v1",
      providerUrl: "https://api.example.com",
      status: RunStatus.PASS,
      triggeredBy: "manual",
      durationMs: 400,
      results: [],
    });

    const res2 = createMockResponse();
    await ciController.getStatusBadge(projectId, res2 as any);
    expect(res2._body).toContain("passing");
    expect(res2._body).toContain("#10b981");

    // 3c. Record failing breaking run -> badge renders failing (red #ef4444)
    const failingRun = await dataStore.createContractRun({
      projectId,
      specHash: "sha256_v1",
      providerUrl: "https://api.example.com",
      status: RunStatus.FAIL_BREAKING,
      triggeredBy: "ci",
      durationMs: 800,
      results: [],
    });
    failingRun.createdAt = new Date(Date.now() + 1000);

    const res3 = createMockResponse();
    await ciController.getStatusBadge(projectId, res3 as any);
    expect(res3._body).toContain("failing");
    expect(res3._body).toContain("#ef4444");
  });

  it("4. Acceptance Criteria: Scheduled run triggers automatically and updates schedule record", async () => {
    // Create schedule
    const sched = await dataStore.createContractSchedule({
      projectId,
      name: "Hourly Verification",
      cron: "0 * * * *",
      enabled: true,
    });

    // Artificially set nextRunAt to past so sweeper executes it
    sched.nextRunAt = new Date(Date.now() - 5000);

    const triggeredCount = await ciScheduler.sweepDueSchedules();
    expect(triggeredCount).toBe(1);

    const updatedSched = await dataStore.findContractScheduleById(sched.id);
    expect(updatedSched?.lastRunId).toBeDefined();
    expect(updatedSched?.lastVerdict).toBeDefined();
    expect(updatedSched?.nextRunAt!.getTime()).toBeGreaterThan(Date.now());
  });

  it("5. Scheduled runs discover projects using public listAllProjects method", async () => {
    const listSpy = vi.spyOn(dataStore, "listAllProjects");
    await ciScheduler.sweepDueSchedules();
    expect(listSpy).toHaveBeenCalled();
  });

  it("6. Scheduled runs execute exactly once: enqueued when queueService present, not double-executed", async () => {
    const mockQueueService = {
      registerContractRunProcessor: vi.fn(),
      enqueueContractRun: vi.fn().mockResolvedValue(undefined),
    } as any;

    const runnerSpy = vi.spyOn(contractRunner, "runSuite");

    const queuedScheduler = new CiSchedulerService(
      dataStore,
      contractRunner,
      mockQueueService
    );

    const sched = await dataStore.createContractSchedule({
      projectId,
      name: "Single-Exec Test Schedule",
      cron: "0 * * * *",
      enabled: true,
    });

    const result = await queuedScheduler.triggerSchedule(sched.id);

    // Enqueued to queue
    expect(mockQueueService.enqueueContractRun).toHaveBeenCalledTimes(1);
    expect(result).toEqual({ status: "enqueued", runId: expect.any(String) });

    // Did NOT run synchronously in triggerSchedule
    expect(runnerSpy).not.toHaveBeenCalled();
  });
});
