import test from "node:test";
import assert from "node:assert/strict";
import { loadConfigFromObject } from "../../../src/config/config-loader.ts";
import { resolveEnvironment } from "../../../src/config/environment-resolver.ts";
import { runtimeConfigFixture } from "../../fixtures/runtime-config.ts";

test("resolveEnvironment returns explicit environment", () => {
  const config = loadConfigFromObject(runtimeConfigFixture);
  const environment = resolveEnvironment(config, "production");

  assert.equal(environment.name, "production");
  assert.equal(environment.apiKey, "production-key");
});

test("resolveEnvironment falls back to default environment", () => {
  const config = loadConfigFromObject(runtimeConfigFixture);
  const environment = resolveEnvironment(config);

  assert.equal(environment.name, "sandbox");
});

test("resolveEnvironment rejects unknown environment", () => {
  const config = loadConfigFromObject(runtimeConfigFixture);

  assert.throws(() => resolveEnvironment(config, "missing"), /Environment "missing" is not configured/);
});

