import type { RequestContext } from "@aloy/shared";
import { Body, Controller, Delete, Get, Param, Patch, Post } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { RequirePermissions } from "../auth/auth.decorators";
import { CurrentRequestContext } from "../auth/request-context.decorator";
import { UserService } from "./user.service";

@ApiTags("users")
@Controller("api/v1/users")
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  @RequirePermissions("user.read")
  list(@CurrentRequestContext() context: RequestContext) {
    return this.userService.list(context);
  }

  @Post()
  @RequirePermissions("user.write")
  create(
    @CurrentRequestContext() context: RequestContext,
    @Body() body: { email: string; password: string; displayName: string; roleIds?: string[] },
  ) {
    return this.userService.create(context, body);
  }

  @Patch(":id")
  @RequirePermissions("user.write")
  update(
    @CurrentRequestContext() context: RequestContext,
    @Param("id") id: string,
    @Body()
    body: {
      displayName?: string;
      password?: string;
      status?: "ACTIVE" | "DISABLED" | "LOCKED";
      roleIds?: string[];
    },
  ) {
    return this.userService.update(context, id, body);
  }

  @Delete(":id")
  @RequirePermissions("user.write")
  remove(@CurrentRequestContext() context: RequestContext, @Param("id") id: string) {
    return this.userService.remove(context, id);
  }
}
