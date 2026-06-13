import { describe, expect, it } from "vitest";
import { HealthService } from "../src/health.service";

describe("HealthService", () => {
  it("reports an ok status", () => {
    expect(new HealthService().getHealth().status).toBe("ok");
  });
});

