import test from "node:test";
import assert from "node:assert/strict";
import { createServerRuntime } from "../../../src/server/index.ts";
import { runtimeConfigFixture } from "../../fixtures/runtime-config.ts";

test("createServerRuntime exposes diagnostics for tools and environments", () => {
  const runtime = createServerRuntime(runtimeConfigFixture);

  assert.ok(runtime.diagnostics.toolNames.includes("payment.create"));
  assert.ok(runtime.diagnostics.toolNames.includes("payout.create"));
  assert.ok(runtime.diagnostics.environmentNames.includes("sandbox"));
  assert.ok(runtime.diagnostics.environmentNames.includes("production"));
});

