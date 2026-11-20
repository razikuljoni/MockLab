import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
  Optional,
  NotFoundException,
} from "@nestjs/common";
import { ContractRunnerService, RunContractOptions } from "./contract-runner.service";
import { DataStoreService } from "../prisma/data-store.service";
import { ProductionQueueService } from "../queue/production-queue.service";
import { AuthGuard } from "../auth/auth.guard";
import { RolesGuard } from "../auth/roles.guard";
import { RunStatus } from "@prisma/client";

@Controller("api/v1/projects/:id/contracts")
@UseGuards(AuthGuard, RolesGuard)
export class ContractsController {
  constructor(
    private readonly runnerService: ContractRunnerService,
    private readonly dataStore: DataStoreService,
    @Optional() private readonly queueService?: ProductionQueueService
  ) {}

  @Get("expectations")
  async listExpectations(@Param("id") projectId: string) {
    return this.dataStore.listExpectations(projectId);
  }

  @Post("expectations")
  @HttpCode(HttpStatus.CREATED)
  async createExpectation(
    @Param("id") projectId: string,
    @Body() body: any
  ) {
    return this.dataStore.createExpectation({
      projectId,
      operationId: body.operationId,
      name: body.name || `Expectation for ${body.operationId}`,
      providerState: body.providerState || null,
      request: body.request,
      expectedStatus: body.expectedStatus || 200,
      expectedSchema: body.expectedSchema || { type: "object" },
      matchers: body.matchers || {},
      generated: false,
      enabled: body.enabled ?? true,
    });
  }

  @Post("expectations/generate")
  @HttpCode(HttpStatus.OK)
  async generateFromSpec(@Param("id") projectId: string) {
    const generated = await this.runnerService.generateFromSpec(projectId);
    return {
      message: `Generated ${generated.length} contract expectations from latest OpenAPI specification`,
      count: generated.length,
      expectations: generated,
    };
  }

  @Patch("expectations/:expId")
  async updateExpectation(
    @Param("id") projectId: string,
    @Param("expId") expId: string,
    @Body() body: any
  ) {
    return this.dataStore.updateExpectation(expId, body);
  }

  @Delete("expectations/:expId")
  @HttpCode(HttpStatus.OK)
  async deleteExpectation(
    @Param("id") projectId: string,
    @Param("expId") expId: string
  ) {
    const deleted = await this.dataStore.deleteExpectation(expId);
    return { success: deleted, id: expId };
  }

  @Post(["run", "runs"])
  @HttpCode(HttpStatus.ACCEPTED)
  async triggerRun(
    @Param("id") projectId: string,
    @Body() options?: RunContractOptions
  ) {
    const project = await this.dataStore.findProjectById(projectId);
    if (!project) throw new NotFoundException("Project not found");

    const spec = await this.dataStore.getLatestSpecVersion(projectId);
    const specHash = spec?.hash || "spec_v1_initial";

    const runRecord = await this.dataStore.createContractRun({
      projectId,
      specHash,
      providerUrl: options?.providerUrlOverride ?? project.realProviderUrl ?? "mock",
      status: RunStatus.PENDING,
      triggeredBy: options?.triggeredBy || "manual",
      durationMs: 0,
      results: [],
    });

    if (this.queueService) {
      await this.queueService.enqueueContractRun({
        runId: runRecord.id,
        projectId,
        triggeredBy: options?.triggeredBy || "manual",
        providerUrlOverride: options?.providerUrlOverride,
        providerAuthOverride: options?.providerAuthOverride,
      });
    } else {
      setImmediate(() => {
        this.runnerService
          .runSuite(projectId, { ...options, runId: runRecord.id })
          .catch((err) => console.error("Async contract run worker error:", err));
      });
    }

    return {
      status: "accepted",
      runId: runRecord.id,
      pollUrl: `/api/v1/projects/${projectId}/contracts/runs/${runRecord.id}`,
    };
  }

  @Get("runs")
  async listRuns(@Param("id") projectId: string) {
    return this.dataStore.listContractRuns(projectId);
  }

  @Get("runs/:runId")
  async getRunDetail(
    @Param("id") projectId: string,
    @Param("runId") runId: string
  ) {
    return this.dataStore.findContractRunById(runId);
  }
}
