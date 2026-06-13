import type { RequestContext } from "@aloy/shared";
import { Body, Controller, Delete, Get, Param, Patch, Post } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { RequirePermissions } from "../auth/auth.decorators";
import { CurrentRequestContext } from "../auth/request-context.decorator";
import { IamService } from "./iam.service";

@ApiTags("iam")
@Controller("api/v1/iam")
export class IamController {
  constructor(private readonly iamService: IamService) {}

  @Get("permissions")
  @RequirePermissions("role.read")
  listPermissions() {
    return this.iamService.listPermissions();
  }

  @Get("roles")
  @RequirePermissions("role.read")
  listRoles(@CurrentRequestContext() context: RequestContext) {
    return this.iamService.listRoles(context);
  }

  @Post("roles")
  @RequirePermissions("role.write")
  createRole(
    @CurrentRequestContext() context: RequestContext,
    @Body() body: { name: string; description?: string; permissionKeys?: string[] },
  ) {
    return this.iamService.createRole(context, body);
  }

  @Patch("roles/:id")
  @RequirePermissions("role.write")
  updateRole(
    @CurrentRequestContext() context: RequestContext,
    @Param("id") id: string,
    @Body() body: { name?: string; description?: string; permissionKeys?: string[] },
  ) {
    return this.iamService.updateRole(context, id, body);
  }

  @Delete("roles/:id")
  @RequirePermissions("role.write")
  removeRole(@CurrentRequestContext() context: RequestContext, @Param("id") id: string) {
    return this.iamService.removeRole(context, id);
  }
}
