import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from "@nestjs/common";
import { DataStoreService } from "../prisma/data-store.service";
import { Role, Plan } from "@prisma/client";

@Injectable()
export class WorkspacesService {
  constructor(private readonly dataStore: DataStoreService) {}

  async createWorkspace(userId: string, data: { name: string; slug: string }) {
    const existing = await this.dataStore.findWorkspaceBySlug(data.slug);
    if (existing) {
      throw new ConflictException(`Workspace with slug '${data.slug}' already exists`);
    }

    const workspace = await this.dataStore.createWorkspace({
      name: data.name,
      slug: data.slug,
      plan: Plan.FREE,
    });

    await this.dataStore.addWorkspaceMember(workspace.id, userId, Role.OWNER);
    return workspace;
  }

  async listUserWorkspaces(userId: string) {
    return this.dataStore.listUserWorkspaces(userId);
  }

  async getWorkspace(workspaceId: string, userId: string) {
    const member = await this.dataStore.getWorkspaceMember(workspaceId, userId);
    if (!member) {
      throw new ForbiddenException("You are not a member of this workspace");
    }

    const workspace = await this.dataStore.findWorkspaceById(workspaceId);
    if (!workspace) {
      throw new NotFoundException("Workspace not found");
    }

    const members = await this.dataStore.listWorkspaceMembers(workspaceId);
    const projects = await this.dataStore.listWorkspaceProjects(workspaceId);

    return {
      ...workspace,
      currentRole: member.role,
      membersCount: members.length,
      projectsCount: projects.length,
    };
  }

  async listMembers(workspaceId: string, userId: string) {
    const member = await this.dataStore.getWorkspaceMember(workspaceId, userId);
    if (!member) {
      throw new ForbiddenException("You are not a member of this workspace");
    }

    const members = await this.dataStore.listWorkspaceMembers(workspaceId);
    return members.map((m) => ({
      userId: m.userId,
      role: m.role,
      joinedAt: m.joinedAt,
      email: m.user?.email || "unknown",
      name: m.user?.name || null,
      avatarUrl: m.user?.avatarUrl || null,
    }));
  }

  async inviteMember(
    workspaceId: string,
    actorUserId: string,
    data: { email: string; role: Role }
  ) {
    const actorMember = await this.dataStore.getWorkspaceMember(workspaceId, actorUserId);
    if (!actorMember || (actorMember.role !== Role.OWNER && actorMember.role !== Role.ADMIN)) {
      throw new ForbiddenException("Only workspace Owners and Admins can invite members");
    }

    // Find or create placeholder user for invitee
    let targetUser = await this.dataStore.findUserByEmail(data.email);
    if (!targetUser) {
      targetUser = await this.dataStore.createUser({
        email: data.email,
        name: data.email.split("@")[0],
      });
    }

    const existingMembership = await this.dataStore.getWorkspaceMember(workspaceId, targetUser.id);
    if (existingMembership) {
      throw new ConflictException("User is already a member of this workspace");
    }

    const newMember = await this.dataStore.addWorkspaceMember(workspaceId, targetUser.id, data.role);
    return {
      success: true,
      member: {
        userId: newMember.userId,
        email: targetUser.email,
        name: targetUser.name,
        role: newMember.role,
        joinedAt: newMember.joinedAt,
      },
    };
  }

  async updateMemberRole(
    workspaceId: string,
    actorUserId: string,
    targetUserId: string,
    newRole: Role
  ) {
    const actorMember = await this.dataStore.getWorkspaceMember(workspaceId, actorUserId);
    if (!actorMember || (actorMember.role !== Role.OWNER && actorMember.role !== Role.ADMIN)) {
      throw new ForbiddenException("Only workspace Owners and Admins can update roles");
    }

    const targetMember = await this.dataStore.getWorkspaceMember(workspaceId, targetUserId);
    if (!targetMember) {
      throw new NotFoundException("Target user is not a member of this workspace");
    }

    if (targetMember.role === Role.OWNER && actorMember.role !== Role.OWNER) {
      throw new ForbiddenException("Only an Owner can change the Owner's role");
    }

    const updated = await this.dataStore.updateMemberRole(workspaceId, targetUserId, newRole);
    return updated;
  }

  async removeMember(workspaceId: string, actorUserId: string, targetUserId: string) {
    const actorMember = await this.dataStore.getWorkspaceMember(workspaceId, actorUserId);
    if (!actorMember || (actorMember.role !== Role.OWNER && actorMember.role !== Role.ADMIN)) {
      throw new ForbiddenException("Only workspace Owners and Admins can remove members");
    }

    const targetMember = await this.dataStore.getWorkspaceMember(workspaceId, targetUserId);
    if (!targetMember) {
      throw new NotFoundException("Target user is not a member of this workspace");
    }

    if (targetMember.role === Role.OWNER) {
      throw new ForbiddenException("Workspace Owner cannot be removed");
    }

    await this.dataStore.removeMember(workspaceId, targetUserId);
    return { success: true, message: "Member removed" };
  }

  // ── Workspace Settings, Danger Zone & Billing (§6.1, §6.8, §6.9, §10) ──

  async updateSettings(
    workspaceId: string,
    actorUserId: string,
    data: {
      name?: string;
      slug?: string;
      defaultEnv?: string;
      mockAuthDefault?: "PUBLIC" | "PRIVATE";
      logRetentionDays?: number;
    }
  ) {
    const actorMember = await this.dataStore.getWorkspaceMember(workspaceId, actorUserId);
    if (!actorMember || (actorMember.role !== Role.OWNER && actorMember.role !== Role.ADMIN)) {
      throw new ForbiddenException("Only workspace Owners and Admins can update settings");
    }

    const ws = await this.dataStore.findWorkspaceById(workspaceId);
    if (!ws) throw new NotFoundException("Workspace not found");

    if (data.slug && data.slug !== ws.slug) {
      const existing = await this.dataStore.findWorkspaceBySlug(data.slug);
      if (existing) {
        throw new ConflictException(`Workspace with slug '${data.slug}' already exists`);
      }
    }

    const updated = await this.dataStore.updateWorkspace(workspaceId, data);
    return updated;
  }

  async pauseAllProjects(workspaceId: string, actorUserId: string) {
    const actorMember = await this.dataStore.getWorkspaceMember(workspaceId, actorUserId);
    if (!actorMember || (actorMember.role !== Role.OWNER && actorMember.role !== Role.ADMIN)) {
      throw new ForbiddenException("Only workspace Owners and Admins can pause all mocks");
    }

    const count = await this.dataStore.pauseAllWorkspaceProjects(workspaceId);
    return { success: true, message: `Paused ${count} project mock servers in workspace`, pausedCount: count };
  }

  async deleteWorkspace(workspaceId: string, actorUserId: string) {
    const actorMember = await this.dataStore.getWorkspaceMember(workspaceId, actorUserId);
    if (!actorMember || actorMember.role !== Role.OWNER) {
      throw new ForbiddenException("Only the workspace Owner can delete the workspace");
    }

    const deleted = await this.dataStore.deleteWorkspace(workspaceId);
    return { success: deleted, message: "Workspace deleted" };
  }

  async getBilling(workspaceId: string, actorUserId: string) {
    const actorMember = await this.dataStore.getWorkspaceMember(workspaceId, actorUserId);
    if (!actorMember || (actorMember.role !== Role.OWNER && actorMember.role !== Role.ADMIN)) {
      throw new ForbiddenException("Only workspace Owners and Admins can view billing");
    }

    const ws = await this.dataStore.findWorkspaceById(workspaceId);
    if (!ws) throw new NotFoundException("Workspace not found");

    const projects = await this.dataStore.listWorkspaceProjects(workspaceId);
    let mockRequests = 0;
    let contractRuns = 0;

    for (const proj of projects) {
      const logs = await this.dataStore.listRequestLogs(proj.id, { limit: 1000 });
      mockRequests += logs.total;
      const runs = await this.dataStore.listContractRuns(proj.id, { limit: 1000 });
      contractRuns += runs.total;
    }

    const planLimits = PLAN_LIMITS[ws.plan] || PLAN_LIMITS[Plan.FREE];

    return {
      plan: ws.plan,
      limits: planLimits,
      usage: {
        mockRequests,
        contractRuns,
        projectsCount: projects.length,
        logRetentionDays: ws.logRetentionDays || planLimits.logRetentionDays,
      },
      plans: PLAN_LIMITS,
    };
  }

  async updateBilling(workspaceId: string, actorUserId: string, newPlan: Plan) {
    const actorMember = await this.dataStore.getWorkspaceMember(workspaceId, actorUserId);
    if (!actorMember || actorMember.role !== Role.OWNER) {
      throw new ForbiddenException("Only the workspace Owner can modify the billing plan");
    }

    const ws = await this.dataStore.findWorkspaceById(workspaceId);
    if (!ws) throw new NotFoundException("Workspace not found");

    const updated = await this.dataStore.updateWorkspace(workspaceId, { plan: newPlan });
    return {
      success: true,
      plan: newPlan,
      workspace: updated,
      limits: PLAN_LIMITS[newPlan],
    };
  }
}

export const PLAN_LIMITS: Record<Plan, {
  name: string;
  price: number;
  mockRequests: number;
  contractRuns: number;
  logRetentionDays: number;
  maxProjects: number;
  teamMembers: number;
  features: string[];
}> = {
  [Plan.FREE]: {
    name: "Free",
    price: 0,
    mockRequests: 10_000,
    contractRuns: 50,
    logRetentionDays: 7,
    maxProjects: 3,
    teamMembers: 2,
    features: ["Core Mock Engine", "OpenAPI 3.0 / 3.1", "7-Day Log Retention", "Community Support"],
  },
  [Plan.PRO]: {
    name: "Pro",
    price: 19,
    mockRequests: 250_000,
    contractRuns: 2_500,
    logRetentionDays: 30,
    maxProjects: 20,
    teamMembers: 10,
    features: ["All Free Features", "Fault Injection & Dynamic Delays", "Automated Contract CI Sweep", "30-Day Log Retention", "Priority Email Support"],
  },
  [Plan.TEAM]: {
    name: "Team",
    price: 79,
    mockRequests: 1_000_000,
    contractRuns: 10_000,
    logRetentionDays: 90,
    maxProjects: -1,
    teamMembers: -1,
    features: ["All Pro Features", "Unlimited Projects & Members", "90-Day Log Retention", "Custom Domains", "Dedicated Support & SLA"],
  },
};
