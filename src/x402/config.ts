/**
 * X402 adapter configuration schema.
 *
 * Extends the base MCP runtime config with x402-specific fields:
 * - wallet address for receiving payments
 * - facilitator URL for payment verification and settlement
 * - optional custom pricing overrides
 */

import { McpRuntimeError } from "../errors/error-types.ts";
import type { RuntimeConfig } from "../models/public-api-types.ts";
import type { ToolPricingMap } from "./pricing.ts";

export interface X402Config {
  /** The base MCP runtime config (environments, credentials) */
  runtime: RuntimeConfig;

  /** Language preference (zh-CN, zh-TW, en) */
  language: string;

  /** HTTP server port */
  port: number;

  /** Wallet address that receives x402 payments */
  payTo: string;

  /** Facilitator base URL (e.g. "https://facilitator.x402.org") */
  facilitatorUrl: string;

  /** Optional pricing overrides per tool */
  customPricing?: ToolPricingMap;

  /** Supported payment networks (default: ["base", "ethereum", "solana"]) */
  networks: string[];
}

export const DEFAULT_X402_PORT = 3402;
export const DEFAULT_FACILITATOR_URL = "https://facilitator.x402.org";
export const DEFAULT_NETWORKS = ["base", "ethereum", "solana"];

export function validateX402Config(
  runtime: RuntimeConfig,
  language: string,
  rawX402: unknown
): X402Config {
  if (!rawX402 || typeof rawX402 !== "object" || Array.isArray(rawX402)) {
    throw new McpRuntimeError(
      "config_error",
      "x402 configuration must be an object."
    );
  }

  const x402 = rawX402 as Record<string, unknown>;

  const payTo = assertNonEmptyString(x402.payTo, "x402.payTo");
  const facilitatorUrl =
    typeof x402.facilitatorUrl === "string" && x402.facilitatorUrl.trim()
      ? x402.facilitatorUrl
      : DEFAULT_FACILITATOR_URL;
  const port =
    typeof x402.port === "number" && Number.isInteger(x402.port) && x402.port > 0
      ? x402.port
      : DEFAULT_X402_PORT;
  const networks = Array.isArray(x402.networks) && x402.networks.length > 0
    ? x402.networks.map((n: unknown) => String(n))
    : DEFAULT_NETWORKS;

  return {
    runtime,
    language,
    port,
    payTo,
    facilitatorUrl,
    networks,
    customPricing: typeof x402.customPricing === "object" && x402.customPricing !== null
      ? (x402.customPricing as ToolPricingMap)
      : undefined,
  };
}

function assertNonEmptyString(value: unknown, fieldName: string): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new McpRuntimeError(
      "config_error",
      `${fieldName} must be a non-empty string.`
    );
  }
  return value;
}
