import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Req,
  UseGuards,
  BadRequestException,
} from "@nestjs/common";
import { WorkspacesService } from "./workspaces.service";
import { AuthGuard } from "../auth/auth.guard";
import { RolesGuard, RequireRoles } from "../auth/roles.guard";
import { Role } from "@prisma/client";
import { WorkspaceCreateSchema, WorkspaceInviteSchema } from "@mocklab/shared";

@Controller("api/v1/workspaces")
@UseGuards(AuthGuard, RolesGuard)
export class WorkspacesController {
  constructor(private readonly workspacesService: WorkspacesService) {}

  @Post()
  async createWorkspace(
    @Req() req: { user: { userId: string } },
    @Body() body: unknown
  ) {
    const parseResult = WorkspaceCreateSchema.safeParse(body);
    if (!parseResult.success) {
      throw new BadRequestException(parseResult.error.errors.map((e) => e.message).join(", "));
    }
    return this.workspacesService.createWorkspace(req.user.userId, parseResult.data);
  }

  @Get()
  async listUserWorkspaces(@Req() req: { user: { userId: string } }) {
    return this.workspacesService.listUserWorkspaces(req.user.userId);
  }

  @Get(":workspaceId")
  async getWorkspace(
    @Req() req: { user: { userId: string } },
    @Param("workspaceId") workspaceId: string
  ) {
    return this.workspacesService.getWorkspace(workspaceId, req.user.userId);
  }

  @Get(":workspaceId/members")
  async listMembers(
    @Req() req: { user: { userId: string } },
    @Param("workspaceId") workspaceId: string
  ) {
    return this.workspacesService.listMembers(workspaceId, req.user.userId);
  }

  @Post(":workspaceId/invites")
  @RequireRoles(Role.OWNER, Role.ADMIN)
  async inviteMember(
    @Req() req: { user: { userId: string } },
    @Param("workspaceId") workspaceId: string,
    @Body() body: unknown
  ) {
    const parseResult = WorkspaceInviteSchema.safeParse(body);
    if (!parseResult.success) {
      throw new BadRequestException(parseResult.error.errors.map((e) => e.message).join(", "));
    }
    return this.workspacesService.inviteMember(
      workspaceId,
      req.user.userId,
      parseResult.data
    );
  }

  @Patch(":workspaceId/members/:targetUserId")
  @RequireRoles(Role.OWNER, Role.ADMIN)
  async updateMemberRole(
    @Req() req: { user: { userId: string } },
    @Param("workspaceId") workspaceId: string,
    @Param("targetUserId") targetUserId: string,
    @Body("role") role: Role
  ) {
    if (!role || !Object.values(Role).includes(role)) {
      throw new BadRequestException("Invalid role specified");
    }
    return this.workspacesService.updateMemberRole(
      workspaceId,
      req.user.userId,
      targetUserId,
      role
    );
  }

  @Delete(":workspaceId/members/:targetUserId")
  @RequireRoles(Role.OWNER, Role.ADMIN)
  async removeMember(
    @Req() req: { user: { userId: string } },
    @Param("workspaceId") workspaceId: string,
    @Param("targetUserId") targetUserId: string
  ) {
    return this.workspacesService.removeMember(
      workspaceId,
      req.user.userId,
      targetUserId
    );
  }

  @Patch(":workspaceId")
  @RequireRoles(Role.OWNER, Role.ADMIN)
  async updateSettings(
    @Req() req: { user: { userId: string } },
    @Param("workspaceId") workspaceId: string,
    @Body()
    body: {
      name?: string;
      slug?: string;
      defaultEnv?: string;
      mockAuthDefault?: "PUBLIC" | "PRIVATE";
      logRetentionDays?: number;
    }
  ) {
    return this.workspacesService.updateSettings(workspaceId, req.user.userId, body);
  }

  @Post(":workspaceId/pause-all")
  @RequireRoles(Role.OWNER, Role.ADMIN)
  async pauseAllProjects(
    @Req() req: { user: { userId: string } },
    @Param("workspaceId") workspaceId: string
  ) {
    return this.workspacesService.pauseAllProjects(workspaceId, req.user.userId);
  }

  @Delete(":workspaceId")
  @RequireRoles(Role.OWNER)
  async deleteWorkspace(
    @Req() req: { user: { userId: string } },
    @Param("workspaceId") workspaceId: string
  ) {
    return this.workspacesService.deleteWorkspace(workspaceId, req.user.userId);
  }

  @Get(":workspaceId/billing")
  @RequireRoles(Role.OWNER, Role.ADMIN)
  async getBilling(
    @Req() req: { user: { userId: string } },
    @Param("workspaceId") workspaceId: string
  ) {
    return this.workspacesService.getBilling(workspaceId, req.user.userId);
  }

  @Patch(":workspaceId/billing")
  @RequireRoles(Role.OWNER)
  async updateBilling(
    @Req() req: { user: { userId: string } },
    @Param("workspaceId") workspaceId: string,
    @Body("plan") plan: string
  ) {
    if (!plan || !(plan.toUpperCase() in Role || plan.toUpperCase() in ["FREE", "PRO", "TEAM"])) {
      // Allow FREE, PRO, TEAM
    }
    return this.workspacesService.updateBilling(
      workspaceId,
      req.user.userId,
      plan.toUpperCase() as any
    );
  }
}
