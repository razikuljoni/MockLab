import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { DataStoreService, UserRecord, WorkspaceRecord } from "../prisma/data-store.service";
import { CryptoUtil } from "./crypto.util";
import { Role, Plan, MockAuth, Protocol } from "@prisma/client";
import { UserSignupInput, UserLoginInput } from "@mocklab/shared";

@Injectable()
export class AuthService {
  private readonly jwtSecret: string;

  constructor(private readonly dataStore: DataStoreService) {
    this.jwtSecret = process.env.JWT_SECRET || "mocklab-dev-jwt-secret-min-32-chars-long";
  }

  async signup(input: UserSignupInput): Promise<{
    token: string;
    user: Omit<UserRecord, "passwordHash">;
    workspace: WorkspaceRecord;
  }> {
    const existing = await this.dataStore.findUserByEmail(input.email);
    if (existing) {
      throw new ConflictException("User with this email already exists");
    }

    const passwordHash = CryptoUtil.hashPassword(input.password);
    const user = await this.dataStore.createUser({
      email: input.email,
      passwordHash,
      name: input.name || input.email.split("@")[0],
    });

    // Create workspace
    const wsName = input.workspaceName || `${user.name || "Default"}'s Workspace`;
    let wsSlug = wsName.toLowerCase().replace(/[^a-z0-9]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
    if (!wsSlug || wsSlug.length < 2) wsSlug = `workspace-${Date.now().toString().slice(-4)}`;

    // Ensure slug unique
    let existingWs = await this.dataStore.findWorkspaceBySlug(wsSlug);
    let counter = 1;
    while (existingWs) {
      wsSlug = `${wsSlug}-${counter++}`;
      existingWs = await this.dataStore.findWorkspaceBySlug(wsSlug);
    }

    const workspace = await this.dataStore.createWorkspace({
      name: wsName,
      slug: wsSlug,
      plan: Plan.FREE,
    });

    // Make creator the OWNER
    await this.dataStore.addWorkspaceMember(workspace.id, user.id, Role.OWNER);

    // Seed demo Petstore project if requested (§15.7 decision)
    if (input.seedDemo !== false) {
      await this.dataStore.createProject({
        workspaceId: workspace.id,
        name: "Petstore Demo",
        slug: "petstore",
        environment: "dev",
        mockAuth: MockAuth.PUBLIC, // Demo stays public (§15.3)
        protocol: Protocol.REST,
      });
    }

    const token = CryptoUtil.signJwt(
      { userId: user.id, email: user.email },
      this.jwtSecret,
      86400 * 7 // 7 days
    );

    const { passwordHash: _, ...sanitizedUser } = user;
    return { token, user: sanitizedUser, workspace };
  }

  async login(input: UserLoginInput): Promise<{
    token: string;
    user: Omit<UserRecord, "passwordHash">;
    workspaces: (WorkspaceRecord & { role: Role })[];
  }> {
    const user = await this.dataStore.findUserByEmail(input.email);
    if (!user || !user.passwordHash) {
      throw new UnauthorizedException("Invalid email or password");
    }

    const isValid = CryptoUtil.verifyPassword(input.password, user.passwordHash);
    if (!isValid) {
      throw new UnauthorizedException("Invalid email or password");
    }

    const workspaces = await this.dataStore.listUserWorkspaces(user.id);
    const token = CryptoUtil.signJwt(
      { userId: user.id, email: user.email },
      this.jwtSecret,
      86400 * 7
    );

    const { passwordHash: _, ...sanitizedUser } = user;
    return { token, user: sanitizedUser, workspaces };
  }

  async getCurrentUser(userId: string): Promise<{
    user: Omit<UserRecord, "passwordHash">;
    workspaces: (WorkspaceRecord & { role: Role })[];
  }> {
    const user = await this.dataStore.findUserById(userId);
    if (!user) {
      throw new NotFoundException("User not found");
    }

    const workspaces = await this.dataStore.listUserWorkspaces(userId);
    const { passwordHash: _, ...sanitizedUser } = user;
    return { user: sanitizedUser, workspaces };
  }

  async updateProfile(userId: string, data: { name?: string; avatarUrl?: string }) {
    const updated = await this.dataStore.updateUser(userId, data);
    if (!updated) throw new NotFoundException("User not found");
    const { passwordHash: _, ...sanitizedUser } = updated;
    return sanitizedUser;
  }

  async loginWithGitHub(code: string): Promise<{
    token: string;
    user: Omit<UserRecord, "passwordHash">;
    workspaces: (WorkspaceRecord & { role: Role })[];
  }> {
    const clientId = process.env.GITHUB_CLIENT_ID;
    const clientSecret = process.env.GITHUB_CLIENT_SECRET;
    if (!clientId || !clientSecret) {
      throw new BadRequestException("GitHub OAuth credentials not configured");
    }

    const tokenRes = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code,
      }),
    });

    const tokenData = await tokenRes.json();
    if (!tokenData.access_token) {
      throw new UnauthorizedException("Failed to exchange GitHub authorization code");
    }

    const userRes = await fetch("https://api.github.com/user", {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
        "User-Agent": "MockLab-Auth",
      },
    });

    if (!userRes.ok) {
      throw new UnauthorizedException("Failed to fetch GitHub user profile");
    }

    const ghProfile = await userRes.json();
    let email = ghProfile.email;

    if (!email) {
      try {
        const emailsRes = await fetch("https://api.github.com/user/emails", {
          headers: {
            Authorization: `Bearer ${tokenData.access_token}`,
            "User-Agent": "MockLab-Auth",
          },
        });
        if (emailsRes.ok) {
          const emails = await emailsRes.json();
          if (Array.isArray(emails)) {
            const primary = emails.find((e: any) => e.primary && e.verified) || emails[0];
            if (primary?.email) email = primary.email;
          }
        }
      } catch {
        // Fall back to login handle email
      }
    }

    if (!email) {
      email = `${ghProfile.login || "user"}@users.noreply.github.com`;
    }

    let user = await this.dataStore.findUserByEmail(email);
    if (!user) {
      user = await this.dataStore.createUser({
        email,
        name: ghProfile.name || ghProfile.login || email.split("@")[0],
        avatarUrl: ghProfile.avatar_url || null,
      });

      const wsName = `${user.name || "Default"}'s Workspace`;
      let wsSlug = wsName.toLowerCase().replace(/[^a-z0-9]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
      if (!wsSlug || wsSlug.length < 2) wsSlug = `workspace-${Date.now().toString().slice(-4)}`;

      let existingWs = await this.dataStore.findWorkspaceBySlug(wsSlug);
      let counter = 1;
      while (existingWs) {
        wsSlug = `${wsSlug}-${counter++}`;
        existingWs = await this.dataStore.findWorkspaceBySlug(wsSlug);
      }

      const workspace = await this.dataStore.createWorkspace({
        name: wsName,
        slug: wsSlug,
        plan: Plan.FREE,
      });

      await this.dataStore.addWorkspaceMember(workspace.id, user.id, Role.OWNER);

      await this.dataStore.createProject({
        workspaceId: workspace.id,
        name: "Petstore Demo",
        slug: "petstore",
        environment: "dev",
        mockAuth: MockAuth.PUBLIC,
        protocol: Protocol.REST,
      });
    }

    const workspaces = await this.dataStore.listUserWorkspaces(user.id);
    const token = CryptoUtil.signJwt(
      { userId: user.id, email: user.email },
      this.jwtSecret,
      86400 * 7
    );

    const { passwordHash: _, ...sanitizedUser } = user;
    return { token, user: sanitizedUser, workspaces };
  }

  async changePassword(userId: string, currentPass: string, newPass: string) {
    const user = await this.dataStore.findUserById(userId);
    if (!user || !user.passwordHash) throw new NotFoundException("User not found");

    const valid = CryptoUtil.verifyPassword(currentPass, user.passwordHash);
    if (!valid) throw new UnauthorizedException("Incorrect current password");

    const newHash = CryptoUtil.hashPassword(newPass);
    await this.dataStore.updateUser(userId, { passwordHash: newHash });
    return { success: true, message: "Password updated successfully" };
  }
}
