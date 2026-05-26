import test from "node:test";
import assert from "node:assert/strict";
import { loadConfigFromObject } from "../../../src/config/config-loader.ts";
import { registerTools } from "../../../src/server/register-tools.ts";
import { runtimeConfigFixture } from "../../fixtures/runtime-config.ts";

test("registerTools exposes payment tool names", () => {
  const config = loadConfigFromObject(runtimeConfigFixture);
  const names = registerTools(config).map((tool) => tool.name);

  assert.ok(names.includes("payment.create"));
  assert.ok(names.includes("payment.get"));
  assert.ok(names.includes("payment.cancel"));
});

