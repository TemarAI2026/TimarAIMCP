/**
 * X402 pricing types — legacy from fixed-price mode.
 *
 * ⚠️ NOTE: The current architecture uses DYNAMIC pricing for transfer operations.
 *   - payment.create / payout.create: The 402 amount comes from Temar API response
 *     (actual transfer amount), NOT from this pricing table.
 *   - Read-only endpoints: No X402 payment at all (MCP API Key auth).
 *
 * This file is kept only for the ToolPricingMap type definition,
 * which may be used for future custom pricing features.
 * The DEFAULT_TOOL_PRICING and resolvePricing() are DEPRECATED.
 */

export interface EndpointPricing {
  /** USD price per call (e.g. "0.01" = $0.01 USDC) */
  price: string;
  /** Human-readable description shown in the 402 response */
  description: string;
  /** Supported payment networks */
  networks: string[];
}

export type ToolPricingMap = Record<string, EndpointPricing>;

/**
 * @deprecated Dynamic pricing is now used for transfer operations.
 * This constant is kept for reference only.
 */
export const DEFAULT_TOOL_PRICING: ToolPricingMap = {
  "payment.create": {
    price: "dynamic",
    description: "Create a crypto payment order (X402 amount = actual transfer amount)",
    networks: ["base", "ethereum", "solana"],
  },
  "payment.get": {
    price: "0",
    description: "Query payment order status (no payment required)",
    networks: ["base", "ethereum", "solana"],
  },
  "payment.cancel": {
    price: "0",
    description: "Cancel a pending payment order (no payment required)",
    networks: ["base", "ethereum", "solana"],
  },
  "payout.create": {
    price: "dynamic",
    description: "Create a crypto payout order (X402 amount = actual payout amount)",
    networks: ["base", "ethereum", "solana"],
  },
  "payout.get": {
    price: "0",
    description: "Query payout order status (no payment required)",
    networks: ["base", "ethereum", "solana"],
  },
  "balance.list": {
    price: "0",
    description: "List merchant balance (no payment required)",
    networks: ["base", "ethereum", "solana"],
  },
};

/**
 * @deprecated Dynamic pricing is now used for transfer operations.
 * This function is kept for reference only.
 */
export function resolvePricing(
  toolName: string,
  customPricing?: ToolPricingMap
): EndpointPricing {
  const pricing = customPricing ?? DEFAULT_TOOL_PRICING;
  return (
    pricing[toolName] ?? {
      price: "dynamic",
      description: `Use ${toolName}`,
      networks: ["base", "ethereum", "solana"],
    }
  );
}
