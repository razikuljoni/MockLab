import { Injectable, NotFoundException } from "@nestjs/common";
import { DataStoreService } from "../prisma/data-store.service";

@Injectable()
export class LogsService {
  constructor(private readonly dataStore: DataStoreService) {}

  async listLogs(
    projectId: string,
    filters?: {
      method?: string;
      statusClass?: string;
      onlyUnmatched?: boolean;
      path?: string;
      ruleId?: string;
    },
    pagination?: { page?: number; limit?: number }
  ) {
    const project = await this.dataStore.findProjectById(projectId);
    if (!project) throw new NotFoundException("Project not found");

    return this.dataStore.listRequestLogs(projectId, filters, pagination);
  }

  async getLogById(projectId: string, logId: string) {
    const project = await this.dataStore.findProjectById(projectId);
    if (!project) throw new NotFoundException("Project not found");

    const log = await this.dataStore.findRequestLogById(logId);
    if (!log || log.projectId !== projectId) {
      throw new NotFoundException("Request log not found");
    }

    return log;
  }

  /**
   * Fast path from "Why did this 404?" to a fix (§6.4 & §10 F5):
   * Prefills and creates a working rule from an actual logged request.
   */
  async createRuleFromLog(projectId: string, logId: string) {
    const log = await this.getLogById(projectId, logId);

    // Extract matcher from actual request
    const matcher: Record<string, any> = {
      method: log.method,
      path: log.path,
    };

    // Include non-standard request headers if present
    if (log.requestHeaders) {
      const customHeaders: Record<string, string> = {};
      for (const [k, v] of Object.entries(log.requestHeaders)) {
        if (!["host", "user-agent", "accept", "connection", "content-length"].includes(k.toLowerCase())) {
          customHeaders[k] = v;
        }
      }
      if (Object.keys(customHeaders).length > 0) {
        matcher.headers = customHeaders;
      }
    }

    const defaultResponse = {
      status: 200,
      headers: { "Content-Type": "application/json" },
      body: {
        message: `Success response generated from request ${log.method} ${log.path}`,
        matchedFromLog: log.id,
      },
      latencyMs: 0,
    };

    const newRule = await this.dataStore.createMockRule({
      projectId,
      operationId: `${log.method} ${log.path}`,
      priority: 0, // High priority so it immediately matches
      name: `Fix: ${log.method} ${log.path}`,
      enabled: true,
      generated: false,
      edited: true,
      matcher,
      response: defaultResponse,
    });

    return {
      message: "Successfully created and activated rule from request log",
      rule: newRule,
    };
  }

  async purgeLogs(projectId: string, retentionDays = 14, maxRows = 2500) {
    const project = await this.dataStore.findProjectById(projectId);
    if (!project) throw new NotFoundException("Project not found");

    const count = await this.dataStore.purgeRequestLogs(projectId, retentionDays, maxRows);
    return { success: true, purged: count, projectId };
  }
}
