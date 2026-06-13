import { Module } from "@nestjs/common";
import { HealthController } from "./health.controller";
import { HealthService } from "./health.service";
import { AuthModule } from "./auth/auth.module";
import { TenantModule } from "./tenant/tenant.module";
import { UserModule } from "./user/user.module";

@Module({
  imports: [AuthModule, TenantModule, UserModule],
  controllers: [HealthController],
  providers: [HealthService],
})
export class AppModule {}
