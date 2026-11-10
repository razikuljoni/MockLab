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
} from "@nestjs/common";
import { Response } from "express";
import { ContractRunnerService, RunContractOptions } from "../contracts/contract-runner.service";
import { CiSchedulerService } from "./ci-scheduler.service";
import { DataStoreService } from "../prisma/data-store.service";
import { RunStatus, Verdict } from "@prisma/client";

@Controller("api/v1/projects/:id")
export class CiController {
  constructor(
    private readonly runnerService: ContractRunnerService,
    private readonly schedulerService: CiSchedulerService,
    private readonly dataStore: DataStoreService
  ) {}

  /**
   * External CI Trigger Endpoint (§6.8 & §10)
   * Invoked by GitHub Actions, GitLab CI, or cURL.
   */
  @Post("contract-runs")
  @HttpCode(HttpStatus.OK)
  async triggerCiContractRun(
    @Param("id") projectId: string,
    @Body() options?: RunContractOptions,
    @Res() res?: Response
  ) {
    const runResult = await this.runnerService.runSuite(projectId, {
      ...options,
      triggeredBy: options?.triggeredBy || "ci:external",
    });

    const isFailing = runResult.status === RunStatus.FAIL_BREAKING;
    const responsePayload = {
      passed: !isFailing && runResult.status === RunStatus.PASS,
      status: runResult.status,
      runId: runResult.id,
      specHash: runResult.specHash,
      durationMs: runResult.durationMs,
      summary: {
        total: runResult.results.length,
        pass: runResult.results.filter((r) => r.verdict === Verdict.PASS).length,
        breaking: runResult.results.filter((r) => r.verdict === Verdict.BREAKING).length,
        nonBreaking: runResult.results.filter((r) => r.verdict === Verdict.NON_BREAKING).length,
        error: runResult.results.filter((r) => r.verdict === Verdict.ERROR).length,
      },
    };

    if (res) {
      // If breaking changes detected, send 400 or payload with failure indication so CI exits non-zero
      if (isFailing) {
        return res.status(HttpStatus.BAD_REQUEST).json(responsePayload);
      }
      return res.status(HttpStatus.OK).json(responsePayload);
    }

    return responsePayload;
  }

  /**
   * Public SVG Status Badge Endpoint (§6.8 & §10)
   * e.g. [![MockLab Contract](https://mocklab.dev/api/v1/projects/:id/badge)](...)
   */
  @Get("badge")
  async getStatusBadge(@Param("id") projectId: string, @Res() res: Response) {
    const runs = await this.dataStore.listContractRuns(projectId);
    const latestRun = runs[0];

    let label = "contract";
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
