/**
 * X402 pricing configuration for each MCP tool endpoint.
 *
 * Prices are in USD (stablecoin equivalent). The x402 middleware uses
 * these values to set the `maxAmountRequired` field in PAYMENT-REQUIRED
 * responses.
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

export const DEFAULT_TOOL_PRICING: ToolPricingMap = {
  "payment.create": {
    price: "0.01",
    description: "Create a crypto payment order",
    networks: ["base", "ethereum", "solana"],
  },
  "payment.get": {
    price: "0.001",
    description: "Query payment order status",
    networks: ["base", "ethereum", "solana"],
  },
  "payment.cancel": {
    price: "0.001",
    description: "Cancel a pending payment order",
    networks: ["base", "ethereum", "solana"],
  },
  "payout.create": {
    price: "0.01",
    description: "Create a crypto payout (withdrawal) order",
    networks: ["base", "ethereum", "solana"],
  },
  "payout.get": {
    price: "0.001",
    description: "Query payout order status",
    networks: ["base", "ethereum", "solana"],
  },
  "balance.list": {
    price: "0.001",
    description: "List merchant balance across currencies",
    networks: ["base", "ethereum", "solana"],
  },
};

/**
 * Resolve pricing for a tool name. Returns the configured price or
 * a default if the tool is not listed.
 */
export function resolvePricing(
  toolName: string,
  customPricing?: ToolPricingMap
): EndpointPricing {
  const pricing = customPricing ?? DEFAULT_TOOL_PRICING;
  return (
    pricing[toolName] ?? {
      price: "0.01",
      description: `Use ${toolName}`,
      networks: ["base", "ethereum", "solana"],
    }
  );
}
