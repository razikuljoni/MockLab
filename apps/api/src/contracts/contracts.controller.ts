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
} from "@nestjs/common";
import { ContractRunnerService, RunContractOptions } from "./contract-runner.service";
import { DataStoreService } from "../prisma/data-store.service";
import { AuthGuard } from "../auth/auth.guard";
import { RolesGuard } from "../auth/roles.guard";

@Controller("api/v1/projects/:id/contracts")
@UseGuards(AuthGuard, RolesGuard)
export class ContractsController {
  constructor(
    private readonly runnerService: ContractRunnerService,
    private readonly dataStore: DataStoreService
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

  @Post("runs")
  @HttpCode(HttpStatus.OK)
  async triggerRun(
    @Param("id") projectId: string,
    @Body() options?: RunContractOptions
  ) {
    return this.runnerService.runSuite(projectId, options);
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
