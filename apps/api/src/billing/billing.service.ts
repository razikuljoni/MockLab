import { Injectable, Logger, NotFoundException } from "@nestjs/common";
import { DataStoreService } from "../prisma/data-store.service";
import { Plan } from "@prisma/client";

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
    for (const p of projects) {
      const rules = await this.dataStore.listMockRules(p.id);
      rulesCount += rules.length;
    }

    const members = await this.dataStore.listWorkspaceMembers(workspaceId);

    // Plan limits per §6.9
    const planLimits: Record<
      Plan,
      { requests: number; projects: number; rules: number; members: number }
    > = {
      [Plan.FREE]: { requests: 50000, projects: 3, rules: 50, members: 3 },
      [Plan.PRO]: { requests: 1000000, projects: 20, rules: 500, members: 10 },
      [Plan.TEAM]: { requests: 10000000, projects: 100, rules: 5000, members: 50 },
    };

    const limits = planLimits[ws.plan] || planLimits[Plan.FREE];

    return {
      plan: ws.plan,
      requestsThisMonth: 12450, // simulated active usage for preview
      requestsLimit: limits.requests,
      projectsCount: projects.length,
      projectsLimit: limits.projects,
      rulesCount,
      rulesLimit: limits.rules,
      teamMembersCount: members.length,
      teamMembersLimit: limits.members,
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
