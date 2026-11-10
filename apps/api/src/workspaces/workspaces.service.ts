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
}
