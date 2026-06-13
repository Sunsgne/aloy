import type { RequestContext } from "@aloy/shared";
import { prisma, requirePlatformAccess } from "@aloy/database";
import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";

interface CreateTenantInput {
  name: string;
  slug: string;
}

interface UpdateTenantInput {
  name?: string;
  status?: "ACTIVE" | "DISABLED";
}

@Injectable()
export class TenantService {
  list(context: RequestContext) {
    requirePlatformAccess(context);
    return prisma.tenant.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: "desc" },
    });
  }

  async get(context: RequestContext, id: string) {
    requirePlatformAccess(context);
    const tenant = await prisma.tenant.findFirst({ where: { id, deletedAt: null } });
    if (!tenant) {
      throw new NotFoundException("Tenant not found");
    }
    return tenant;
  }

  create(context: RequestContext, input: CreateTenantInput) {
    requirePlatformAccess(context);
    const name = input.name.trim();
    const slug = input.slug.trim().toLowerCase();
    if (!name || !/^[a-z0-9][a-z0-9-]{1,62}$/.test(slug)) {
      throw new BadRequestException("A name and valid tenant slug are required");
    }

    return prisma.$transaction(async (transaction) => {
      const tenant = await transaction.tenant.create({
        data: {
          name,
          slug,
          createdBy: context.userId,
          updatedBy: context.userId,
        },
      });
      await this.audit(transaction, context, "tenant.create", tenant.id, { name, slug });
      return tenant;
    });
  }

  async update(context: RequestContext, id: string, input: UpdateTenantInput) {
    requirePlatformAccess(context);
    if (!input.name && !input.status) {
      throw new BadRequestException("At least one tenant field is required");
    }

    return prisma.$transaction(async (transaction) => {
      const existing = await transaction.tenant.findFirst({ where: { id, deletedAt: null } });
      if (!existing) {
        throw new NotFoundException("Tenant not found");
      }
      const tenant = await transaction.tenant.update({
        where: { id },
        data: {
          name: input.name?.trim(),
          status: input.status,
          updatedBy: context.userId,
        },
      });
      await this.audit(transaction, context, "tenant.update", id, input);
      return tenant;
    });
  }

  async remove(context: RequestContext, id: string) {
    requirePlatformAccess(context);
    return prisma.$transaction(async (transaction) => {
      const existing = await transaction.tenant.findFirst({ where: { id, deletedAt: null } });
      if (!existing) {
        throw new NotFoundException("Tenant not found");
      }
      const tenant = await transaction.tenant.update({
        where: { id },
        data: {
          status: "DELETED",
          deletedAt: new Date(),
          updatedBy: context.userId,
        },
      });
      await this.audit(transaction, context, "tenant.delete", id);
      return tenant;
    });
  }

  private audit(
    transaction: Parameters<Parameters<typeof prisma.$transaction>[0]>[0],
    context: RequestContext,
    action: string,
    resourceId: string,
    metadata?: object,
  ) {
    return transaction.auditEvent.create({
      data: {
        actorUserId: context.userId,
        action,
        resourceType: "Tenant",
        resourceId,
        requestId: context.requestId,
        accessReason: context.platformAccessReason,
        metadata,
      },
    });
  }
}
