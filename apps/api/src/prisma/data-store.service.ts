import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "./prisma.service";
import { Role, Plan, MockAuth, ProjectStatus, Protocol } from "@prisma/client";

export interface UserRecord {
  id: string;
  email: string;
  passwordHash: string | null;
  name: string | null;
  avatarUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface WorkspaceRecord {
  id: string;
  name: string;
  slug: string;
  plan: Plan;
  createdAt: Date;
}

export interface WorkspaceMemberRecord {
  workspaceId: string;
  userId: string;
  role: Role;
  joinedAt: Date;
}

export interface ProjectRecord {
  id: string;
  workspaceId: string;
  name: string;
  slug: string;
  environment: string;
  status: ProjectStatus;
  mockAuth: MockAuth;
  protocol: Protocol;
  realProviderUrl: string | null;
  realProviderAuth: string | null;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class DataStoreService {
  private readonly logger = new Logger(DataStoreService.name);
  public isConnectedToPrisma = false;

  // In-memory fallback maps
  private users = new Map<string, UserRecord>();
  private workspaces = new Map<string, WorkspaceRecord>();
  private members: WorkspaceMemberRecord[] = [];
  private projects = new Map<string, ProjectRecord>();

  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      this.isConnectedToPrisma = true;
      this.logger.log("DataStore connected to PostgreSQL via Prisma.");
    } catch {
      this.isConnectedToPrisma = false;
      this.logger.warn("DataStore using in-memory store (PostgreSQL offline or sandbox mode).");
    }
  }

  // --- Users ---
  async createUser(data: { email: string; passwordHash?: string; name?: string; avatarUrl?: string }): Promise<UserRecord> {
    if (this.isConnectedToPrisma) {
      return (await this.prisma.user.create({ data })) as UserRecord;
    }
    const id = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const record: UserRecord = {
      id,
      email: data.email.toLowerCase(),
      passwordHash: data.passwordHash || null,
      name: data.name || null,
      avatarUrl: data.avatarUrl || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.users.set(id, record);
    return record;
  }

  async findUserByEmail(email: string): Promise<UserRecord | null> {
    if (this.isConnectedToPrisma) {
      return (await this.prisma.user.findUnique({ where: { email: email.toLowerCase() } })) as UserRecord | null;
    }
    for (const u of this.users.values()) {
      if (u.email.toLowerCase() === email.toLowerCase()) return u;
    }
    return null;
  }

  async findUserById(id: string): Promise<UserRecord | null> {
    if (this.isConnectedToPrisma) {
      return (await this.prisma.user.findUnique({ where: { id } })) as UserRecord | null;
    }
    return this.users.get(id) || null;
  }

  async updateUser(id: string, data: Partial<Omit<UserRecord, "id" | "createdAt">>): Promise<UserRecord | null> {
    if (this.isConnectedToPrisma) {
      return (await this.prisma.user.update({ where: { id }, data })) as UserRecord | null;
    }
    const existing = this.users.get(id);
    if (!existing) return null;
    const updated = { ...existing, ...data, updatedAt: new Date() };
    this.users.set(id, updated);
    return updated;
  }

  // --- Workspaces ---
  async createWorkspace(data: { name: string; slug: string; plan?: Plan }): Promise<WorkspaceRecord> {
    if (this.isConnectedToPrisma) {
      return (await this.prisma.workspace.create({ data: { ...data, plan: data.plan || Plan.FREE } })) as WorkspaceRecord;
    }
    const id = `ws_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const record: WorkspaceRecord = {
      id,
      name: data.name,
      slug: data.slug.toLowerCase(),
      plan: data.plan || Plan.FREE,
      createdAt: new Date(),
    };
    this.workspaces.set(id, record);
    return record;
  }

  async findWorkspaceById(id: string): Promise<WorkspaceRecord | null> {
    if (this.isConnectedToPrisma) {
      return (await this.prisma.workspace.findUnique({ where: { id } })) as WorkspaceRecord | null;
    }
    return this.workspaces.get(id) || null;
  }

  async findWorkspaceBySlug(slug: string): Promise<WorkspaceRecord | null> {
    if (this.isConnectedToPrisma) {
      return (await this.prisma.workspace.findUnique({ where: { slug: slug.toLowerCase() } })) as WorkspaceRecord | null;
    }
    for (const ws of this.workspaces.values()) {
      if (ws.slug === slug.toLowerCase()) return ws;
    }
    return null;
  }

  // --- Workspace Members ---
  async addWorkspaceMember(workspaceId: string, userId: string, role: Role): Promise<WorkspaceMemberRecord> {
    if (this.isConnectedToPrisma) {
      return (await this.prisma.workspaceMember.create({ data: { workspaceId, userId, role } })) as WorkspaceMemberRecord;
    }
    const member: WorkspaceMemberRecord = {
      workspaceId,
      userId,
      role,
      joinedAt: new Date(),
    };
    // remove existing if any
    this.members = this.members.filter((m) => !(m.workspaceId === workspaceId && m.userId === userId));
    this.members.push(member);
    return member;
  }

  async getWorkspaceMember(workspaceId: string, userId: string): Promise<WorkspaceMemberRecord | null> {
    if (this.isConnectedToPrisma) {
      return (await this.prisma.workspaceMember.findUnique({
        where: { workspaceId_userId: { workspaceId, userId } },
      })) as WorkspaceMemberRecord | null;
    }
    return this.members.find((m) => m.workspaceId === workspaceId && m.userId === userId) || null;
  }

  async listWorkspaceMembers(workspaceId: string): Promise<(WorkspaceMemberRecord & { user: UserRecord | null })[]> {
    if (this.isConnectedToPrisma) {
      return (await this.prisma.workspaceMember.findMany({
        where: { workspaceId },
        include: { user: true },
      })) as (WorkspaceMemberRecord & { user: UserRecord | null })[];
    }
    return this.members
      .filter((m) => m.workspaceId === workspaceId)
      .map((m) => ({
        ...m,
        user: this.users.get(m.userId) || null,
      }));
  }

  async listUserWorkspaces(userId: string): Promise<(WorkspaceRecord & { role: Role })[]> {
    if (this.isConnectedToPrisma) {
      const records = await this.prisma.workspaceMember.findMany({
        where: { userId },
        include: { workspace: true },
      });
      return records.map((r) => ({ ...r.workspace, role: r.role })) as (WorkspaceRecord & { role: Role })[];
    }
    const userMembers = this.members.filter((m) => m.userId === userId);
    return userMembers
      .map((m) => {
        const ws = this.workspaces.get(m.workspaceId);
        if (!ws) return null;
        return { ...ws, role: m.role };
      })
      .filter((ws): ws is WorkspaceRecord & { role: Role } => ws !== null);
  }

  async updateMemberRole(workspaceId: string, userId: string, role: Role): Promise<WorkspaceMemberRecord | null> {
    if (this.isConnectedToPrisma) {
      return (await this.prisma.workspaceMember.update({
        where: { workspaceId_userId: { workspaceId, userId } },
        data: { role },
      })) as WorkspaceMemberRecord | null;
    }
    const idx = this.members.findIndex((m) => m.workspaceId === workspaceId && m.userId === userId);
    if (idx === -1) return null;
    this.members[idx].role = role;
    return this.members[idx];
  }

  async removeMember(workspaceId: string, userId: string): Promise<boolean> {
    if (this.isConnectedToPrisma) {
      await this.prisma.workspaceMember.delete({
        where: { workspaceId_userId: { workspaceId, userId } },
      });
      return true;
    }
    const prevLen = this.members.length;
    this.members = this.members.filter((m) => !(m.workspaceId === workspaceId && m.userId === userId));
    return this.members.length < prevLen;
  }

  // --- Projects ---
  async createProject(data: {
    workspaceId: string;
    name: string;
    slug: string;
    environment?: string;
    mockAuth?: MockAuth;
    protocol?: Protocol;
  }): Promise<ProjectRecord> {
    if (this.isConnectedToPrisma) {
      return (await this.prisma.project.create({
        data: {
          workspaceId: data.workspaceId,
          name: data.name,
          slug: data.slug.toLowerCase(),
          environment: data.environment || "dev",
          mockAuth: data.mockAuth || MockAuth.PRIVATE,
          protocol: data.protocol || Protocol.REST,
        },
      })) as ProjectRecord;
    }
    const id = `proj_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const record: ProjectRecord = {
      id,
      workspaceId: data.workspaceId,
      name: data.name,
      slug: data.slug.toLowerCase(),
      environment: data.environment || "dev",
      status: ProjectStatus.LIVE,
      mockAuth: data.mockAuth || MockAuth.PRIVATE,
      protocol: data.protocol || Protocol.REST,
      realProviderUrl: null,
      realProviderAuth: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.projects.set(id, record);
    return record;
  }

  async listWorkspaceProjects(workspaceId: string): Promise<ProjectRecord[]> {
    if (this.isConnectedToPrisma) {
      return (await this.prisma.project.findMany({ where: { workspaceId } })) as ProjectRecord[];
    }
    return Array.from(this.projects.values()).filter((p) => p.workspaceId === workspaceId);
  }

  async findProjectById(id: string): Promise<ProjectRecord | null> {
    if (this.isConnectedToPrisma) {
      return (await this.prisma.project.findUnique({ where: { id } })) as ProjectRecord | null;
    }
    return this.projects.get(id) || null;
  }

  async findProjectBySlug(workspaceId: string, slug: string): Promise<ProjectRecord | null> {
    if (this.isConnectedToPrisma) {
      return (await this.prisma.project.findUnique({
        where: { workspaceId_slug: { workspaceId, slug: slug.toLowerCase() } },
      })) as ProjectRecord | null;
    }
    for (const p of this.projects.values()) {
      if (p.workspaceId === workspaceId && p.slug === slug.toLowerCase()) return p;
    }
    return null;
  }

  /**
   * Helper for tests: resets in-memory data
   */
  clear() {
    this.users.clear();
    this.workspaces.clear();
    this.members = [];
    this.projects.clear();
  }
}
