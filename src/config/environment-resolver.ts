import { McpRuntimeError } from "../errors/error-types.ts";
import type { RuntimeConfig, RuntimeEnvironmentConfig } from "../models/public-api-types.ts";

export function resolveEnvironment(
  config: RuntimeConfig,
  requestedEnvironment?: string
): RuntimeEnvironmentConfig {
  const environmentName = requestedEnvironment ?? config.defaultEnvironment;
  const environment = config.environments[environmentName];

  if (!environment) {
    throw new McpRuntimeError(
      "config_error",
      `Environment "${environmentName}" is not configured.`
    );
  }

  return environment;
}

