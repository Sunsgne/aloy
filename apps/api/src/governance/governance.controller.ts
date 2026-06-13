import type { RequestContext } from "@aloy/shared";
import { Body, Controller, Get, Post, Query } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { RequirePermissions } from "../auth/auth.decorators";
import { CurrentRequestContext } from "../auth/request-context.decorator";
import { GovernanceService } from "./governance.service";

@ApiTags("governance")
@Controller("api/v1")
export class GovernanceController {
  constructor(private readonly governanceService: GovernanceService) {}

  @Get("subscription")
  @RequirePermissions("subscription.read")
  getCurrentSubscription(@CurrentRequestContext() context: RequestContext) {
    return this.governanceService.getCurrentSubscription(context);
  }

  @Post("subscriptions")
  @RequirePermissions("subscription.write")
  createSubscription(
    @CurrentRequestContext() context: RequestContext,
    @Body()
    body: {
      tenantId: string;
      planKey: string;
      siteLimit: number;
      deviceLimit: number;
      bandwidthMbps: number;
      dnsNodeScopes?: string[];
      startsAt?: string;
      endsAt?: string;
    },
  ) {
    return this.governanceService.createSubscription(context, body);
  }

  @Get("audit-events")
  @RequirePermissions("audit.read")
  listAuditEvents(
    @CurrentRequestContext() context: RequestContext,
    @Query("tenantId") tenantId?: string,
    @Query("limit") limit?: string,
  ) {
    return this.governanceService.listAuditEvents(context, tenantId, limit ? Number(limit) : undefined);
  }
}
