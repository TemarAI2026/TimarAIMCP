import { McpRuntimeError } from "../errors/error-types.ts";
import type { RuntimeConfig, RuntimeEnvironmentConfig } from "../models/public-api-types.ts";

function assertRecord(value: unknown, fieldName: string): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new McpRuntimeError("config_error", `${fieldName} must be an object.`);
  }

  return value as Record<string, unknown>;
}

function assertNonEmptyString(value: unknown, fieldName: string): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new McpRuntimeError("config_error", `${fieldName} must be a non-empty string.`);
  }

  return value;
}

function assertPositiveInteger(value: unknown, fieldName: string): number {
  if (typeof value !== "number" || !Number.isInteger(value) || value <= 0) {
    throw new McpRuntimeError("config_error", `${fieldName} must be a positive integer.`);
  }

  return value;
}

function parseEnvironmentConfig(name: string, value: unknown): RuntimeEnvironmentConfig {
  const record = assertRecord(value, `environments.${name}`);

  return {
    name,
    baseUrl: assertNonEmptyString(record.baseUrl, `environments.${name}.baseUrl`),
    apiKey: assertNonEmptyString(record.apiKey, `environments.${name}.apiKey`),
    secretKey: assertNonEmptyString(record.secretKey, `environments.${name}.secretKey`),
    timeoutMs: assertPositiveInteger(record.timeoutMs, `environments.${name}.timeoutMs`)
  };
}

export function validateRuntimeConfig(rawConfig: unknown): RuntimeConfig {
  const record = assertRecord(rawConfig, "config");
  const defaultEnvironment = assertNonEmptyString(record.defaultEnvironment, "defaultEnvironment");
  const environmentsRecord = assertRecord(record.environments, "environments");
  const environments: Record<string, RuntimeEnvironmentConfig> = {};

  for (const [name, value] of Object.entries(environmentsRecord)) {
    environments[name] = parseEnvironmentConfig(name, value);
  }

  if (!environments[defaultEnvironment]) {
    throw new McpRuntimeError(
      "config_error",
      `defaultEnvironment "${defaultEnvironment}" is not defined in environments.`
    );
  }

  return {
    defaultEnvironment,
    environments
  };
}

