import type { RequestContext } from "@aloy/shared";
import { prisma, requireTenantScope } from "@aloy/database";
import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { createHash, randomBytes } from "node:crypto";

type OnboardingMode = "CLEAN_BOOTSTRAP" | "ADOPT_EXISTING" | "MONITORING_ONLY" | "POP_NODE";

const stepsByMode: Record<OnboardingMode, Array<[string, string]>> = {
  CLEAN_BOOTSTRAP: [
    ["connect", "连接平台"],
    ["management-wireguard", "建立管理 WireGuard"],
    ["device-account", "创建设备专属账户"],
    ["observability", "配置 SNMP、Trap 与 Syslog"],
    ["identity", "上传设备身份"],
    ["discover", "发现接口与能力"],
    ["backup", "备份初始配置"],
    ["verify", "验证设备状态"],
  ],
  ADOPT_EXISTING: [
    ["read-config", "只读获取现有配置"],
    ["conflict-report", "生成冲突报告"],
    ["management-scope", "确定平台接管范围"],
    ["verify", "验证只读接管"],
  ],
  MONITORING_ONLY: [
    ["management-access", "配置只读管理访问"],
    ["observability", "配置 SNMP、Trap 与 Syslog"],
    ["time-sync", "配置时间同步"],
    ["verify", "验证监控数据"],
  ],
  POP_NODE: [
    ["management-network", "配置管理网络"],
    ["tenant-vrf", "配置租户 VRF"],
    ["routing", "配置 BGP、OSPF 与 BFD"],
    ["dns", "配置 DNS 节点"],
    ["capacity", "应用容量限制"],
    ["verify", "验证 POP 节点"],
  ],
};

@Injectable()
export class DeviceService {
  listSites(context: RequestContext) {
    const { tenantId } = requireTenantScope(context);
    return prisma.site.findMany({
      where: { tenantId, deletedAt: null },
      include: { _count: { select: { devices: true } } },
      orderBy: { name: "asc" },
    });
  }

  createSite(
    context: RequestContext,
    input: { name: string; code: string; description?: string; timezone?: string },
  ) {
    const { tenantId } = requireTenantScope(context);
    const name = input.name?.trim();
    const code = input.code?.trim().toLowerCase();
    if (!name || !/^[a-z0-9][a-z0-9-]{1,31}$/.test(code)) {
      throw new BadRequestException("A site name and valid code are required");
    }
    return prisma.$transaction(async (transaction) => {
      const site = await transaction.site.create({
        data: {
          tenantId,
          name,
          code,
          description: input.description?.trim(),
          timezone: input.timezone?.trim() || "UTC",
          createdBy: context.userId,
          updatedBy: context.userId,
        },
      });
      await this.audit(transaction, context, tenantId, "site.create", "Site", site.id);
      return site;
    });
  }

  listDevices(context: RequestContext) {
    const { tenantId } = requireTenantScope(context);
    return prisma.device.findMany({
      where: { tenantId, deletedAt: null },
      include: { site: { select: { id: true, name: true, code: true } } },
      orderBy: { createdAt: "desc" },
    });
  }

  createDevice(
    context: RequestContext,
    input: { siteId: string; name: string; serialNumber?: string; model?: string },
  ) {
    const { tenantId } = requireTenantScope(context);
    const name = input.name?.trim();
    if (!name || !input.siteId) {
      throw new BadRequestException("A device name and site are required");
    }
    return prisma.$transaction(async (transaction) => {
      const site = await transaction.site.findFirst({
        where: { id: input.siteId, tenantId, deletedAt: null },
      });
      if (!site) {
        throw new NotFoundException("Site not found");
      }
      const device = await transaction.device.create({
        data: {
          tenantId,
          siteId: site.id,
          name,
          serialNumber: input.serialNumber?.trim(),
          model: input.model?.trim(),
          createdBy: context.userId,
          updatedBy: context.userId,
        },
      });
      await this.audit(transaction, context, tenantId, "device.create", "Device", device.id);
      return device;
    });
  }

  issueBootstrapToken(
    context: RequestContext,
    deviceId: string,
    input: { mode: OnboardingMode; expiresInMinutes?: number },
  ) {
    const { tenantId } = requireTenantScope(context);
    const steps = stepsByMode[input.mode];
    const expiresInMinutes = input.expiresInMinutes ?? 30;
    if (!steps || !Number.isInteger(expiresInMinutes) || expiresInMinutes < 5 || expiresInMinutes > 1440) {
      throw new BadRequestException("Valid onboarding mode and expiry from 5 to 1440 minutes required");
    }
    const token = `aloy_bootstrap_${randomBytes(32).toString("base64url")}`;
    return prisma.$transaction(async (transaction) => {
      const device = await transaction.device.findFirst({
        where: { id: deviceId, tenantId, deletedAt: null },
      });
      if (!device) {
        throw new NotFoundException("Device not found");
      }
      const bootstrapToken = await transaction.bootstrapToken.create({
        data: {
          tenantId,
          deviceId,
          mode: input.mode,
          tokenHash: createHash("sha256").update(token).digest("hex"),
          expiresAt: new Date(Date.now() + expiresInMinutes * 60_000),
          createdBy: context.userId,
        },
      });
      const session = await transaction.onboardingSession.create({
        data: {
          tenantId,
          deviceId,
          mode: input.mode,
          currentStep: steps[0]![0],
          createdBy: context.userId,
          steps: {
            create: steps.map(([key, label], position) => ({ key, label, position })),
          },
        },
        include: { steps: { orderBy: { position: "asc" } } },
      });
      await transaction.device.update({
        where: { id: deviceId },
        data: { onboardingMode: input.mode, status: "ONBOARDING", updatedBy: context.userId },
      });
      await this.audit(transaction, context, tenantId, "bootstrap-token.create", "Device", deviceId);
      return { token, bootstrapToken: { id: bootstrapToken.id, expiresAt: bootstrapToken.expiresAt }, session };
    });
  }

  listOnboardingSessions(context: RequestContext) {
    const { tenantId } = requireTenantScope(context);
    return prisma.onboardingSession.findMany({
      where: { tenantId },
      include: {
        device: { select: { id: true, name: true, site: { select: { name: true } } } },
        steps: { orderBy: { position: "asc" } },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  private audit(
    transaction: Parameters<Parameters<typeof prisma.$transaction>[0]>[0],
    context: RequestContext,
    tenantId: string,
    action: string,
    resourceType: string,
    resourceId: string,
  ) {
    return transaction.auditEvent.create({
      data: { tenantId, actorUserId: context.userId, action, resourceType, resourceId, requestId: context.requestId },
    });
  }
}
