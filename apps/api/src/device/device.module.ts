import { Module } from "@nestjs/common";
import { DeviceController } from "./device.controller";
import { DeviceOnboardingController } from "./device-onboarding.controller";
import { DeviceService } from "./device.service";

@Module({
  controllers: [DeviceController, DeviceOnboardingController],
  providers: [DeviceService],
})
export class DeviceModule {}
