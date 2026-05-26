import { validateRuntimeConfig } from "./config-schema.ts";
import type { RuntimeConfig } from "../models/public-api-types.ts";

export function loadConfigFromObject(rawConfig: unknown): RuntimeConfig {
  return validateRuntimeConfig(rawConfig);
}

