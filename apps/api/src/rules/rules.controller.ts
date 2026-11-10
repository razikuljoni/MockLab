import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  BadRequestException,
} from "@nestjs/common";
import { RulesService } from "./rules.service";
import { AuthGuard } from "../auth/auth.guard";
import { RolesGuard, RequireRoles } from "../auth/roles.guard";
import { Role } from "@prisma/client";

@Controller("api/v1/projects/:projectId/rules")
@UseGuards(AuthGuard, RolesGuard)
export class RulesController {
  constructor(private readonly rulesService: RulesService) {}

  @Get()
  async listRules(
    @Param("projectId") projectId: string,
    @Query("operationId") operationId?: string
  ) {
    return this.rulesService.listRules(projectId, operationId);
  }

  @Post()
  @RequireRoles(Role.OWNER, Role.ADMIN, Role.EDITOR)
  async createRule(
    @Param("projectId") projectId: string,
    @Body() body: any
  ) {
    if (!body.operationId || !body.name) {
      throw new BadRequestException("operationId and name are required");
    }
    return this.rulesService.createRule(projectId, body);
  }

  @Patch("reorder")
  @RequireRoles(Role.OWNER, Role.ADMIN, Role.EDITOR)
  async reorderRules(
    @Param("projectId") projectId: string,
    @Body("ruleIds") ruleIds: string[]
  ) {
    if (!Array.isArray(ruleIds)) {
      throw new BadRequestException("ruleIds must be an array of rule IDs in priority order");
    }
    return this.rulesService.reorderRules(projectId, ruleIds);
  }

  @Post(":ruleId/duplicate")
  @RequireRoles(Role.OWNER, Role.ADMIN, Role.EDITOR)
  async duplicateRule(@Param("ruleId") ruleId: string) {
    return this.rulesService.duplicateRule(ruleId);
  }

  @Patch(":ruleId")
  @RequireRoles(Role.OWNER, Role.ADMIN, Role.EDITOR)
  async updateRule(
    @Param("ruleId") ruleId: string,
    @Body() body: any
  ) {
    return this.rulesService.updateRule(ruleId, body);
  }

  @Delete(":ruleId")
  @RequireRoles(Role.OWNER, Role.ADMIN, Role.EDITOR)
  async deleteRule(@Param("ruleId") ruleId: string) {
    return this.rulesService.deleteRule(ruleId);
  }

  @Post(":ruleId/test")
  async testRule(
    @Param("ruleId") ruleId: string,
    @Body() testReq: any
  ) {
    return this.rulesService.testRule(ruleId, testReq);
  }
}
