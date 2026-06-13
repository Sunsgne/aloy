import { Module } from "@nestjs/common";
import { HealthController } from "./health.controller";
import { HealthService } from "./health.service";
import { AuthModule } from "./auth/auth.module";
import { TenantModule } from "./tenant/tenant.module";
import { UserModule } from "./user/user.module";
import { IamModule } from "./iam/iam.module";
import { GovernanceModule } from "./governance/governance.module";
import { ApiTokenModule } from "./api-token/api-token.module";
import { DeviceModule } from "./device/device.module";

@Module({
  imports: [AuthModule, TenantModule, UserModule, IamModule, GovernanceModule, ApiTokenModule, DeviceModule],
  controllers: [HealthController],
  providers: [HealthService],
})
export class AppModule {}
