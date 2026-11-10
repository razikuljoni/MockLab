import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import { LogsService } from "./logs.service";
import { RequestLoggerService } from "./request-logger.service";
import { AuthGuard } from "../auth/auth.guard";
import { RolesGuard } from "../auth/roles.guard";

@Controller("api/v1/projects/:id/logs")
@UseGuards(AuthGuard, RolesGuard)
export class LogsController {
  constructor(
    private readonly logsService: LogsService,
    private readonly requestLogger: RequestLoggerService
  ) {}

  @Get()
  async listLogs(
    @Param("id") projectId: string,
    @Query("method") method?: string,
    @Query("statusClass") statusClass?: string,
    @Query("onlyUnmatched") onlyUnmatched?: string,
    @Query("path") path?: string,
    @Query("ruleId") ruleId?: string,
    @Query("page") page?: string,
    @Query("limit") limit?: string
  ) {
    return this.logsService.listLogs(
      projectId,
      {
        method,
        statusClass,
        onlyUnmatched: onlyUnmatched === "true",
        path,
        ruleId,
      },
      {
        page: page ? parseInt(page, 10) : 1,
        limit: limit ? parseInt(limit, 10) : 50,
      }
    );
  }

  @Get(":logId")
  async getLogById(
    @Param("id") projectId: string,
    @Param("logId") logId: string
  ) {
    return this.logsService.getLogById(projectId, logId);
  }

  @Post(":logId/create-rule")
  @HttpCode(HttpStatus.CREATED)
  async createRuleFromLog(
    @Param("id") projectId: string,
    @Param("logId") logId: string
  ) {
    return this.logsService.createRuleFromLog(projectId, logId);
  }

  @Post("flush")
  @HttpCode(HttpStatus.OK)
  async flushBuffer() {
    const written = await this.requestLogger.flush();
    return { success: true, flushed: written };
  }

  @Post("purge")
  @HttpCode(HttpStatus.OK)
  async purgeLogs(
    @Param("id") projectId: string,
    @Body() body?: { retentionDays?: number; maxRows?: number }
  ) {
    return this.logsService.purgeLogs(
      projectId,
      body?.retentionDays ?? 14,
      body?.maxRows ?? 2500
    );
  }
}
