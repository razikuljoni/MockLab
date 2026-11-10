import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  BadRequestException,
} from "@nestjs/common";
import { SpecsService } from "./specs.service";
import { AuthGuard } from "../auth/auth.guard";
import { RolesGuard, RequireRoles } from "../auth/roles.guard";
import { Role } from "@prisma/client";

@Controller("api/v1/projects/:projectId")
@UseGuards(AuthGuard, RolesGuard)
export class SpecsController {
  constructor(private readonly specsService: SpecsService) {}

  @Post("spec/import")
  async importSpec(
    @Param("projectId") projectId: string,
    @Body("rawSpec") rawSpec: string,
    @Body("sourceUrl") sourceUrl?: string
  ) {
    if (!rawSpec || typeof rawSpec !== "string") {
      throw new BadRequestException("rawSpec must be provided as a non-empty string");
    }
    return this.specsService.importSpec(projectId, rawSpec, sourceUrl);
  }

  @Get("endpoints")
  async listEndpoints(@Param("projectId") projectId: string) {
    return this.specsService.listEndpoints(projectId);
  }

  @Post("spec/diff")
  async previewDiff(
    @Param("projectId") projectId: string,
    @Body("rawSpec") rawSpec: string
  ) {
    if (!rawSpec || typeof rawSpec !== "string") {
      throw new BadRequestException("rawSpec must be provided as a non-empty string");
    }
    return this.specsService.previewDiff(projectId, rawSpec);
  }
}
