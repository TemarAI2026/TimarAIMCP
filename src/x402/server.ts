/**
 * X402 Protocol Adapter — HTTP server with dynamic payment routing.
 *
 * Payment Model:
 *   Agent holds a user-authorized wallet.
 *
 *   ┌─ Dynamic X402 (payment.create / payout.create) ─────────────────────┐
 *   │  Two-phase flow:                                                      │
 *   │  Phase 1 (no X-PAYMENT header):                                      │
 *   │    → Call Temar API to create the order                              │
 *   │    → Extract receiveAddress + amount from response                   │
 *   │    → Return 402 with { payTo: receiveAddress, amount }               │
 *   │  Phase 2 (X-PAYMENT header present):                                 │
 *   │    → Verify on-chain payment via facilitator                         │
 *   │    → Re-call Temar API to confirm order                              │
 *   │    → Return final business result                                    │
 *   └──────────────────────────────────────────────────────────────────────┘
 *
 *   ┌─ No X402 (read-only: GET/DELETE endpoints) ─────────────────────────┐
 *   │  MCP already handles authentication (API Key).                       │
 *   │  Requests are forwarded directly to MCP — no payment required.      │
 *   └──────────────────────────────────────────────────────────────────────┘
 *
 * Usage:
 *   import { startX402Server } from "./server.ts";
 *   startX402Server(config);
 */

import type { X402Config } from "./config.ts";
import { createRouteContext, dispatchToMcp, type X402RouteContext } from "./routes.ts";
import type { Request, Response } from "express";

// i18n messages for server startup
const MESSAGES: Record<string, {
  started: string;
  endpoint: string;
  tools: string;
  paymentMode: string;
  error: string;
}> = {
  "zh-CN": {
    started: "X402 动态支付路由服务器已启动",
    endpoint: "端点",
    tools: "可用工具",
    paymentMode: "支付模式",
    error: "X402 服务器启动失败",
  },
  "zh-TW": {
    started: "X402 動態支付路由伺服器已啟動",
    endpoint: "端點",
    tools: "可用工具",
    paymentMode: "付款模式",
    error: "X402 伺服器啟動失敗",
  },
  en: {
    started: "X402 Dynamic Payment Router started",
    endpoint: "Endpoint",
    tools: "Available tools",
    paymentMode: "Payment mode",
    error: "X402 server failed to start",
  },
};

function getMessages(language: string) {
  return MESSAGES[language] ?? MESSAGES.en;
}

// USDC contract addresses per network
const USDC_ASSETS: Record<string, string> = {
  base: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
  ethereum: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
  solana: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
};

/**
 * Build a 402 Payment Required response payload.
 * @param payTo   - who receives the payment (merchant wallet or Temar wallet)
 * @param amount  - USDC amount as string (e.g. "100.00")
 * @param network - payment network
 * @param description - human-readable reason
 */
function build402Payload(
  payTo: string,
  amount: string,
  network: string,
  description: string
) {
  const asset = USDC_ASSETS[network] ?? USDC_ASSETS.base;
  return {
    x402Version: 1,
    accepts: [
      {
        scheme: "exact",
        network,
        maxAmountRequired: amount,
        payTo,
        asset,
        description,
      },
    ],
    error: "Payment required",
  };
}

/**
 * Verify the X-PAYMENT header sent by the agent.
 * In production this calls the x402 facilitator to confirm the on-chain tx.
 * Returns true if payment is valid.
 */
async function verifyPayment(
  req: Request,
  facilitatorUrl: string
): Promise<boolean> {
  const paymentHeader = req.headers["x-payment"];
  if (!paymentHeader) return false;

  try {
    // Call facilitator verify endpoint
    const verifyRes = await fetch(`${facilitatorUrl}/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ payment: paymentHeader }),
    });
    return verifyRes.ok;
  } catch {
    // Facilitator unreachable — log and reject
    return false;
  }
}

export async function startX402Server(config: X402Config): Promise<void> {
  const msg = getMessages(config.language);

  try {
    const { default: express } = await import("express");

    const app = express();
    app.use(express.json());

    const ctx = createRouteContext(config);

    // ─── Health check ───────────────────────────────────────────────────────
    app.get("/health", (_req, res) => {
      res.json({ status: "ok", service: "temar-x402-adapter", version: "2.0" });
    });

    // ─── Tool listing ────────────────────────────────────────────────────────
    app.get("/v1/tools", (_req, res) => {
      res.json({
        tools: [
          {
            method: "POST",
            path: "/v1/payment/create",
            description: "Create a crypto payment. X402 amount = actual transfer amount (dynamic). Pays directly to recipient.",
            paymentMode: "dynamic",
          },
          {
            method: "GET",
            path: "/v1/payment/:orderId",
            description: "Query payment order status. No payment required — authenticated via MCP API Key.",
            paymentMode: "none",
          },
          {
            method: "DELETE",
            path: "/v1/payment/:orderId",
            description: "Cancel a pending payment order. No payment required — authenticated via MCP API Key.",
            paymentMode: "none",
          },
          {
            method: "POST",
            path: "/v1/payout/create",
            description: "Create a crypto payout (withdrawal). X402 amount = actual payout amount (dynamic).",
            paymentMode: "dynamic",
          },
          {
            method: "GET",
            path: "/v1/payout/:orderId",
            description: "Query payout order status. No payment required — authenticated via MCP API Key.",
            paymentMode: "none",
          },
          {
            method: "GET",
            path: "/v1/balance",
            description: "List merchant balance across currencies. No payment required — authenticated via MCP API Key.",
            paymentMode: "none",
          },
        ],
      });
    });

    // ─── POST /v1/payment/create — Two-phase X402 flow ─────────────────────
    //
    // Phase 1 (no X-PAYMENT):
    //   Call Temar API to create the order → get receiveAddress + amount
    //   Return 402 with real receiveAddress from Temar (not from request body)
    //
    // Phase 2 (X-PAYMENT present):
    //   Verify on-chain payment → confirm order is paid → return result
    //
    app.post("/v1/payment/create", async (req: Request, res: Response) => {
      const hasPayment = !!req.headers["x-payment"];

      if (!hasPayment) {
        // Phase 1: Create the order first, extract address from Temar response
        try {
          const orderResult = await dispatchToMcp(ctx, "POST", "/v1/payment/create", req.body) as {
            ok: boolean;
            data?: { receiveAddress?: string; amount?: number; network?: string; orderId?: string };
            message?: string;
          };

          if (!orderResult.ok || !orderResult.data?.receiveAddress) {
            res.status(502).json({
              error: "Failed to create payment order",
              detail: orderResult.message ?? "No receiveAddress in response",
            });
            return;
          }

          const { receiveAddress, amount, network } = orderResult.data;
          const payNetwork = (network ?? config.networks[0] ?? "base").toLowerCase();

          // Return 402 with real receiveAddress from Temar
          res.status(402).json(
            build402Payload(
              receiveAddress,
              String(amount ?? req.body.amount ?? "0"),
              payNetwork,
              `Pay ${amount} ${req.body.currency ?? "USDC"} to complete this payment (Order: ${orderResult.data.orderId})`
            )
          );
        } catch (error) {
          res.status(500).json({ error: String(error) });
        }
        return;
      }

      // Phase 2: Payment header present → verify on-chain → confirm order
      const valid = await verifyPayment(req, config.facilitatorUrl);
      if (!valid) {
        res.status(402).json({ error: "Payment verification failed. Ensure X-PAYMENT header is valid and the on-chain transaction is confirmed." });
        return;
      }

      try {
        // Re-query the order to confirm it's now paid (or return the existing result)
        const result = await dispatchToMcp(ctx, "POST", "/v1/payment/create", req.body);
        res.setHeader("X-PAYMENT-RESPONSE", "accepted");
        res.json(result);
      } catch (error) {
        res.status(500).json({ error: String(error) });
      }
    });

    // ─── POST /v1/payout/create — Two-phase X402 flow ──────────────────────
    //
    // Phase 1 (no X-PAYMENT):
    //   Call Temar API → get withdrawAddress + amount from response
    //   Return 402 with real withdrawAddress from Temar
    //
    // Phase 2 (X-PAYMENT present):
    //   Verify on-chain payment → return payout result
    //
    app.post("/v1/payout/create", async (req: Request, res: Response) => {
      const hasPayment = !!req.headers["x-payment"];

      if (!hasPayment) {
        // Phase 1: Create payout order → extract withdrawAddress from Temar
        try {
          const orderResult = await dispatchToMcp(ctx, "POST", "/v1/payout/create", req.body) as {
            ok: boolean;
            data?: { withdrawAddress?: string; amount?: number; network?: string; orderId?: string };
            message?: string;
          };

          if (!orderResult.ok || !orderResult.data?.withdrawAddress) {
            res.status(502).json({
              error: "Failed to create payout order",
              detail: orderResult.message ?? "No withdrawAddress in response",
            });
            return;
          }

          const { withdrawAddress, amount, network } = orderResult.data;
          const payNetwork = (network ?? config.networks[0] ?? "base").toLowerCase();

          res.status(402).json(
            build402Payload(
              withdrawAddress,
              String(amount ?? req.body.amount ?? "0"),
              payNetwork,
              `Pay ${amount} ${req.body.currency ?? "USDC"} to execute this payout (Order: ${orderResult.data.orderId})`
            )
          );
        } catch (error) {
          res.status(500).json({ error: String(error) });
        }
        return;
      }

      // Phase 2: Verify payment → return payout result
      const valid = await verifyPayment(req, config.facilitatorUrl);
      if (!valid) {
        res.status(402).json({ error: "Payment verification failed." });
        return;
      }

      try {
        const result = await dispatchToMcp(ctx, "POST", "/v1/payout/create", req.body);
        res.setHeader("X-PAYMENT-RESPONSE", "accepted");
        res.json(result);
      } catch (error) {
        res.status(500).json({ error: String(error) });
      }
    });

    // ─── Read-only endpoints — Direct passthrough (no X402) ─────────────────
    //
    // MCP already handles authentication via API Key.
    // These endpoints forward directly to MCP without any payment requirement.
    //

    app.get("/v1/payment/:orderId", async (req: Request, res: Response) => {
      try {
        const result = await dispatchToMcp(ctx, "GET", `/v1/payment/${req.params.orderId}`, {
          environment: req.query.environment as string,
        });
        res.json(result);
      } catch (error) { res.status(500).json({ error: String(error) }); }
    });

    app.delete("/v1/payment/:orderId", async (req: Request, res: Response) => {
      try {
        const result = await dispatchToMcp(ctx, "DELETE", `/v1/payment/${req.params.orderId}`, {
          environment: req.query.environment as string,
        });
        res.json(result);
      } catch (error) { res.status(500).json({ error: String(error) }); }
    });

    app.get("/v1/payout/:orderId", async (req: Request, res: Response) => {
      try {
        const result = await dispatchToMcp(ctx, "GET", `/v1/payout/${req.params.orderId}`, {
          environment: req.query.environment as string,
        });
        res.json(result);
      } catch (error) { res.status(500).json({ error: String(error) }); }
    });

    app.get("/v1/balance", async (req: Request, res: Response) => {
      try {
        const result = await dispatchToMcp(ctx, "GET", "/v1/balance", {
          environment: req.query.environment as string,
        });
        res.json(result);
      } catch (error) { res.status(500).json({ error: String(error) }); }
    });

    // ─── Start ───────────────────────────────────────────────────────────────
    app.listen(config.port, () => {
      console.log("");
      console.log(`  ╔═══════════════════════════════════════════════════════╗`);
      console.log(`  ║  ${msg.started}`);
      console.log(`  ╠═══════════════════════════════════════════════════════╣`);
      console.log(`  ║  ${msg.endpoint}: http://localhost:${config.port}`);
      console.log(`  ║  ${msg.paymentMode}:`);
      console.log(`  ║    payment.create  → X402 dynamic (pays actual recipient)`);
      console.log(`  ║    payout.create   → X402 dynamic (pays actual recipient)`);
      console.log(`  ║    GET/DELETE      → Direct passthrough (MCP auth, no X402)`);
      console.log(`  ║  Facilitator: ${config.facilitatorUrl}`);
      console.log(`  ╚═══════════════════════════════════════════════════════╝`);
      console.log("");
    });
  } catch (error) {
    console.error(`${msg.error}:`, error);
    process.exit(1);
  }
}
