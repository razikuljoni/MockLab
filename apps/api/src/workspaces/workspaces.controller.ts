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

  /**
   * Keys access check endpoint (§6.7 & Phase 1 acceptance gate)
   * Viewers are explicitly forbidden (403) from accessing keys!
   */
  @Get(":workspaceId/keys")
  @RequireRoles(Role.OWNER, Role.ADMIN, Role.EDITOR)
  async getKeys(
    @Param("workspaceId") workspaceId: string
  ) {
    return {
      workspaceId,
      keys: [],
      message: "Keys endpoint authorized",
    };
  }
}
