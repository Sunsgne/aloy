import { describe, expect, it } from "vitest";
import { deriveDeviceFingerprint, inferCertificationStatus } from "./device-identity";

describe("deriveDeviceFingerprint", () => {
  it("prefers RouterBOARD serial numbers and ignores IP or identity names", () => {
    expect(deriveDeviceFingerprint({
      platformType: "ROUTERBOARD",
      serialNumber: "ABC123",
      softwareId: "SOFT",
    })).toBe(deriveDeviceFingerprint({ platformType: "ROUTERBOARD", serialNumber: "ABC123" }));
  });

  it("prefers CHR system IDs", () => {
    expect(deriveDeviceFingerprint({
      platformType: "CHR",
      systemId: "CHR-SYSTEM",
      softwareId: "SOFT",
    })).toBe(deriveDeviceFingerprint({ platformType: "CHR", systemId: "CHR-SYSTEM" }));
  });
});

describe("inferCertificationStatus", () => {
  it("keeps unknown devices partially certified", () => {
    expect(inferCertificationStatus("UNKNOWN", "fingerprint", 10)).toBe("PARTIALLY_CERTIFIED");
  });
});
