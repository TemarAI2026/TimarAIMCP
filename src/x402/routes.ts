/**
 * X402 → MCP route definitions.
 *
 * Maps HTTP endpoints to MCP tool invocations. The x402 payment middleware
 * wraps each route, so callers must pay before the MCP tool executes.
 */

import type { RuntimeConfig } from "../models/public-api-types.ts";
import type { X402Config } from "./config.ts";
import { resolvePricing, type ToolPricingMap } from "./pricing.ts";
import { PaymentApiClient } from "../clients/payment-api-client.ts";
import { PayoutApiClient } from "../clients/payout-api-client.ts";
import { BalanceApiClient } from "../clients/balance-api-client.ts";
import { PaymentRouter } from "../routers/payment-router.ts";
import { PayoutRouter } from "../routers/payout-router.ts";
import { BalanceRouter } from "../routers/balance-router.ts";
import { resolveEnvironment } from "../config/environment-resolver.ts";

export interface X402RouteContext {
  config: X402Config;
  paymentRouter: PaymentRouter;
  payoutRouter: PayoutRouter;
  balanceRouter: BalanceRouter;
}

export function createRouteContext(config: X402Config): X402RouteContext {
  const paymentApiClient = new PaymentApiClient();
  const payoutApiClient = new PayoutApiClient();
  const balanceApiClient = new BalanceApiClient();

  return {
    config,
    paymentRouter: new PaymentRouter(config.runtime, paymentApiClient),
    payoutRouter: new PayoutRouter(config.runtime, payoutApiClient),
    balanceRouter: new BalanceRouter(config.runtime, balanceApiClient),
  };
}

/**
 * Build the x402 payment middleware route map.
 *
 * Returns an object compatible with @x402/express `paymentMiddleware()`:
 *   { "POST /v1/payment/create": { accepts: [...], description: "..." }, ... }
 */
export function buildX402RouteMap(pricing?: ToolPricingMap) {
  const tools = [
    { method: "POST", path: "/v1/payment/create", tool: "payment.create" },
    { method: "GET", path: "/v1/payment/:orderId", tool: "payment.get" },
    { method: "DELETE", path: "/v1/payment/:orderId", tool: "payment.cancel" },
    { method: "POST", path: "/v1/payout/create", tool: "payout.create" },
    { method: "GET", path: "/v1/payout/:orderId", tool: "payout.get" },
    { method: "GET", path: "/v1/balance", tool: "balance.list" },
  ] as const;

  const routeMap: Record<string, { accepts: Array<{ network: string; scheme: string; maxAmountRequired: string; asset: string; }>; description: string; }> = {};

  for (const t of tools) {
    const p = resolvePricing(t.tool, pricing);
    const key = `${t.method} ${t.path}`;

    routeMap[key] = {
      accepts: p.networks.map((network) => ({
        network,
        scheme: "exact",
        maxAmountRequired: p.price,
        asset: network === "solana" ? "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v" : "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
      })),
      description: p.description,
    };
  }

  return routeMap;
}

/**
 * Dispatch a verified x402 request to the correct MCP router.
 */
export async function dispatchToMcp(
  ctx: X402RouteContext,
  method: string,
  path: string,
  body: Record<string, unknown>
): Promise<unknown> {
  const { config, paymentRouter, payoutRouter, balanceRouter } = ctx;
  const env = body.environment as string | undefined;

  // POST /v1/payment/create
  if (method === "POST" && path === "/v1/payment/create") {
    return paymentRouter.create({
      merchantOrderId: body.merchantOrderId as string,
      merchantUserId: body.merchantUserId as string,
      amount: body.amount as number,
      currency: body.currency as string,
      network: body.network as string,
      returnUrl: body.returnUrl as string | undefined,
      cancelUrl: body.cancelUrl as string | undefined,
      environment: env,
    });
  }

  // GET /v1/payment/:orderId
  const paymentGetMatch = path.match(/^\/v1\/payment\/([^/]+)$/);
  if (method === "GET" && paymentGetMatch) {
    return paymentRouter.get({
      orderId: paymentGetMatch[1],
      environment: env,
    });
  }

  // DELETE /v1/payment/:orderId
  const paymentDeleteMatch = path.match(/^\/v1\/payment\/([^/]+)$/);
  if (method === "DELETE" && paymentDeleteMatch) {
    return paymentRouter.cancel({
      orderId: paymentDeleteMatch[1],
      environment: env,
    });
  }

  // POST /v1/payout/create
  if (method === "POST" && path === "/v1/payout/create") {
    return payoutRouter.create({
      merchantOrderId: body.merchantOrderId as string,
      merchantUserId: body.merchantUserId as string,
      amount: body.amount as number,
      currency: body.currency as string,
      network: body.network as string,
      withdrawAddress: body.withdrawAddress as string,
      environment: env,
    });
  }

  // GET /v1/payout/:orderId
  const payoutGetMatch = path.match(/^\/v1\/payout\/([^/]+)$/);
  if (method === "GET" && payoutGetMatch) {
    return payoutRouter.get({
      orderId: payoutGetMatch[1],
      environment: env,
    });
  }

  // GET /v1/balance
  if (method === "GET" && path === "/v1/balance") {
    return balanceRouter.list({
      environment: env,
    });
  }

  throw new Error(`No MCP tool mapped for ${method} ${path}`);
}
