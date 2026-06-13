interface RequestContext {
  tenantId: string | null;
  isPlatformAdmin: boolean;
  platformAccessReason?: string;
}

export interface TenantScope {
  tenantId: string;
}

export function requireTenantScope(context: RequestContext): TenantScope {
  if (context.tenantId) {
    return { tenantId: context.tenantId };
  }

  throw new Error("Tenant context is required");
}

export function requirePlatformAccess(context: RequestContext): void {
  if (!context.isPlatformAdmin) {
    throw new Error("Platform administrator access is required");
  }

  if (!context.platformAccessReason?.trim()) {
    throw new Error("Cross-tenant access reason is required");
  }
}
