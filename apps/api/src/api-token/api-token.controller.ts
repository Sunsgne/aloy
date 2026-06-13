import type { RequestContext } from "@aloy/shared";
import { Body, Controller, Delete, Get, Param, Post } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { RequirePermissions } from "../auth/auth.decorators";
import { CurrentRequestContext } from "../auth/request-context.decorator";
import { ApiTokenService } from "./api-token.service";

@ApiTags("api-tokens")
@Controller("api/v1/api-tokens")
export class ApiTokenController {
  constructor(private readonly apiTokenService: ApiTokenService) {}

  @Get()
  @RequirePermissions("api-token.read")
  list(@CurrentRequestContext() context: RequestContext) {
    return this.apiTokenService.list(context);
  }

  @Post()
  @RequirePermissions("api-token.write")
  create(
    @CurrentRequestContext() context: RequestContext,
    @Body() body: { name: string; expiresAt?: string },
  ) {
    return this.apiTokenService.create(context, body);
  }

  @Delete(":id")
  @RequirePermissions("api-token.write")
  revoke(@CurrentRequestContext() context: RequestContext, @Param("id") id: string) {
    return this.apiTokenService.revoke(context, id);
  }
}
