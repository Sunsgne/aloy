import type { RequestContext } from "@aloy/shared";
import { createParamDecorator, ExecutionContext } from "@nestjs/common";

export const CurrentRequestContext = createParamDecorator(
  (_data: unknown, context: ExecutionContext): RequestContext => {
    const request = context.switchToHttp().getRequest<{ user: RequestContext }>();
    return request.user;
  },
);
