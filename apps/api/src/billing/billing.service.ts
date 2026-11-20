import { Injectable, Logger, NotFoundException } from "@nestjs/common";
import { DataStoreService } from "../prisma/data-store.service";
import { Plan } from "@prisma/client";
import { WORKSPACE_TIER_LIMITS } from "@mocklab/shared";

export interface WorkspaceUsageReport {
  plan: Plan;
  requestsThisMonth: number;
  requestsLimit: number;
  projectsCount: number;
  projectsLimit: number;
  rulesCount: number;
  rulesLimit: number;
  teamMembersCount: number;
  teamMembersLimit: number;
}

@Injectable()
export class BillingService {
  private readonly logger = new Logger(BillingService.name);

  constructor(private readonly dataStore: DataStoreService) {}

  async getUsage(workspaceId: string): Promise<WorkspaceUsageReport> {
    const ws = await this.dataStore.findWorkspaceById(workspaceId);
    if (!ws) throw new NotFoundException("Workspace not found");

    const projects = await this.dataStore.listWorkspaceProjects(workspaceId);
    let rulesCount = 0;
    let requestsThisMonth = 0;

    for (const p of projects) {
      const rules = await this.dataStore.listMockRules(p.id);
      rulesCount += rules.length;
      const logsResult = await this.dataStore.listRequestLogs(p.id);
      requestsThisMonth += logsResult.total;
    }

    const members = await this.dataStore.listWorkspaceMembers(workspaceId);

    const limits =
      WORKSPACE_TIER_LIMITS[ws.plan as keyof typeof WORKSPACE_TIER_LIMITS] ||
      WORKSPACE_TIER_LIMITS.FREE;

    return {
      plan: ws.plan,
      requestsThisMonth,
      requestsLimit: limits.requestsPerMonth,
      projectsCount: projects.length,
      projectsLimit: limits.projectsLimit,
      rulesCount,
      rulesLimit: limits.rulesLimit,
      teamMembersCount: members.length,
      teamMembersLimit: limits.teamMembersLimit,
    };
  }

  async getBillingStatus(workspaceId: string) {
    const usage = await this.getUsage(workspaceId);
    return {
      workspaceId,
      plan: usage.plan,
      status: "ACTIVE",
      trialEndsAt: null,
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      usage,
      notice: "MockLab is currently in early preview. Self-serve plan upgrades are coming soon.",
    };
  }
}
