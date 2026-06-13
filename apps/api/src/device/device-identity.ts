import { createHash } from "node:crypto";

export type DevicePlatformType = "ROUTERBOARD" | "CHR" | "X86" | "CLOUD_INSTANCE" | "UNKNOWN";

export interface FingerprintInput {
  platformType: DevicePlatformType;
  serialNumber?: string;
  softwareId?: string;
  systemId?: string;
}

export function deriveDeviceFingerprint(input: FingerprintInput) {
  const source = input.platformType === "CHR"
    ? input.systemId?.trim() || input.softwareId?.trim()
    : input.serialNumber?.trim() || input.softwareId?.trim() || input.systemId?.trim();
  if (!source) {
    return null;
  }
  return createHash("sha256").update(`${input.platformType}:${source}`).digest("hex");
}

export function inferCertificationStatus(
  platformType: DevicePlatformType,
  fingerprint: string | null,
  capabilityCount: number,
) {
  if (!fingerprint || platformType === "UNKNOWN") {
    return "PARTIALLY_CERTIFIED" as const;
  }
  return capabilityCount ? "CAPABILITY_PROBED" as const : "IDENTIFIED" as const;
}
