import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Res,
  HttpCode,
  HttpStatus,
  UseGuards,
  Optional,
  NotFoundException,
} from "@nestjs/common";
import { Response } from "express";
import { ContractRunnerService, RunContractOptions } from "../contracts/contract-runner.service";
import { CiSchedulerService } from "./ci-scheduler.service";
import { DataStoreService } from "../prisma/data-store.service";
import { ProductionQueueService } from "../queue/production-queue.service";
import { RunStatus, Verdict } from "@prisma/client";

@Controller("api/v1/projects/:id")
export class CiController {
  constructor(
    private readonly runnerService: ContractRunnerService,
    private readonly schedulerService: CiSchedulerService,
    private readonly dataStore: DataStoreService,
    @Optional() private readonly queueService?: ProductionQueueService
  ) {}

  /**
   * External CI Trigger Endpoint (§6.8 & §10)
   * Invoked by GitHub Actions, GitLab CI, or cURL.
   * Asynchronous execution returning HTTP 202 with pollUrl.
   */
  @Post("contract-runs")
  @HttpCode(HttpStatus.ACCEPTED)
  async triggerCiContractRun(
    @Param("id") projectId: string,
    @Body() options?: RunContractOptions,
    @Res({ passthrough: true }) res?: Response
  ) {
    const project = await this.dataStore.findProjectById(projectId);
    if (!project) throw new NotFoundException("Project not found");

    const spec = await this.dataStore.getLatestSpecVersion(projectId);
    const specHash = spec?.hash || "spec_v1_initial";

    const triggeredBy = options?.triggeredBy || "ci:external";
    const runRecord = await this.dataStore.createContractRun({
      projectId,
      specHash,
      providerUrl: options?.providerUrlOverride ?? project.realProviderUrl ?? "mock",
      status: RunStatus.PENDING,
      triggeredBy,
      durationMs: 0,
      results: [],
    });

    if (this.queueService) {
      await this.queueService.enqueueContractRun({
        runId: runRecord.id,
        projectId,
        triggeredBy,
        providerUrlOverride: options?.providerUrlOverride,
        providerAuthOverride: options?.providerAuthOverride,
      });
    } else {
      setImmediate(() => {
        this.runnerService
          .runSuite(projectId, { ...options, triggeredBy, runId: runRecord.id })
          .catch((err) => console.error("Async CI contract run worker error:", err));
      });
    }

    if (res) {
      res.status(HttpStatus.ACCEPTED);
    }

    return {
      status: "accepted",
      runId: runRecord.id,
      pollUrl: `/api/v1/projects/${projectId}/contracts/runs/${runRecord.id}`,
    };
  }

  /**
   * Public SVG Status Badge Endpoint (§6.8 & §10)
   * e.g. [![MockLab Contract](https://mocklab-api-prod.onrender.com/api/v1/projects/:id/badge)](...)
   */
  @Get("badge")
  async getStatusBadge(@Param("id") projectId: string, @Res() res: Response) {
    const runs = await this.dataStore.listContractRuns(projectId);
    const latestRun = runs[0];

    const label = "contract";
    let statusText = "passing";
    let color = "#10b981"; // green

    if (!latestRun) {
      statusText = "unknown";
      color = "#6b7280"; // gray
    } else if (latestRun.status === RunStatus.FAIL_BREAKING) {
      statusText = "failing";
      color = "#ef4444"; // red
    } else if (latestRun.status === RunStatus.ERROR) {
      statusText = "error";
      color = "#f59e0b"; // amber
    }

    const labelWidth = 62;
    const valueWidth = statusText.length * 8 + 16;
    const totalWidth = labelWidth + valueWidth;

    const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="${totalWidth}" height="20" role="img" aria-label="${label}: ${statusText}">
  <linearGradient id="b" x2="0" y2="100%">
    <stop offset="0" stop-color="#bbb" stop-opacity=".1"/>
    <stop offset="1" stop-opacity=".1"/>
  </linearGradient>
  <clipPath id="a">
    <rect width="${totalWidth}" height="20" rx="3" fill="#fff"/>
  </clipPath>
  <g clip-path="url(#a)">
    <rect width="${labelWidth}" height="20" fill="#1e293b"/>
    <rect x="${labelWidth}" width="${valueWidth}" height="20" fill="${color}"/>
    <rect width="${totalWidth}" height="20" fill="url(#b)"/>
  </g>
  <g fill="#fff" text-anchor="middle" font-family="DejaVu Sans,Verdana,Geneva,sans-serif" font-size="11">
    <text x="${labelWidth / 2}" y="15" fill="#010101" fill-opacity=".3">${label}</text>
    <text x="${labelWidth / 2}" y="14">${label}</text>
    <text x="${labelWidth + valueWidth / 2}" y="15" fill="#010101" fill-opacity=".3">${statusText}</text>
    <text x="${labelWidth + valueWidth / 2}" y="14">${statusText}</text>
  </g>
</svg>`.trim();

    res.setHeader("Content-Type", "image/svg+xml; charset=utf-8");
    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
    return res.status(200).send(svg);
  }

  // ── Schedules Endpoints ──

  @Get("schedules")
  async listSchedules(@Param("id") projectId: string) {
    return this.dataStore.listContractSchedules(projectId);
  }

  @Post("schedules")
  @HttpCode(HttpStatus.CREATED)
  async createSchedule(
    @Param("id") projectId: string,
    @Body() body: { name: string; cron: string; enabled?: boolean }
  ) {
    return this.dataStore.createContractSchedule({
      projectId,
      name: body.name,
      cron: body.cron || "0 * * * *", // default hourly
      enabled: body.enabled ?? true,
    });
  }

  @Patch("schedules/:scheduleId")
  async updateSchedule(
    @Param("id") projectId: string,
    @Param("scheduleId") scheduleId: string,
    @Body() body: any
  ) {
    return this.dataStore.updateContractSchedule(scheduleId, body);
  }

  @Delete("schedules/:scheduleId")
  @HttpCode(HttpStatus.OK)
  async deleteSchedule(
    @Param("id") projectId: string,
    @Param("scheduleId") scheduleId: string
  ) {
    const deleted = await this.dataStore.deleteContractSchedule(scheduleId);
    return { success: deleted, id: scheduleId };
  }

  @Post("schedules/:scheduleId/trigger")
  @HttpCode(HttpStatus.OK)
  async triggerScheduleNow(
    @Param("id") projectId: string,
    @Param("scheduleId") scheduleId: string
  ) {
    return this.schedulerService.triggerSchedule(scheduleId);
  }
}
