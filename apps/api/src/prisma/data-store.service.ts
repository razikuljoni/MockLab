import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "./prisma.service";
import { Role, Plan, MockAuth, ProjectStatus, Protocol, RunStatus, Verdict } from "@prisma/client";

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

export interface SpecVersionRecord {
  id: string;
  projectId: string;
  version: number;
  hash: string;
  sourceUrl: string | null;
  raw: any;
  deref: any;
  importedAt: Date;
}

export interface MockRuleRecord {
  id: string;
  projectId: string;
  operationId: string;
  priority: number;
  name: string;
  enabled: boolean;
  generated: boolean;
  edited: boolean;
  matcher: any;
  response: any;
  hitCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface RequestLogRecord {
  id: string;
  projectId: string;
  method: string;
  path: string;
  status: number;
  matchedRuleId: string | null;
  nearMiss: any;
  latencyMs: number;
  injectedMs: number;
  requestSize: number;
  responseSize: number;
  requestHeaders?: Record<string, string>;
  requestBody: any;
  responseHeaders?: Record<string, string>;
  responseBody: any;
  createdAt: Date;
}

export interface ExpectationRecord {
  id: string;
  projectId: string;
  operationId: string;
  name: string;
  providerState: string | null;
  request: any;
  expectedStatus: number;
  expectedSchema: any;
  matchers: any;
  generated: boolean;
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ContractRunRecord {
  id: string;
  projectId: string;
  specHash: string;
  providerUrl: string;
  status: RunStatus;
  triggeredBy: string;
  durationMs: number;
  createdAt: Date;
  results: Array<{
    id: string;
    expectationId: string;
    mockStatus: number | null;
    realStatus: number | null;
    verdict: Verdict;
    diff: any;
  }>;
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
  private specVersions = new Map<string, SpecVersionRecord>();
  private rules = new Map<string, MockRuleRecord>();
  private requestLogs = new Map<string, RequestLogRecord>();
  private expectations = new Map<string, ExpectationRecord>();
  private contractRuns = new Map<string, ContractRunRecord>();

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

  async updateProjectStatus(id: string, status: ProjectStatus): Promise<ProjectRecord | null> {
    if (this.isConnectedToPrisma) {
      return (await this.prisma.project.update({ where: { id }, data: { status } })) as ProjectRecord | null;
    }
    const p = this.projects.get(id);
    if (!p) return null;
    p.status = status;
    p.updatedAt = new Date();
    return p;
  }

  // --- Spec Versions ---
  async createSpecVersion(data: {
    projectId: string;
    version: number;
    hash: string;
    sourceUrl?: string;
    raw: any;
    deref: any;
  }): Promise<SpecVersionRecord> {
    if (this.isConnectedToPrisma) {
      return (await this.prisma.specVersion.create({ data })) as SpecVersionRecord;
    }
    const id = `spec_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const record: SpecVersionRecord = {
      id,
      projectId: data.projectId,
      version: data.version,
      hash: data.hash,
      sourceUrl: data.sourceUrl || null,
      raw: data.raw,
      deref: data.deref,
      importedAt: new Date(),
    };
    this.specVersions.set(id, record);
    return record;
  }

  async getLatestSpecVersion(projectId: string): Promise<SpecVersionRecord | null> {
    if (this.isConnectedToPrisma) {
      return (await this.prisma.specVersion.findFirst({
        where: { projectId },
        orderBy: { version: "desc" },
      })) as SpecVersionRecord | null;
    }
    const matches = Array.from(this.specVersions.values())
      .filter((s) => s.projectId === projectId)
      .sort((a, b) => b.version - a.version);
    return matches[0] || null;
  }

  // --- Mock Rules ---
  async createMockRule(data: {
    projectId: string;
    operationId: string;
    priority: number;
    name: string;
    enabled?: boolean;
    generated?: boolean;
    edited?: boolean;
    matcher: any;
    response: any;
  }): Promise<MockRuleRecord> {
    if (this.isConnectedToPrisma) {
      return (await this.prisma.mockRule.create({ data })) as MockRuleRecord;
    }
    const id = `rule_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const record: MockRuleRecord = {
      id,
      projectId: data.projectId,
      operationId: data.operationId,
      priority: data.priority,
      name: data.name,
      enabled: data.enabled ?? true,
      generated: data.generated ?? false,
      edited: data.edited ?? false,
      matcher: data.matcher,
      response: data.response,
      hitCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.rules.set(id, record);
    return record;
  }

  async listMockRules(projectId: string, operationId?: string): Promise<MockRuleRecord[]> {
    if (this.isConnectedToPrisma) {
      return (await this.prisma.mockRule.findMany({
        where: { projectId, ...(operationId ? { operationId } : {}) },
        orderBy: { priority: "asc" },
      })) as MockRuleRecord[];
    }
    return Array.from(this.rules.values())
      .filter((r) => r.projectId === projectId && (!operationId || r.operationId === operationId))
      .sort((a, b) => a.priority - b.priority);
  }

  async findMockRuleById(id: string): Promise<MockRuleRecord | null> {
    if (this.isConnectedToPrisma) {
      return (await this.prisma.mockRule.findUnique({ where: { id } })) as MockRuleRecord | null;
    }
    return this.rules.get(id) || null;
  }

  async updateMockRule(id: string, data: Partial<MockRuleRecord>): Promise<MockRuleRecord | null> {
    if (this.isConnectedToPrisma) {
      return (await this.prisma.mockRule.update({ where: { id }, data })) as MockRuleRecord | null;
    }
    const r = this.rules.get(id);
    if (!r) return null;
    Object.assign(r, data, { updatedAt: new Date() });
    return r;
  }

  async deleteMockRule(id: string): Promise<boolean> {
    if (this.isConnectedToPrisma) {
      await this.prisma.mockRule.delete({ where: { id } });
      return true;
    }
    return this.rules.delete(id);
  }

  // ── RequestLog Operations ──
  async createRequestLog(data: Omit<RequestLogRecord, "id" | "createdAt">): Promise<RequestLogRecord> {
    const id = `log_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const record: RequestLogRecord = {
      ...data,
      id,
      createdAt: new Date(),
    };

    if (this.isConnectedToPrisma) {
      try {
        await this.prisma.requestLog.create({
          data: {
            id: record.id,
            projectId: record.projectId,
            method: record.method,
            path: record.path,
            status: record.status,
            matchedRuleId: record.matchedRuleId,
            nearMiss: record.nearMiss,
            latencyMs: record.latencyMs,
            injectedMs: record.injectedMs,
            requestSize: record.requestSize,
            responseSize: record.responseSize,
            requestBody: record.requestBody,
            responseBody: record.responseBody,
            createdAt: record.createdAt,
          },
        });
      } catch (err: any) {
        this.logger.warn(`Prisma createRequestLog fallback: ${err.message}`);
      }
    }

    this.requestLogs.set(id, record);
    return record;
  }

  async createRequestLogsBatch(entries: Omit<RequestLogRecord, "id" | "createdAt">[]): Promise<number> {
    if (!entries.length) return 0;
    const records: RequestLogRecord[] = entries.map((e, idx) => ({
      ...e,
      id: `log_${Date.now()}_${idx}_${Math.random().toString(36).substring(2, 7)}`,
      createdAt: new Date(),
    }));

    if (this.isConnectedToPrisma) {
      try {
        await this.prisma.requestLog.createMany({
          data: records.map((r) => ({
            id: r.id,
            projectId: r.projectId,
            method: r.method,
            path: r.path,
            status: r.status,
            matchedRuleId: r.matchedRuleId,
            nearMiss: r.nearMiss,
            latencyMs: r.latencyMs,
            injectedMs: r.injectedMs,
            requestSize: r.requestSize,
            responseSize: r.responseSize,
            requestBody: r.requestBody,
            responseBody: r.responseBody,
            createdAt: r.createdAt,
          })),
        });
      } catch (err: any) {
        this.logger.warn(`Prisma createRequestLogsBatch fallback: ${err.message}`);
      }
    }

    for (const r of records) {
      this.requestLogs.set(r.id, r);
    }
    return records.length;
  }

  async listRequestLogs(
    projectId: string,
    filters?: {
      method?: string;
      statusClass?: string;
      onlyUnmatched?: boolean;
      path?: string;
      ruleId?: string;
    },
    pagination?: { page?: number; limit?: number }
  ): Promise<{ total: number; page: number; limit: number; logs: RequestLogRecord[] }> {
    const page = pagination?.page || 1;
    const limit = pagination?.limit || 50;

    let all = Array.from(this.requestLogs.values()).filter((l) => l.projectId === projectId);

    if (filters?.method) {
      all = all.filter((l) => l.method.toUpperCase() === filters.method!.toUpperCase());
    }

    if (filters?.statusClass) {
      if (filters.statusClass === "2xx") all = all.filter((l) => l.status >= 200 && l.status < 300);
      else if (filters.statusClass === "4xx") all = all.filter((l) => l.status >= 400 && l.status < 500);
      else if (filters.statusClass === "5xx") all = all.filter((l) => l.status >= 500 && l.status < 600);
    }

    if (filters?.onlyUnmatched) {
      all = all.filter((l) => l.status === 404 || !l.matchedRuleId || l.matchedRuleId === "UNMATCHED");
    }

    if (filters?.path) {
      const q = filters.path.toLowerCase();
      all = all.filter((l) => l.path.toLowerCase().includes(q));
    }

    if (filters?.ruleId) {
      all = all.filter((l) => l.matchedRuleId === filters.ruleId);
    }

    all.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    const total = all.length;
    const startIndex = (page - 1) * limit;
    const logs = all.slice(startIndex, startIndex + limit);

    return { total, page, limit, logs };
  }

  async findRequestLogById(id: string): Promise<RequestLogRecord | null> {
    if (this.isConnectedToPrisma) {
      try {
        const row = await this.prisma.requestLog.findUnique({ where: { id } });
        if (row) return row as any;
      } catch {
        // fallback
      }
    }
    return this.requestLogs.get(id) || null;
  }

  async purgeRequestLogs(projectId: string, retentionDays = 14, maxRows = 2500): Promise<number> {
    const cutoff = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);
    let purged = 0;

    for (const [id, log] of this.requestLogs.entries()) {
      if (log.projectId === projectId && log.createdAt < cutoff) {
        this.requestLogs.delete(id);
        purged++;
      }
    }

    // Also enforce maxRows cap
    const projectLogs = Array.from(this.requestLogs.values())
      .filter((l) => l.projectId === projectId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    if (projectLogs.length > maxRows) {
      const toRemove = projectLogs.slice(maxRows);
      for (const rem of toRemove) {
        this.requestLogs.delete(rem.id);
        purged++;
      }
    }

    if (this.isConnectedToPrisma) {
      try {
        await this.prisma.requestLog.deleteMany({
          where: { projectId, createdAt: { lt: cutoff } },
        });
      } catch {
        // ignore
      }
    }

    return purged;
  }

  // ── Expectation Operations ──
  async createExpectation(data: Omit<ExpectationRecord, "id" | "createdAt" | "updatedAt">): Promise<ExpectationRecord> {
    const id = `exp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const record: ExpectationRecord = {
      ...data,
      id,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    if (this.isConnectedToPrisma) {
      try {
        await this.prisma.expectation.create({
          data: {
            id: record.id,
            projectId: record.projectId,
            operationId: record.operationId,
            name: record.name,
            providerState: record.providerState,
            request: record.request,
            expectedStatus: record.expectedStatus,
            expectedSchema: record.expectedSchema,
            matchers: record.matchers,
            generated: record.generated,
            enabled: record.enabled,
          },
        });
      } catch (err: any) {
        this.logger.warn(`Prisma createExpectation fallback: ${err.message}`);
      }
    }

    this.expectations.set(id, record);
    return record;
  }

  async listExpectations(projectId: string): Promise<ExpectationRecord[]> {
    if (this.isConnectedToPrisma) {
      try {
        const rows = await this.prisma.expectation.findMany({
          where: { projectId },
          orderBy: { createdAt: "asc" },
        });
        if (rows.length > 0) return rows as any;
      } catch {
        // fallback
      }
    }
    return Array.from(this.expectations.values()).filter((e) => e.projectId === projectId);
  }

  async findExpectationById(id: string): Promise<ExpectationRecord | null> {
    if (this.isConnectedToPrisma) {
      try {
        const row = await this.prisma.expectation.findUnique({ where: { id } });
        if (row) return row as any;
      } catch {
        // fallback
      }
    }
    return this.expectations.get(id) || null;
  }

  async updateExpectation(id: string, data: Partial<ExpectationRecord>): Promise<ExpectationRecord | null> {
    if (this.isConnectedToPrisma) {
      try {
        const updated = await this.prisma.expectation.update({
          where: { id },
          data: { ...data, updatedAt: new Date() },
        });
        if (updated) return updated as any;
      } catch {
        // fallback
      }
    }
    const exp = this.expectations.get(id);
    if (!exp) return null;
    Object.assign(exp, data, { updatedAt: new Date() });
    return exp;
  }

  async deleteExpectation(id: string): Promise<boolean> {
    if (this.isConnectedToPrisma) {
      try {
        await this.prisma.expectation.delete({ where: { id } });
      } catch {
        // fallback
      }
    }
    return this.expectations.delete(id);
  }

  // ── ContractRun Operations ──
  async createContractRun(
    data: Omit<ContractRunRecord, "id" | "createdAt">
  ): Promise<ContractRunRecord> {
    const id = `run_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const record: ContractRunRecord = {
      ...data,
      id,
      createdAt: new Date(),
    };

    if (this.isConnectedToPrisma) {
      try {
        await this.prisma.contractRun.create({
          data: {
            id: record.id,
            projectId: record.projectId,
            specHash: record.specHash,
            providerUrl: record.providerUrl,
            status: record.status,
            triggeredBy: record.triggeredBy,
            durationMs: record.durationMs,
            createdAt: record.createdAt,
            results: {
              create: record.results.map((r) => ({
                expectationId: r.expectationId,
                mockStatus: r.mockStatus,
                realStatus: r.realStatus,
                verdict: r.verdict,
                diff: r.diff,
              })),
            },
          },
        });
      } catch (err: any) {
        this.logger.warn(`Prisma createContractRun fallback: ${err.message}`);
      }
    }

    this.contractRuns.set(id, record);
    return record;
  }

  async listContractRuns(projectId: string): Promise<ContractRunRecord[]> {
    if (this.isConnectedToPrisma) {
      try {
        const rows = await this.prisma.contractRun.findMany({
          where: { projectId },
          include: { results: true },
          orderBy: { createdAt: "desc" },
        });
        if (rows.length > 0) return rows as any;
      } catch {
        // fallback
      }
    }
    return Array.from(this.contractRuns.values())
      .filter((r) => r.projectId === projectId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async findContractRunById(runId: string): Promise<ContractRunRecord | null> {
    if (this.isConnectedToPrisma) {
      try {
        const row = await this.prisma.contractRun.findUnique({
          where: { id: runId },
          include: { results: true },
        });
        if (row) return row as any;
      } catch {
        // fallback
      }
    }
    return this.contractRuns.get(runId) || null;
  }

  /**
   * Helper for tests: resets in-memory data
   */
  clear() {
    this.users.clear();
    this.workspaces.clear();
    this.members = [];
    this.projects.clear();
    this.specVersions.clear();
    this.rules.clear();
    this.requestLogs.clear();
    this.expectations.clear();
    this.contractRuns.clear();
  }
}
