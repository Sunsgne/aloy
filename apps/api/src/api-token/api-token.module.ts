import { Module } from "@nestjs/common";
import { ApiTokenController } from "./api-token.controller";
import { ApiTokenService } from "./api-token.service";

@Module({
  controllers: [ApiTokenController],
  providers: [ApiTokenService],
})
export class ApiTokenModule {}
