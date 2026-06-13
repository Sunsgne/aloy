import type { RequestContext } from "@aloy/shared";
import { prisma, requireTenantScope } from "@aloy/database";
import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { createHash, randomBytes } from "node:crypto";

interface CreateApiTokenInput {
  name: string;
  expiresAt?: string;
}

const apiTokenSelect = {
  id: true,
  tenantId: true,
  name: true,
  expiresAt: true,
  revokedAt: true,
  createdAt: true,
  updatedAt: true,
} as const;

@Injectable()
export class ApiTokenService {
  list(context: RequestContext) {
    const { tenantId } = requireTenantScope(context);
    return prisma.apiToken.findMany({
      where: { tenantId, deletedAt: null },
      select: apiTokenSelect,
      orderBy: { createdAt: "desc" },
    });
  }

  create(context: RequestContext, input: CreateApiTokenInput) {
    const { tenantId } = requireTenantScope(context);
    const name = input.name?.trim();
    const expiresAt = input.expiresAt ? new Date(input.expiresAt) : undefined;
    if (!name) {
      throw new BadRequestException("Token name is required");
    }
    if (expiresAt && (Number.isNaN(expiresAt.valueOf()) || expiresAt <= new Date())) {
      throw new BadRequestException("Token expiry must be a valid future date");
    }

    const token = `aloy_${randomBytes(32).toString("base64url")}`;
    return prisma.$transaction(async (transaction) => {
      const apiToken = await transaction.apiToken.create({
        data: {
          tenantId,
          name,
          tokenHash: createHash("sha256").update(token).digest("hex"),
          expiresAt,
          createdBy: context.userId,
          updatedBy: context.userId,
        },
        select: apiTokenSelect,
      });
      await this.audit(transaction, context, tenantId, "api-token.create", apiToken.id);
      return { ...apiToken, token };
    });
  }

  revoke(context: RequestContext, id: string) {
    const { tenantId } = requireTenantScope(context);
    return prisma.$transaction(async (transaction) => {
      const existing = await transaction.apiToken.findFirst({
        where: { id, tenantId, deletedAt: null },
      });
      if (!existing) {
        throw new NotFoundException("API token not found");
      }
      const apiToken = await transaction.apiToken.update({
        where: { id },
        data: {
          revokedAt: existing.revokedAt ?? new Date(),
          updatedBy: context.userId,
        },
        select: apiTokenSelect,
      });
      await this.audit(transaction, context, tenantId, "api-token.revoke", id);
      return apiToken;
    });
  }

  private audit(
    transaction: Parameters<Parameters<typeof prisma.$transaction>[0]>[0],
    context: RequestContext,
    tenantId: string,
    action: string,
    resourceId: string,
  ) {
    return transaction.auditEvent.create({
      data: {
        tenantId,
        actorUserId: context.userId,
        action,
        resourceType: "ApiToken",
        resourceId,
        requestId: context.requestId,
      },
    });
  }
}
