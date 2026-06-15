import { readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { loadConfigFromObject } from "./config-loader.ts";
import type { RuntimeConfig } from "../models/public-api-types.ts";

const ENV_PREFIX = "TIMAR_MCP_";

/**
 * Load runtime configuration.
 *
 * Priority:
 * 1. If TIMAR_MCP_CONFIG is set, load from the specified JSON file
 * 2. Otherwise, look for config/runtime.config.json in the project directory
 *
 * @returns Validated RuntimeConfig
 * @throws Error with user-friendly message if configuration is invalid
 */
export function loadRuntimeSource(): RuntimeConfig {
  const configFilePath = process.env[`${ENV_PREFIX}CONFIG`];

  if (configFilePath) {
    return loadFromFile(configFilePath);
  }

  // Try default config path
  const defaultPath = join(resolve(import.meta.dirname), "..", "..", "config", "runtime.config.json");

  return loadFromFile(defaultPath);
}

/**
 * Load the language preference from config file (without full validation).
 * Returns the language code or falls back to "en".
 */
export function loadLanguagePreference(): string {
  try {
    const configFilePath = process.env[`${ENV_PREFIX}CONFIG`];
    const filePath = configFilePath
      || join(resolve(import.meta.dirname), "..", "..", "config", "runtime.config.json");

    const rawContent = readFileSync(filePath, "utf-8");
    const rawConfig = JSON.parse(rawContent);

    return rawConfig.language || "en";
  } catch {
    return "en";
  }
}

/**
 * Load configuration from a JSON file
 */
function loadFromFile(filePath: string): RuntimeConfig {
  let rawContent: string;

  try {
    rawContent = readFileSync(filePath, "utf-8");
  } catch (error) {
    throw new Error(
      `No configuration found.\n` +
      `Please run the setup wizard first:\n` +
      `  node scripts/setup.mjs`
    );
  }

  let rawConfig: unknown;

  try {
    rawConfig = JSON.parse(rawContent);
  } catch (error) {
    throw new Error(
      `Invalid JSON in config file "${filePath}".\n` +
      `Please check the file syntax.\n` +
      `Error: ${error instanceof Error ? error.message : String(error)}`
    );
  }

  try {
    return loadConfigFromObject(rawConfig);
  } catch (error) {
    throw new Error(
      `Invalid configuration in "${filePath}".\n` +
      `${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Validate that the runtime config has all required fields for the default environment
 */
export function validateRuntimeStartup(config: RuntimeConfig): void {
  const defaultEnv = config.defaultEnvironment;

  if (!config.environments[defaultEnv]) {
    throw new Error(
      `Default environment "${defaultEnv}" is not configured.\n` +
      `Configured environments: ${Object.keys(config.environments).join(", ")}\n` +
      `Please re-run: node scripts/setup.mjs`
    );
  }

  const envConfig = config.environments[defaultEnv];

  const missingFields: string[] = [];

  if (!envConfig.baseUrl) {
    missingFields.push("baseUrl");
  }
  if (!envConfig.apiKey) {
    missingFields.push("apiKey");
  }
  if (!envConfig.secretKey) {
    missingFields.push("secretKey");
  }

  if (missingFields.length > 0) {
    throw new Error(
      `Missing required fields for environment "${defaultEnv}": ${missingFields.join(", ")}\n` +
      `Please re-run: node scripts/setup.mjs`
    );
  }
}
