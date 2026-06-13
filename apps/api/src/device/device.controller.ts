import type { RequestContext } from "@aloy/shared";
import { Body, Controller, Get, Param, Post, Query } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { RequirePermissions } from "../auth/auth.decorators";
import { CurrentRequestContext } from "../auth/request-context.decorator";
import { DeviceService } from "./device.service";

type OnboardingMode = "CLEAN_BOOTSTRAP" | "ADOPT_EXISTING" | "MONITORING_ONLY" | "POP_NODE";

@ApiTags("devices")
@Controller("api/v1")
export class DeviceController {
  constructor(private readonly deviceService: DeviceService) {}

  @Get("sites")
  @RequirePermissions("site.read")
  listSites(@CurrentRequestContext() context: RequestContext) {
    return this.deviceService.listSites(context);
  }

  @Post("sites")
  @RequirePermissions("site.write")
  createSite(
    @CurrentRequestContext() context: RequestContext,
    @Body() body: { name: string; code: string; description?: string; timezone?: string },
  ) {
    return this.deviceService.createSite(context, body);
  }

  @Get("devices")
  @RequirePermissions("device.read")
  listDevices(@CurrentRequestContext() context: RequestContext) {
    return this.deviceService.listDevices(context);
  }

  @Post("devices")
  @RequirePermissions("device.write")
  createDevice(
    @CurrentRequestContext() context: RequestContext,
    @Body() body: { siteId: string; name: string; serialNumber?: string; model?: string },
  ) {
    return this.deviceService.createDevice(context, body);
  }

  @Post("devices/:id/bootstrap-tokens")
  @RequirePermissions("onboarding.write")
  issueBootstrapToken(
    @CurrentRequestContext() context: RequestContext,
    @Param("id") id: string,
    @Body() body: { mode: OnboardingMode; expiresInMinutes?: number },
  ) {
    return this.deviceService.issueBootstrapToken(context, id, body);
  }

  @Get("devices/:id/bootstrap-script")
  @RequirePermissions("onboarding.write")
  getBootstrapScript(
    @CurrentRequestContext() context: RequestContext,
    @Param("id") id: string,
    @Query("mode") mode: OnboardingMode,
    @Query("apiBaseUrl") apiBaseUrl: string,
    @Query("expiresInMinutes") expiresInMinutes?: string,
  ) {
    return this.deviceService.getBootstrapScript(context, id, {
      mode,
      apiBaseUrl,
      expiresInMinutes: expiresInMinutes ? Number(expiresInMinutes) : undefined,
    });
  }

  @Get("onboarding-sessions")
  @RequirePermissions("onboarding.read")
  listOnboardingSessions(@CurrentRequestContext() context: RequestContext) {
    return this.deviceService.listOnboardingSessions(context);
  }
}
