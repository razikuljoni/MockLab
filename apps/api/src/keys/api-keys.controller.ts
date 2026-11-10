import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  UseGuards,
} from "@nestjs/common";
import { AuthGuard } from "../auth/auth.guard";
import { RolesGuard, RequireRoles } from "../auth/roles.guard";
import { Role } from "@prisma/client";
import { ApiKeysService, CreateApiKeyDto } from "./api-keys.service";

@Controller("api/v1/workspaces/:workspaceId/keys")
@UseGuards(AuthGuard, RolesGuard)
export class ApiKeysController {
  constructor(private readonly apiKeysService: ApiKeysService) {}

  @Get()
  @RequireRoles(Role.OWNER, Role.ADMIN, Role.EDITOR)
  async listKeys(@Param("workspaceId") workspaceId: string) {
    const keys = await this.apiKeysService.listKeys(workspaceId);
    return keys.map((k) => ({
      id: k.id,
      workspaceId: k.workspaceId,
      name: k.name,
      prefix: k.prefix,
      last4: k.last4,
      scopes: k.scopes,
      rateLimitPerMin: k.rateLimitPerMin,
      monthlyQuota: k.monthlyQuota,
      revokedAt: k.revokedAt,
      createdAt: k.createdAt,
      lastUsedAt: k.lastUsedAt,
    }));
  }

  @Post()
  @RequireRoles(Role.OWNER, Role.ADMIN, Role.EDITOR)
  async createKey(
    @Param("workspaceId") workspaceId: string,
    @Body() body: CreateApiKeyDto
  ) {
    return this.apiKeysService.createKey(workspaceId, body);
  }

  @Post(":keyId/revoke")
  @RequireRoles(Role.OWNER, Role.ADMIN, Role.EDITOR)
  async revokeKey(
    @Param("workspaceId") workspaceId: string,
    @Param("keyId") keyId: string
  ) {
    return this.apiKeysService.revokeKey(workspaceId, keyId);
  }

  @Delete(":keyId")
  @RequireRoles(Role.OWNER, Role.ADMIN)
  async deleteKey(
    @Param("workspaceId") workspaceId: string,
    @Param("keyId") keyId: string
  ) {
    const success = await this.apiKeysService.deleteKey(workspaceId, keyId);
    return { success, message: "API key deleted" };
  }
}
