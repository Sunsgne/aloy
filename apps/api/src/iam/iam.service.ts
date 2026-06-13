import type { RequestContext } from "@aloy/shared";
import { prisma, requireTenantScope } from "@aloy/database";
import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";

interface SaveRoleInput {
  name?: string;
  description?: string;
  permissionKeys?: string[];
}

const roleSelect = {
  id: true,
  tenantId: true,
  name: true,
  description: true,
  createdAt: true,
  updatedAt: true,
  permissions: { select: { permission: { select: { key: true, description: true } } } },
} as const;

@Injectable()
export class IamService {
  listPermissions() {
    return prisma.permission.findMany({ orderBy: { key: "asc" } });
  }

  listRoles(context: RequestContext) {
    const { tenantId } = requireTenantScope(context);
    return prisma.role.findMany({
      where: { tenantId, deletedAt: null },
      select: roleSelect,
      orderBy: { name: "asc" },
    });
  }

  createRole(context: RequestContext, input: SaveRoleInput) {
    const { tenantId } = requireTenantScope(context);
    const name = input.name?.trim();
    if (!name) {
      throw new BadRequestException("Role name is required");
    }
    return prisma.$transaction(async (transaction) => {
      const permissions = await this.resolvePermissions(transaction, input.permissionKeys ?? []);
      const role = await transaction.role.create({
        data: {
          tenantId,
          name,
          description: input.description?.trim(),
          createdBy: context.userId,
          updatedBy: context.userId,
          permissions: {
            create: permissions.map((permission) => ({ permissionId: permission.id })),
          },
        },
        select: roleSelect,
      });
      await this.audit(transaction, context, tenantId, "role.create", role.id);
      return role;
    });
  }

  updateRole(context: RequestContext, id: string, input: SaveRoleInput) {
    const { tenantId } = requireTenantScope(context);
    return prisma.$transaction(async (transaction) => {
      const existing = await transaction.role.findFirst({ where: { id, tenantId, deletedAt: null } });
      if (!existing) {
        throw new NotFoundException("Role not found");
      }
      const permissions = input.permissionKeys
        ? await this.resolvePermissions(transaction, input.permissionKeys)
        : null;
      if (permissions) {
        await transaction.rolePermission.deleteMany({ where: { roleId: id } });
      }
      const role = await transaction.role.update({
        where: { id },
        data: {
          name: input.name?.trim(),
          description: input.description?.trim(),
          updatedBy: context.userId,
          permissions: permissions
            ? { create: permissions.map((permission) => ({ permissionId: permission.id })) }
            : undefined,
        },
        select: roleSelect,
      });
      await this.audit(transaction, context, tenantId, "role.update", id);
      return role;
    });
  }

  removeRole(context: RequestContext, id: string) {
    const { tenantId } = requireTenantScope(context);
    return prisma.$transaction(async (transaction) => {
      const existing = await transaction.role.findFirst({ where: { id, tenantId, deletedAt: null } });
      if (!existing) {
        throw new NotFoundException("Role not found");
      }
      const role = await transaction.role.update({
        where: { id },
        data: { deletedAt: new Date(), updatedBy: context.userId },
        select: roleSelect,
      });
      await this.audit(transaction, context, tenantId, "role.delete", id);
      return role;
    });
  }

  private async resolvePermissions(
    transaction: Parameters<Parameters<typeof prisma.$transaction>[0]>[0],
    permissionKeys: string[],
  ) {
    const uniqueKeys = [...new Set(permissionKeys)];
    const permissions = await transaction.permission.findMany({ where: { key: { in: uniqueKeys } } });
    if (permissions.length !== uniqueKeys.length) {
      throw new BadRequestException("Unknown permission key");
    }
    return permissions;
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
        resourceType: "Role",
        resourceId,
        requestId: context.requestId,
      },
    });
  }
}
