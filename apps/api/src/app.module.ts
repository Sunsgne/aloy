import { Module } from "@nestjs/common";
import { HealthController } from "./health.controller";
import { HealthService } from "./health.service";
import { AuthModule } from "./auth/auth.module";
import { TenantModule } from "./tenant/tenant.module";

@Module({
  imports: [AuthModule, TenantModule],
  controllers: [HealthController],
  providers: [HealthService],
})
export class AppModule {}
