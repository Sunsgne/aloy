import type { RequestContext } from "@aloy/shared";
import { prisma, requireTenantScope } from "@aloy/database";
import {
  analyzeExistingConfiguration,
  buildManagementWireGuardPlan,
  generateBootstrapScript,
  type ExistingConfigItem,
  type ManagementWireGuardPlanInput,
} from "@aloy/routeros-adapter";
import { BadRequestException, Injectable, NotFoundException, UnauthorizedException } from "@nestjs/common";
import { createHash, randomBytes, randomUUID } from "node:crypto";

type OnboardingMode = "CLEAN_BOOTSTRAP" | "ADOPT_EXISTING" | "MONITORING_ONLY" | "POP_NODE";
type StepStatus = "RUNNING" | "SUCCEEDED" | "FAILED";

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

  async getBootstrapScript(
    context: RequestContext,
    deviceId: string,
    input: { mode: OnboardingMode; apiBaseUrl: string; expiresInMinutes?: number },
  ) {
    let apiBaseUrl: URL;
    try {
      apiBaseUrl = new URL(input.apiBaseUrl);
    } catch {
      throw new BadRequestException("An HTTPS API base URL is required");
    }
    if (apiBaseUrl.protocol !== "https:") {
      throw new BadRequestException("An HTTPS API base URL is required");
    }
    const issued = await this.issueBootstrapToken(context, deviceId, input);
    try {
      return {
        script: generateBootstrapScript({
          apiBaseUrl: input.apiBaseUrl,
          bootstrapToken: issued.token,
        }),
        expiresAt: issued.bootstrapToken.expiresAt,
        session: issued.session,
      };
    } catch (error) {
      throw new BadRequestException(error instanceof Error ? error.message : "Unable to generate script");
    }
  }

  registerDevice(
    authorization: string | undefined,
    input: {
      identity?: string;
      serialNumber?: string;
      model?: string;
      architectureName?: string;
      routerOsVersion?: string;
    },
  ) {
    const bootstrapSecret = this.extractBearer(authorization, "Bootstrap token");
    const tokenHash = this.hashSecret(bootstrapSecret);
    return prisma.$transaction(async (transaction) => {
      const bootstrapToken = await transaction.bootstrapToken.findUnique({
        where: { tokenHash },
        include: { device: true },
      });
      if (
        !bootstrapToken ||
        bootstrapToken.consumedAt ||
        bootstrapToken.revokedAt ||
        bootstrapToken.expiresAt <= new Date()
      ) {
        throw new UnauthorizedException("Invalid or expired bootstrap token");
      }
      const expectedSerial = bootstrapToken.device.serialNumber?.trim();
      if (expectedSerial && expectedSerial !== input.serialNumber?.trim()) {
        throw new UnauthorizedException("Device serial number does not match bootstrap token");
      }
      const consumed = await transaction.bootstrapToken.updateMany({
        where: {
          id: bootstrapToken.id,
          consumedAt: null,
          revokedAt: null,
          expiresAt: { gt: new Date() },
        },
        data: { consumedAt: new Date() },
      });
      if (consumed.count !== 1) {
        throw new UnauthorizedException("Bootstrap token has already been used");
      }

      const deviceSecret = `aloy_device_${randomBytes(32).toString("base64url")}`;
      await transaction.deviceCredential.updateMany({
        where: { deviceId: bootstrapToken.deviceId, revokedAt: null },
        data: { revokedAt: new Date(), updatedBy: "device-onboarding" },
      });
      await transaction.deviceCredential.create({
        data: {
          tenantId: bootstrapToken.tenantId,
          deviceId: bootstrapToken.deviceId,
          label: "primary-heartbeat",
          secretHash: this.hashSecret(deviceSecret),
          createdBy: "device-onboarding",
          updatedBy: "device-onboarding",
        },
      });
      await transaction.deviceIdentity.upsert({
        where: { deviceId: bootstrapToken.deviceId },
        update: {
          identity: input.identity?.trim(),
          serialNumber: input.serialNumber?.trim(),
          model: input.model?.trim(),
          architectureName: input.architectureName?.trim(),
          routerOsVersion: input.routerOsVersion?.trim(),
          lastReportedAt: new Date(),
          updatedBy: "device-onboarding",
        },
        create: {
          tenantId: bootstrapToken.tenantId,
          deviceId: bootstrapToken.deviceId,
          identity: input.identity?.trim(),
          serialNumber: input.serialNumber?.trim(),
          model: input.model?.trim(),
          architectureName: input.architectureName?.trim(),
          routerOsVersion: input.routerOsVersion?.trim(),
          createdBy: "device-onboarding",
          updatedBy: "device-onboarding",
        },
      });
      await transaction.device.update({
        where: { id: bootstrapToken.deviceId },
        data: {
          serialNumber: input.serialNumber?.trim() || bootstrapToken.device.serialNumber,
          model: input.model?.trim() || bootstrapToken.device.model,
          routerOsVersion: input.routerOsVersion?.trim(),
          status: "ONBOARDING",
          lastSeenAt: new Date(),
          updatedBy: "device-onboarding",
        },
      });
      const session = await transaction.onboardingSession.findFirst({
        where: { deviceId: bootstrapToken.deviceId, mode: bootstrapToken.mode, status: "PENDING" },
        include: { steps: { orderBy: { position: "asc" } } },
        orderBy: { createdAt: "desc" },
      });
      if (session) {
        await this.updateStep(transaction, session.id, session.steps, "connect", "SUCCEEDED");
      }
      await transaction.auditEvent.create({
        data: {
          tenantId: bootstrapToken.tenantId,
          actorUserId: `device:${bootstrapToken.deviceId}`,
          action: "device.register",
          resourceType: "Device",
          resourceId: bootstrapToken.deviceId,
          requestId: randomUUID(),
        },
      });
      return {
        deviceId: bootstrapToken.deviceId,
        deviceToken: deviceSecret,
        heartbeatIntervalSeconds: 60,
        serverTime: new Date().toISOString(),
      };
    });
  }

  heartbeatDevice(
    authorization: string | undefined,
    input: {
      sequence: number;
      timestamp: string;
      routerOsVersion?: string;
      managementAddress?: string;
      sessionId?: string;
      stepKey?: string;
      stepStatus?: StepStatus;
    },
  ) {
    const deviceSecret = this.extractBearer(authorization, "Device token");
    const timestamp = new Date(input.timestamp);
    if (
      !Number.isInteger(input.sequence) ||
      input.sequence < 1 ||
      Number.isNaN(timestamp.valueOf()) ||
      Math.abs(Date.now() - timestamp.valueOf()) > 5 * 60_000
    ) {
      throw new UnauthorizedException("Invalid or stale heartbeat");
    }
    return prisma.$transaction(async (transaction) => {
      const credential = await transaction.deviceCredential.findUnique({
        where: { secretHash: this.hashSecret(deviceSecret) },
      });
      if (
        !credential ||
        credential.revokedAt ||
        (credential.expiresAt && credential.expiresAt <= new Date())
      ) {
        throw new UnauthorizedException("Invalid device token");
      }
      const advanced = await transaction.deviceCredential.updateMany({
        where: { id: credential.id, lastSequence: { lt: input.sequence }, revokedAt: null },
        data: { lastSequence: input.sequence, lastUsedAt: new Date(), updatedBy: "device-heartbeat" },
      });
      if (advanced.count !== 1) {
        throw new UnauthorizedException("Heartbeat sequence was already accepted");
      }
      await transaction.device.update({
        where: { id: credential.deviceId },
        data: {
          lastSeenAt: new Date(),
          managementAddress: input.managementAddress?.trim(),
          routerOsVersion: input.routerOsVersion?.trim(),
          status: input.stepStatus === "FAILED" ? "ERROR" : "ONLINE",
          updatedBy: "device-heartbeat",
        },
      });
      if (input.routerOsVersion) {
        await transaction.deviceIdentity.updateMany({
          where: { deviceId: credential.deviceId },
          data: {
            routerOsVersion: input.routerOsVersion.trim(),
            lastReportedAt: new Date(),
            updatedBy: "device-heartbeat",
          },
        });
      }
      if (input.sessionId && input.stepKey && input.stepStatus) {
        const session = await transaction.onboardingSession.findFirst({
          where: { id: input.sessionId, deviceId: credential.deviceId, tenantId: credential.tenantId },
          include: { steps: { orderBy: { position: "asc" } } },
        });
        if (!session) {
          throw new NotFoundException("Onboarding session not found");
        }
        await this.updateStep(transaction, session.id, session.steps, input.stepKey, input.stepStatus);
      }
      return {
        acceptedSequence: input.sequence,
        nextHeartbeatIntervalSeconds: 60,
        serverTime: new Date().toISOString(),
      };
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

  async getOnboardingSession(context: RequestContext, id: string) {
    const { tenantId } = requireTenantScope(context);
    const session = await prisma.onboardingSession.findFirst({
      where: { id, tenantId },
      include: {
        device: { include: { site: true, identity: true } },
        steps: { orderBy: { position: "asc" } },
      },
    });
    if (!session) {
      throw new NotFoundException("Onboarding session not found");
    }
    return session;
  }

  async createManagementWireGuardPlan(
    context: RequestContext,
    sessionId: string,
    input: ManagementWireGuardPlanInput,
  ) {
    const { tenantId } = requireTenantScope(context);
    const session = await prisma.onboardingSession.findFirst({ where: { id: sessionId, tenantId } });
    if (!session) {
      throw new NotFoundException("Onboarding session not found");
    }
    let plan: ReturnType<typeof buildManagementWireGuardPlan>;
    try {
      plan = buildManagementWireGuardPlan(input);
    } catch (error) {
      throw new BadRequestException(error instanceof Error ? error.message : "Invalid WireGuard plan");
    }
    return prisma.$transaction(async (transaction) => {
      const updated = await transaction.onboardingSession.update({
        where: { id: sessionId },
        data: { managementPlan: plan },
        include: { steps: { orderBy: { position: "asc" } } },
      });
      await this.audit(transaction, context, tenantId, "onboarding.management-wireguard.plan", "OnboardingSession", sessionId);
      return updated;
    });
  }

  async previewAdoption(context: RequestContext, sessionId: string, items: ExistingConfigItem[]) {
    const { tenantId } = requireTenantScope(context);
    const session = await prisma.onboardingSession.findFirst({ where: { id: sessionId, tenantId } });
    if (!session) {
      throw new NotFoundException("Onboarding session not found");
    }
    if (session.mode !== "ADOPT_EXISTING") {
      throw new BadRequestException("Adoption preview requires an ADOPT_EXISTING session");
    }
    if (!Array.isArray(items) || items.length > 10_000) {
      throw new BadRequestException("A structured configuration snapshot with at most 10000 items is required");
    }
    const report = analyzeExistingConfiguration(items);
    return prisma.$transaction(async (transaction) => {
      const updated = await transaction.onboardingSession.update({
        where: { id: sessionId },
        data: { adoptionReport: report },
        include: { steps: { orderBy: { position: "asc" } } },
      });
      await this.audit(transaction, context, tenantId, "onboarding.adoption.preview", "OnboardingSession", sessionId);
      return updated;
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

  private async updateStep(
    transaction: Parameters<Parameters<typeof prisma.$transaction>[0]>[0],
    sessionId: string,
    steps: Array<{ id: string; key: string; position: number; status: string }>,
    stepKey: string,
    status: StepStatus,
  ) {
    const step = steps.find((candidate) => candidate.key === stepKey);
    if (!step) {
      throw new NotFoundException("Onboarding step not found");
    }
    const now = new Date();
    await transaction.onboardingStep.update({
      where: { id: step.id },
      data: {
        status,
        startedAt: step.status === "PENDING" ? now : undefined,
        endedAt: status === "RUNNING" ? undefined : now,
      },
    });
    const completed = steps.filter(
      (candidate) => candidate.status === "SUCCEEDED" || candidate.id === step.id && status === "SUCCEEDED",
    ).length;
    const next = status === "SUCCEEDED"
      ? steps.find((candidate) => candidate.position > step.position && candidate.status === "PENDING")
      : undefined;
    if (next) {
      await transaction.onboardingStep.update({
        where: { id: next.id },
        data: { status: "RUNNING", startedAt: now },
      });
    }
    const sessionStatus = status === "FAILED" ? "FAILED" : completed === steps.length ? "SUCCEEDED" : "RUNNING";
    await transaction.onboardingSession.update({
      where: { id: sessionId },
      data: {
        status: sessionStatus,
        currentStep: next?.key ?? step.key,
        progress: Math.round(completed / steps.length * 100),
        startedAt: now,
        completedAt: sessionStatus === "SUCCEEDED" || sessionStatus === "FAILED" ? now : undefined,
      },
    });
  }

  private extractBearer(authorization: string | undefined, label: string) {
    const [scheme, secret] = authorization?.split(" ") ?? [];
    if (scheme !== "Bearer" || !secret) {
      throw new UnauthorizedException(`${label} is required`);
    }
    return secret;
  }

  private hashSecret(secret: string) {
    return createHash("sha256").update(secret).digest("hex");
  }
}
