import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  SetMetadata,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { CryptoUtil } from "./crypto.util";

export const IS_PUBLIC_KEY = "isPublic";
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

export interface RequestUser {
  [key: string]: unknown;
  userId: string;
  email: string;
}

@Injectable()
export class AuthGuard implements CanActivate {
  private readonly jwtSecret: string;

  constructor(private readonly reflector: Reflector) {
    this.jwtSecret = process.env.JWT_SECRET || "mocklab-dev-jwt-secret-min-32-chars-long";
  }

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization || request.headers.Authorization;

    let token: string | undefined;
    if (authHeader && typeof authHeader === "string" && authHeader.startsWith("Bearer ")) {
      token = authHeader.substring(7);
    } else if (request.cookies && request.cookies.mocklab_session) {
      token = request.cookies.mocklab_session;
    }

    if (!token) {
      throw new UnauthorizedException("Authentication required");
    }

    const payload = CryptoUtil.verifyJwt<RequestUser>(token, this.jwtSecret);
    if (!payload) {
      throw new UnauthorizedException("Invalid or expired session token");
    }

    request.user = payload;
    return true;
  }
}
