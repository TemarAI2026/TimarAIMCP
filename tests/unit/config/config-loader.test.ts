import test from "node:test";
import assert from "node:assert/strict";
import { loadConfigFromObject } from "../../../src/config/config-loader.ts";
import { runtimeConfigFixture } from "../../fixtures/runtime-config.ts";

test("loadConfigFromObject loads valid environment-first config", () => {
  const config = loadConfigFromObject(runtimeConfigFixture);

  assert.equal(config.defaultEnvironment, "sandbox");
  assert.equal(config.environments.sandbox.baseUrl, "https://sandbox.example.com");
  assert.equal(config.environments.production.apiKey, "production-key");
});

test("loadConfigFromObject rejects missing defaultEnvironment", () => {
  assert.throws(
    () =>
      loadConfigFromObject({
        environments: runtimeConfigFixture.environments
      }),
    /defaultEnvironment must be a non-empty string/
  );
});

test("loadConfigFromObject rejects undefined default environment target", () => {
  assert.throws(
    () =>
      loadConfigFromObject({
        ...runtimeConfigFixture,
        defaultEnvironment: "staging"
      }),
    /defaultEnvironment "staging" is not defined/
  );
});

