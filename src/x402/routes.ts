/**
 * X402 → MCP route dispatch layer.
 *
 * Responsible for:
 *   - Wiring up API clients and routers
 *   - Dispatching verified X402 requests to the correct MCP tool
 *
 * Payment model:
 *   - payment.create / payout.create: dynamic — amount from Temar API response
 *   - Read-only endpoints: no X402 payment, MCP API Key auth only
 *
 * The server.ts layer handles the 402 handshake and payment verification.
 * Once verified, dispatchToMcp() is called to execute the business logic.
 */

import type { X402Config } from "./config.ts";
import { PaymentApiClient } from "../clients/payment-api-client.ts";
import { PayoutApiClient } from "../clients/payout-api-client.ts";
import { BalanceApiClient } from "../clients/balance-api-client.ts";
import { PaymentRouter } from "../routers/payment-router.ts";
import { PayoutRouter } from "../routers/payout-router.ts";
import { BalanceRouter } from "../routers/balance-router.ts";

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
 * Dispatch a verified X402 request to the correct MCP router.
 *
 * Called only after X402 payment has been verified by the server layer.
 * The `body` object contains the full original request body.
 */
export async function dispatchToMcp(
  ctx: X402RouteContext,
  method: string,
  path: string,
  body: Record<string, unknown>
): Promise<unknown> {
  const { paymentRouter, payoutRouter, balanceRouter } = ctx;
  const env = body.environment as string | undefined;

  // POST /v1/payment/create
  if (method === "POST" && path === "/v1/payment/create") {
    return paymentRouter.create({
      merchantOrderId: body.merchantOrderId as string,
      merchantUserId: body.merchantUserId as string,
      amount: body.amount as number,
      currency: body.currency as string,
      network: body.network as string,
      to: body.to as string | undefined,
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
