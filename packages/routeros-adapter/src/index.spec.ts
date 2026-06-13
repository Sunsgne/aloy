import { describe, expect, it } from "vitest";
import { generateBootstrapScript } from "./index.js";

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
