import { randomUUID } from "node:crypto";
import type { RequestContext } from "@aloy/shared";
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { JwtService } from "@nestjs/jwt";
import { IS_PUBLIC_KEY } from "./auth.decorators";

interface AuthenticatedRequest {
  headers: {
    authorization?: string;
    "x-access-reason"?: string;
    "x-request-id"?: string;
  };
  user?: RequestContext;
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const [scheme, token] = request.headers.authorization?.split(" ") ?? [];
    if (scheme !== "Bearer" || !token) {
      throw new UnauthorizedException("Bearer token is required");
    }

    try {
      const payload = await this.jwtService.verifyAsync<{
        sub: string;
        tenantId: string | null;
        roles: string[];
        permissions: string[];
      }>(token);
      request.user = {
        userId: payload.sub,
        tenantId: payload.tenantId,
        roles: payload.roles,
        permissions: payload.permissions,
        isPlatformAdmin: payload.tenantId === null,
        requestId: request.headers["x-request-id"] ?? randomUUID(),
        platformAccessReason: request.headers["x-access-reason"],
      };
      return true;
    } catch {
      throw new UnauthorizedException("Invalid access token");
    }
  }
}
