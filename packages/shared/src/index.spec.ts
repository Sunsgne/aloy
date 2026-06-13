import { describe, expect, it } from "vitest";
import { createHealthState } from "./index.js";

describe("createHealthState", () => {
  it("includes the service name", () => {
    expect(createHealthState("worker")).toMatchObject({ service: "worker", status: "ok" });
  });
});
