import { describe, it, expect, beforeEach } from "vitest";
import { DataStoreService } from "../prisma/data-store.service";
import { PrismaService } from "../prisma/prisma.service";
import { AuthService } from "./auth.service";
import { WorkspacesService } from "../workspaces/workspaces.service";
import { Role } from "@prisma/client";
import { ForbiddenException, UnauthorizedException, ConflictException } from "@nestjs/common";

describe("Phase 1 Auth & Workspaces Acceptance Suite", () => {
  let dataStore: DataStoreService;
  let authService: AuthService;
  let workspacesService: WorkspacesService;

  beforeEach(() => {
    // Create isolated in-memory data store for tests
    const mockPrisma = {} as PrismaService;
    dataStore = new DataStoreService(mockPrisma);
    dataStore.clear();

    authService = new AuthService(dataStore);
    workspacesService = new WorkspacesService(dataStore);
  });

  it("User signs up -> automatically creates workspace with OWNER role and seeds Petstore demo", async () => {
    const res = await authService.signup({
      email: "owner@mocklab.dev",
      password: "Password123!",
      name: "Owner User",
      workspaceName: "Acme Engineering",
      seedDemo: true,
    });

    expect(res.token).toBeDefined();
    expect(res.user.email).toBe("owner@mocklab.dev");
    expect(res.workspace.name).toBe("Acme Engineering");

    // Verify creator is OWNER
    const member = await dataStore.getWorkspaceMember(res.workspace.id, res.user.id);
    expect(member?.role).toBe(Role.OWNER);

    // Verify Petstore project is seeded
    const projects = await dataStore.listWorkspaceProjects(res.workspace.id);
    expect(projects.length).toBe(1);
    expect(projects[0].slug).toBe("petstore");
    expect(projects[0].name).toBe("Petstore Demo");
  });

  it("Full invitation lifecycle: Owner invites second user -> second user sees workspace with assigned role", async () => {
    // 1. Sign up Owner
    const ownerRes = await authService.signup({
      email: "owner@mocklab.dev",
      password: "Password123!",
      workspaceName: "TechCorp",
    });

    // 2. Owner invites a second user as VIEWER
    const inviteRes = await workspacesService.inviteMember(ownerRes.workspace.id, ownerRes.user.id, {
      email: "guest@mocklab.dev",
      role: Role.VIEWER,
    });

    expect(inviteRes.success).toBe(true);
    expect(inviteRes.member.email).toBe("guest@mocklab.dev");
    expect(inviteRes.member.role).toBe(Role.VIEWER);

    // 3. Second user registers/logs in
    const guestUser = await dataStore.findUserByEmail("guest@mocklab.dev");
    expect(guestUser).toBeDefined();

    // 4. Second user lists their workspaces -> sees TechCorp with VIEWER role
    const guestWorkspaces = await workspacesService.listUserWorkspaces(guestUser!.id);
    expect(guestWorkspaces.length).toBe(1);
    expect(guestWorkspaces[0].id).toBe(ownerRes.workspace.id);
    expect(guestWorkspaces[0].role).toBe(Role.VIEWER);
  });

  it("Enforces role security: Viewer cannot invite members or manage workspace", async () => {
    const ownerRes = await authService.signup({
      email: "owner@mocklab.dev",
      password: "Password123!",
      workspaceName: "SecureCorp",
    });

    await workspacesService.inviteMember(ownerRes.workspace.id, ownerRes.user.id, {
      email: "viewer@mocklab.dev",
      role: Role.VIEWER,
    });

    const viewerUser = (await dataStore.findUserByEmail("viewer@mocklab.dev"))!;

    // Viewer attempts to invite someone -> should throw ForbiddenException
    await expect(
      workspacesService.inviteMember(ownerRes.workspace.id, viewerUser.id, {
        email: "third@mocklab.dev",
        role: Role.EDITOR,
      })
    ).rejects.toThrow(ForbiddenException);

    // Viewer attempts to remove Owner -> should throw ForbiddenException
    await expect(
      workspacesService.removeMember(ownerRes.workspace.id, viewerUser.id, ownerRes.user.id)
    ).rejects.toThrow(ForbiddenException);
  });

  it("Rejects duplicate email signup and invalid login credentials", async () => {
    await authService.signup({
      email: "alice@mocklab.dev",
      password: "Password123!",
    });

    await expect(
      authService.signup({
        email: "alice@mocklab.dev",
        password: "Password456!",
      })
    ).rejects.toThrow(ConflictException);

    await expect(
      authService.login({
        email: "alice@mocklab.dev",
        password: "WrongPassword!",
      })
    ).rejects.toThrow(UnauthorizedException);

    const loginRes = await authService.login({
      email: "alice@mocklab.dev",
      password: "Password123!",
    });
    expect(loginRes.token).toBeDefined();
    expect(loginRes.user.email).toBe("alice@mocklab.dev");
  });
});
