import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  SetMetadata,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { Role } from "@prisma/client";
import { DataStoreService } from "../prisma/data-store.service";

export const ROLES_KEY = "roles";
export const RequireRoles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly dataStore: DataStoreService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;
    if (!user || !user.userId) {
      throw new ForbiddenException("Authentication required for role verification");
    }

    // Determine target workspaceId from params, headers, or query
    const workspaceId =
      request.params.workspaceId ||
      request.params.id ||
      request.headers["x-workspace-id"] ||
      request.query.workspaceId;

    if (!workspaceId) {
      // If endpoint requires roles but no workspaceId is in scope, deny by default
      throw new ForbiddenException("Workspace context missing for role verification");
    }

    const member = await this.dataStore.getWorkspaceMember(workspaceId, user.userId);
    if (!member) {
      throw new ForbiddenException("User is not a member of this workspace");
    }

    const hasRole = requiredRoles.includes(member.role);
    if (!hasRole) {
      throw new ForbiddenException(`Role '${member.role}' has insufficient permissions (required: ${requiredRoles.join(", ")})`);
    }

    request.workspaceMember = member;
    return true;
  }
}
