import type { RequestContext } from "@aloy/shared";
import { prisma, requireTenantScope } from "@aloy/database";
import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { hash } from "bcryptjs";

interface CreateUserInput {
  email: string;
  password: string;
  displayName: string;
  roleIds?: string[];
}

interface UpdateUserInput {
  displayName?: string;
  password?: string;
  status?: "ACTIVE" | "DISABLED" | "LOCKED";
  roleIds?: string[];
}

const userSelect = {
  id: true,
  tenantId: true,
  email: true,
  displayName: true,
  status: true,
  createdAt: true,
  updatedAt: true,
  userRoles: { select: { role: { select: { id: true, name: true } } } },
} as const;

@Injectable()
export class UserService {
  list(context: RequestContext) {
    const { tenantId } = requireTenantScope(context);
    return prisma.user.findMany({
      where: { tenantId, deletedAt: null },
      select: userSelect,
      orderBy: { createdAt: "desc" },
    });
  }

  async create(context: RequestContext, input: CreateUserInput) {
    const { tenantId } = requireTenantScope(context);
    const email = input.email.trim().toLowerCase();
    const displayName = input.displayName.trim();
    if (!email.includes("@") || !displayName || input.password.length < 12) {
      throw new BadRequestException("Valid email, display name, and 12-character password required");
    }

    return prisma.$transaction(async (transaction) => {
      await this.assertTenantRoles(transaction, tenantId, input.roleIds ?? []);
      const user = await transaction.user.create({
        data: {
          tenantId,
          email,
          displayName,
          passwordHash: await hash(input.password, 12),
          createdBy: context.userId,
          updatedBy: context.userId,
          userRoles: {
            create: (input.roleIds ?? []).map((roleId) => ({
              roleId,
              assignedBy: context.userId,
            })),
          },
        },
        select: userSelect,
      });
      await this.audit(transaction, context, tenantId, "user.create", user.id);
      return user;
    });
  }

  async update(context: RequestContext, id: string, input: UpdateUserInput) {
    const { tenantId } = requireTenantScope(context);
    if (input.password && input.password.length < 12) {
      throw new BadRequestException("Password must be at least 12 characters");
    }

    return prisma.$transaction(async (transaction) => {
      const existing = await transaction.user.findFirst({ where: { id, tenantId, deletedAt: null } });
      if (!existing) {
        throw new NotFoundException("User not found");
      }
      if (input.roleIds) {
        await this.assertTenantRoles(transaction, tenantId, input.roleIds);
        await transaction.userRole.deleteMany({ where: { userId: id } });
      }
      const user = await transaction.user.update({
        where: { id },
        data: {
          displayName: input.displayName?.trim(),
          passwordHash: input.password ? await hash(input.password, 12) : undefined,
          status: input.status,
          updatedBy: context.userId,
          userRoles: input.roleIds
            ? {
                create: input.roleIds.map((roleId) => ({
                  roleId,
                  assignedBy: context.userId,
                })),
              }
            : undefined,
        },
        select: userSelect,
      });
      await this.audit(transaction, context, tenantId, "user.update", id);
      return user;
    });
  }

  async remove(context: RequestContext, id: string) {
    const { tenantId } = requireTenantScope(context);
    if (id === context.userId) {
      throw new BadRequestException("Users cannot delete their own account");
    }
    return prisma.$transaction(async (transaction) => {
      const existing = await transaction.user.findFirst({ where: { id, tenantId, deletedAt: null } });
      if (!existing) {
        throw new NotFoundException("User not found");
      }
      const user = await transaction.user.update({
        where: { id },
        data: {
          status: "DISABLED",
          deletedAt: new Date(),
          updatedBy: context.userId,
        },
        select: userSelect,
      });
      await transaction.refreshToken.updateMany({
        where: { userId: id, revokedAt: null },
        data: { revokedAt: new Date() },
      });
      await this.audit(transaction, context, tenantId, "user.delete", id);
      return user;
    });
  }

  private async assertTenantRoles(
    transaction: Parameters<Parameters<typeof prisma.$transaction>[0]>[0],
    tenantId: string,
    roleIds: string[],
  ) {
    const count = await transaction.role.count({
      where: { id: { in: [...new Set(roleIds)] }, tenantId, deletedAt: null },
    });
    if (count !== new Set(roleIds).size) {
      throw new BadRequestException("Every role must belong to the current tenant");
    }
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
        resourceType: "User",
        resourceId,
        requestId: context.requestId,
      },
    });
  }
}
