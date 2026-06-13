import { Body, Controller, Headers, Post } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { Public } from "../auth/auth.decorators";
import { DeviceService } from "./device.service";

@ApiTags("device-onboarding")
@Controller("api/v1")
export class DeviceOnboardingController {
  constructor(private readonly deviceService: DeviceService) {}

  @Public()
  @Post("device-onboarding/register")
  register(
    @Headers("authorization") authorization: string | undefined,
    @Body()
    body: {
      identity?: string;
      serialNumber?: string;
      model?: string;
      architectureName?: string;
      routerOsVersion?: string;
    },
  ) {
    return this.deviceService.registerDevice(authorization, body);
  }

  @Public()
  @Post("device-reports/heartbeat")
  heartbeat(
    @Headers("authorization") authorization: string | undefined,
    @Body()
    body: {
      sequence: number;
      timestamp: string;
      routerOsVersion?: string;
      managementAddress?: string;
      sessionId?: string;
      stepKey?: string;
      stepStatus?: "RUNNING" | "SUCCEEDED" | "FAILED";
    },
  ) {
    return this.deviceService.heartbeatDevice(authorization, body);
  }
}
