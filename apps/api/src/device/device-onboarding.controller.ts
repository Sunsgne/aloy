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

  @Public()
  @Post("device-reports/discovery")
  discovery(
    @Headers("authorization") authorization: string | undefined,
    @Body()
    body: {
      sequence: number;
      timestamp: string;
      identity: {
        platformType: "ROUTERBOARD" | "CHR" | "X86" | "CLOUD_INSTANCE" | "UNKNOWN";
        identity?: string;
        boardName?: string;
        serialNumber?: string;
        softwareId?: string;
        systemId?: string;
        model?: string;
        revision?: string;
        architectureName?: string;
        cpu?: string;
        cpuCount?: number;
        cpuFrequencyMhz?: number;
        totalMemoryBytes?: number;
        totalStorageBytes?: number;
        routerOsVersion?: string;
        buildTime?: string;
        factorySoftware?: string;
        licenseLevel?: string;
        currentFirmware?: string;
        upgradeFirmware?: string;
        deviceMode?: string;
        deviceModeFlagged?: boolean;
        deviceModeFeatures?: string[];
      };
      packages?: Array<{ name: string; version: string; disabled?: boolean; scheduled?: boolean }>;
      capabilities?: Array<{
        key: string;
        status: "SUPPORTED" | "SUPPORTED_WITH_LIMITS" | "UNSUPPORTED" | "DISABLED_BY_PACKAGE" | "DISABLED_BY_DEVICE_MODE" | "UNSUPPORTED_VERSION" | "UNSUPPORTED_PLATFORM" | "UNKNOWN";
        reason?: string;
      }>;
    },
  ) {
    return this.deviceService.reportDiscovery(authorization, body);
  }
}
