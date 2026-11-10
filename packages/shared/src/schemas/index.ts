import { z } from "zod";

export const RoleSchema = z.enum(["OWNER", "ADMIN", "EDITOR", "VIEWER"]);
export type Role = z.infer<typeof RoleSchema>;

export const PlanSchema = z.enum(["FREE", "PRO", "TEAM"]);
export type Plan = z.infer<typeof PlanSchema>;

export const ProjectStatusSchema = z.enum(["LIVE", "PAUSED"]);
export type ProjectStatus = z.infer<typeof ProjectStatusSchema>;

export const MockAuthSchema = z.enum(["PUBLIC", "PRIVATE"]);
export type MockAuth = z.infer<typeof MockAuthSchema>;

export const ProtocolSchema = z.enum(["REST", "GRAPHQL"]);
export type Protocol = z.infer<typeof ProtocolSchema>;

export const VerdictSchema = z.enum(["PASS", "BREAKING", "NON_BREAKING", "ERROR"]);
export type Verdict = z.infer<typeof VerdictSchema>;

export const RunStatusSchema = z.enum(["PASS", "FAIL_BREAKING", "ERROR"]);
export type RunStatus = z.infer<typeof RunStatusSchema>;

// Plan limits (§6.9, §15.2, §15.4 decisions)
export const PLAN_LIMITS = {
  FREE: {
    pricePerMonth: 0,
    maxWorkspaces: 1,
    maxProjects: 2,
    mockRequestsPerMonth: 5000,
    contractRunsPerMonth: 100,
    logRetentionDays: 14,
    maxLogRowsRetained: 2500,
    apiKeys: 2,
    rateLimitPerMin: 100,
  },
  PRO: {
    pricePerMonth: 19,
    maxWorkspaces: 5,
    maxProjects: 999999,
    mockRequestsPerMonth: 100000,
    contractRunsPerMonth: 5000,
    logRetentionDays: 60,
    maxLogRowsRetained: 100000,
    apiKeys: 10,
    rateLimitPerMin: 1000,
  },
  TEAM: {
    pricePerMonth: 79,
    maxWorkspaces: 999999,
    maxProjects: 999999,
    mockRequestsPerMonth: 1000000,
    contractRunsPerMonth: 50000,
    logRetentionDays: 90,
    maxLogRowsRetained: 500000,
    apiKeys: 50,
    rateLimitPerMin: 5000,
  },
} as const;

export const WorkspaceCreateSchema = z.object({
  name: z.string().min(2).max(50),
  slug: z.string().min(2).max(50).regex(/^[a-z0-9-]+$/),
});

export const UserSignupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).regex(/[0-9]/, "Password must contain a number").regex(/[^a-zA-Z0-9]/, "Password must contain a symbol"),
  name: z.string().min(2).optional(),
  workspaceName: z.string().min(2).max(50).optional(),
  seedDemo: z.boolean().optional().default(true),
});
export type UserSignupInput = z.input<typeof UserSignupSchema>;

export const UserLoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});
export type UserLoginInput = z.infer<typeof UserLoginSchema>;

export const WorkspaceInviteSchema = z.object({
  email: z.string().email(),
  role: RoleSchema.default("EDITOR"),
});
export type WorkspaceInviteInput = z.infer<typeof WorkspaceInviteSchema>;

export const UpdateProfileSchema = z.object({
  name: z.string().min(2).max(60).optional(),
  avatarUrl: z.string().url().optional(),
});

export const ChangePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8).regex(/[0-9]/).regex(/[^a-zA-Z0-9]/),
});

export const ProjectCreateSchema = z.object({
  name: z.string().min(2).max(50),
  slug: z.string().min(2).max(50).regex(/^[a-z0-9-]+$/),
  environment: z.string().default("dev"),
  protocol: ProtocolSchema.default("REST"),
  mockAuth: MockAuthSchema.default("PRIVATE"),
  realProviderUrl: z.string().url().optional(),
});
