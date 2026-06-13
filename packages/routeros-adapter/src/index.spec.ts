import { describe, expect, it } from "vitest";
import {
  analyzeExistingConfiguration,
  buildManagementWireGuardPlan,
  generateBootstrapScript,
} from "./index.js";

describe("generateBootstrapScript", () => {
  it("creates an HTTPS registration script without logging the token", () => {
    const token = `aloy_bootstrap_${"a".repeat(43)}`;
    const script = generateBootstrapScript({ apiBaseUrl: "https://controller.example/", bootstrapToken: token });

    expect(script).toContain("https://controller.example/api/v1/device-onboarding/register");
    expect(script).toContain("check-certificate=yes");
    expect(script).toContain(":serialize to=json");
    expect(script).not.toContain(":put $aloyToken");
  });

  it("rejects an insecure controller URL", () => {
    expect(() =>
      generateBootstrapScript({
        apiBaseUrl: "http://controller.example",
        bootstrapToken: `aloy_bootstrap_${"b".repeat(43)}`,
      }),
    ).toThrow("HTTPS");
  });
});

describe("buildManagementWireGuardPlan", () => {
  it("creates a plan without private key material", () => {
    const plan = buildManagementWireGuardPlan({
      deviceAddress: "10.255.0.2/32",
      controllerPublicKey: `${"A".repeat(43)}=`,
      controllerEndpoint: "controller.example",
      allowedControllerCidrs: ["10.255.0.1/32"],
    });

    expect(plan.containsPrivateKey).toBe(false);
    expect(plan.commands.join("\n")).not.toContain("private-key");
    expect(plan.commands.join("\n")).toContain("aloy:managed:management-wireguard");
  });
});

describe("analyzeExistingConfiguration", () => {
  it("protects untagged objects and only includes Aloy-managed objects in scope", () => {
    const report = analyzeExistingConfiguration([
      { kind: "DEFAULT_ROUTE", identifier: "0.0.0.0/0" },
      { kind: "DNS", identifier: "corp-dns" },
      { kind: "VLAN", identifier: "vlan100", comment: "aloy:managed:vlan" },
    ]);

    expect(report.riskLevel).toBe("HIGH");
    expect(report.takeoverScope).toEqual([{ kind: "VLAN", identifier: "vlan100" }]);
    expect(report.summary.protectedItems).toBe(2);
  });
});
