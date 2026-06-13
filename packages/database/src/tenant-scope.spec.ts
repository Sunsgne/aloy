import { describe, expect, it } from "vitest";
import type { RequestContext } from "@aloy/shared";
import { requirePlatformAccess, requireTenantScope } from "./tenant-scope.js";

const tenantContext: RequestContext = {
  userId: "user-1",
  tenantId: "tenant-1",
  roles: [],
  permissions: [],
  isPlatformAdmin: false,
  requestId: "request-1",
};

describe("tenant scope", () => {
  it("requires tenant context for tenant queries", () => {
    expect(requireTenantScope(tenantContext)).toEqual({ tenantId: "tenant-1" });
    expect(() => requireTenantScope({ ...tenantContext, tenantId: null })).toThrow(
      "Tenant context is required",
    );
  });

  it("requires a reason for platform cross-tenant access", () => {
    expect(() =>
      requirePlatformAccess({
        ...tenantContext,
        tenantId: null,
        isPlatformAdmin: true,
        platformAccessReason: "Support incident INC-42",
      }),
    ).not.toThrow();
  });
});
