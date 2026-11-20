export interface TierLimits {
  requestsPerMonth: number;
  contractRunsPerMonth: number;
  projectsLimit: number;
  logRetentionDays: number;
  maxLogRows: number;
  apiKeysLimit: number;
  rulesLimit: number;
  teamMembersLimit: number;
  rateLimitPerMin: number;
}

export const WORKSPACE_TIER_LIMITS: Record<"FREE" | "PRO" | "TEAM", TierLimits> = {
  FREE: {
    requestsPerMonth: 5000,
    contractRunsPerMonth: 100,
    projectsLimit: 2,
    logRetentionDays: 7,
    maxLogRows: 2500,
    apiKeysLimit: 2,
    rulesLimit: 50,
    teamMembersLimit: 3,
    rateLimitPerMin: 100,
  },
  PRO: {
    requestsPerMonth: 100000,
    contractRunsPerMonth: 5000,
    projectsLimit: 20,
    logRetentionDays: 30,
    maxLogRows: 50000,
    apiKeysLimit: 10,
    rulesLimit: 500,
    teamMembersLimit: 10,
    rateLimitPerMin: 1000,
  },
  TEAM: {
    requestsPerMonth: 1000000,
    contractRunsPerMonth: 25000,
    projectsLimit: 100,
    logRetentionDays: 90,
    maxLogRows: 500000,
    apiKeysLimit: 50,
    rulesLimit: 5000,
    teamMembersLimit: 50,
    rateLimitPerMin: 5000,
  },
};
