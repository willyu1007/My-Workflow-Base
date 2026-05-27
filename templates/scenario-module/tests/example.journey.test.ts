import { describe, expect, it } from "vitest";
import { scenarioModule } from "../src/module.js";

describe("example scenario journey", () => {
  it("declares a scenario module with a registered handler", () => {
    const step = scenarioModule.manifest.capabilities[0]?.entrypoints[0]?.steps[0];

    expect(step).toBeDefined();
    expect(scenarioModule.handlers[step?.handler_key ?? ""]).toBeDefined();
  });
});
