import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  UseGuards,
  BadRequestException,
} from "@nestjs/common";
import { ProjectsService } from "./projects.service";
import { AuthGuard } from "../auth/auth.guard";
import { RolesGuard, RequireRoles } from "../auth/roles.guard";
import { Role, ProjectStatus } from "@prisma/client";
import { ProjectCreateSchema } from "@mocklab/shared";

@Controller("api/v1")
@UseGuards(AuthGuard, RolesGuard)
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Post("workspaces/:workspaceId/projects")
  @RequireRoles(Role.OWNER, Role.ADMIN, Role.EDITOR)
  async createProject(
    @Param("workspaceId") workspaceId: string,
    @Body() body: unknown
  ) {
    const parseResult = ProjectCreateSchema.safeParse(body);
    if (!parseResult.success) {
      throw new BadRequestException(parseResult.error.errors.map((e) => e.message).join(", "));
    }
    return this.projectsService.createProject(workspaceId, parseResult.data);
  }

  @Get("workspaces/:workspaceId/projects")
  async listProjects(@Param("workspaceId") workspaceId: string) {
    return this.projectsService.listWorkspaceProjects(workspaceId);
  }

  @Get("projects/:projectId")
  async getProject(@Param("projectId") projectId: string) {
    return this.projectsService.getProject(projectId);
  }

  @Patch("projects/:projectId/status")
  async setStatus(
    @Param("projectId") projectId: string,
    @Body("status") status: ProjectStatus
  ) {
    if (!status || !Object.values(ProjectStatus).includes(status)) {
      throw new BadRequestException("Invalid project status specified (must be LIVE or PAUSED)");
    }
    return this.projectsService.setProjectStatus(projectId, status);
  }
}
