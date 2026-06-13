import type { RequestContext } from "@aloy/shared";
import { prisma, requirePlatformAccess, requireTenantScope } from "@aloy/database";
import { BadRequestException, Injectable } from "@nestjs/common";

interface CreateSubscriptionInput {
  tenantId: string;
  planKey: string;
  siteLimit: number;
  deviceLimit: number;
  bandwidthMbps: number;
  dnsNodeScopes?: string[];
  startsAt?: string;
  endsAt?: string;
}

@Injectable()
export class GovernanceService {
  getCurrentSubscription(context: RequestContext) {
    const { tenantId } = requireTenantScope(context);
    return prisma.subscription.findFirst({
      where: { tenantId, deletedAt: null, status: "ACTIVE" },
      orderBy: { startsAt: "desc" },
    });
  }

  createSubscription(context: RequestContext, input: CreateSubscriptionInput) {
    requirePlatformAccess(context);
    if (
      !input.tenantId ||
      !input.planKey.trim() ||
      [input.siteLimit, input.deviceLimit, input.bandwidthMbps].some(
        (value) => !Number.isInteger(value) || value < 0,
      )
    ) {
      throw new BadRequestException("Valid tenant, plan, and non-negative quotas are required");
    }

    return prisma.$transaction(async (transaction) => {
      const subscription = await transaction.subscription.create({
        data: {
          tenantId: input.tenantId,
          planKey: input.planKey.trim(),
          siteLimit: input.siteLimit,
          deviceLimit: input.deviceLimit,
          bandwidthMbps: input.bandwidthMbps,
          dnsNodeScopes: input.dnsNodeScopes ?? [],
          startsAt: input.startsAt ? new Date(input.startsAt) : new Date(),
          endsAt: input.endsAt ? new Date(input.endsAt) : undefined,
          createdBy: context.userId,
          updatedBy: context.userId,
        },
      });
      await transaction.auditEvent.create({
        data: {
          tenantId: input.tenantId,
          actorUserId: context.userId,
          action: "subscription.create",
          resourceType: "Subscription",
          resourceId: subscription.id,
          requestId: context.requestId,
          accessReason: context.platformAccessReason,
        },
      });
      return subscription;
    });
  }

  listAuditEvents(context: RequestContext, requestedTenantId?: string, requestedLimit?: number) {
    const limit = Math.min(Math.max(requestedLimit ?? 50, 1), 200);
    if (context.isPlatformAdmin) {
      requirePlatformAccess(context);
      if (!requestedTenantId) {
        throw new BadRequestException("tenantId is required for platform audit queries");
      }
      return prisma.auditEvent.findMany({
        where: { tenantId: requestedTenantId },
        orderBy: { createdAt: "desc" },
        take: limit,
      });
    }

    const { tenantId } = requireTenantScope(context);
    return prisma.auditEvent.findMany({
      where: { tenantId },
      orderBy: { createdAt: "desc" },
      take: limit,
    });
  }
}
