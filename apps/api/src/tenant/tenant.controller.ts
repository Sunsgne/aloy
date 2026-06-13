import type { RequestContext } from "@aloy/shared";
import { Body, Controller, Delete, Get, Param, Patch, Post } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { RequirePermissions } from "../auth/auth.decorators";
import { CurrentRequestContext } from "../auth/request-context.decorator";
import { TenantService } from "./tenant.service";

interface CreateTenantBody {
  name: string;
  slug: string;
}

interface UpdateTenantBody {
  name?: string;
  status?: "ACTIVE" | "DISABLED";
}

@ApiTags("tenants")
@Controller("api/v1/tenants")
export class TenantController {
  constructor(private readonly tenantService: TenantService) {}

  @Get()
  @RequirePermissions("tenant.read")
  list(@CurrentRequestContext() context: RequestContext) {
    return this.tenantService.list(context);
  }

  @Get(":id")
  @RequirePermissions("tenant.read")
  get(@CurrentRequestContext() context: RequestContext, @Param("id") id: string) {
    return this.tenantService.get(context, id);
  }

  @Post()
  @RequirePermissions("tenant.write")
  create(@CurrentRequestContext() context: RequestContext, @Body() body: CreateTenantBody) {
    return this.tenantService.create(context, body);
  }

  @Patch(":id")
  @RequirePermissions("tenant.write")
  update(
    @CurrentRequestContext() context: RequestContext,
    @Param("id") id: string,
    @Body() body: UpdateTenantBody,
  ) {
    return this.tenantService.update(context, id, body);
  }

  @Delete(":id")
  @RequirePermissions("tenant.write")
  remove(@CurrentRequestContext() context: RequestContext, @Param("id") id: string) {
    return this.tenantService.remove(context, id);
  }
}
