/**
 * X402 Protocol Adapter — HTTP server with x402 payment middleware.
 *
 * This module starts an Express HTTP server that:
 * 1. Applies @x402/express payment middleware to protect endpoints
 * 2. Routes paid requests to MCP tools via the route dispatch layer
 * 3. Returns results with PAYMENT-RESPONSE headers
 *
 * Usage:
 *   import { startX402Server } from "./server.ts";
 *   startX402Server(config);
 */

import type { X402Config } from "./config.ts";
import { buildX402RouteMap, createRouteContext, dispatchToMcp, type X402RouteContext } from "./routes.ts";

// i18n messages for server startup
const MESSAGES: Record<string, { started: string; endpoint: string; tools: string; pricing: string; error: string }> = {
  "zh-CN": {
    started: "X402 协议适配服务器已启动",
    endpoint: "端点",
    tools: "可用工具",
    pricing: "定价",
    error: "X402 服务器启动失败",
  },
  "zh-TW": {
    started: "X402 協議適配伺服器已啟動",
    endpoint: "端點",
    tools: "可用工具",
    pricing: "定價",
    error: "X402 伺服器啟動失敗",
  },
  en: {
    started: "X402 Protocol Adapter Server started",
    endpoint: "Endpoint",
    tools: "Available tools",
    pricing: "Pricing",
    error: "X402 server failed to start",
  },
};

function getMessages(language: string) {
  return MESSAGES[language] ?? MESSAGES.en;
}

export async function startX402Server(config: X402Config): Promise<void> {
  const msg = getMessages(config.language);

  try {
    // Dynamic import for ESM compatibility
    const { default: express } = await import("express");
    const { paymentMiddleware } = await import("@x402/express");

    const app = express();
    app.use(express.json());

    // Create route context (routers + API clients)
    const ctx = createRouteContext(config);

    // Build x402 route map for payment middleware
    const routeMap = buildX402RouteMap(config.customPricing);

    // Apply x402 payment middleware
    app.use(
      paymentMiddleware(config.payTo, routeMap, {
        url: config.facilitatorUrl,
      })
    );

    // Health check (no payment required)
    app.get("/health", (_req, res) => {
      res.json({ status: "ok", service: "timar-x402-adapter" });
    });

    // Tool listing (no payment required)
    app.get("/v1/tools", (_req, res) => {
      const tools = Object.keys(routeMap).map((key) => {
        const [method, path] = key.split(" ");
        const route = routeMap[key];
        return {
          method,
          path,
          description: route.description,
          pricing: route.accepts.map((a) => ({
            network: a.network,
            scheme: a.scheme,
            maxAmount: `$${a.maxAmountRequired}`,
          })),
        };
      });
      res.json({ tools });
    });

    // === Paid endpoints ===

    // POST /v1/payment/create
    app.post("/v1/payment/create", async (req, res) => {
      try {
        const result = await dispatchToMcp(ctx, "POST", "/v1/payment/create", req.body);
        res.json(result);
      } catch (error) {
        res.status(500).json({ error: String(error) });
      }
    });

    // GET /v1/payment/:orderId
    app.get("/v1/payment/:orderId", async (req, res) => {
      try {
        const result = await dispatchToMcp(ctx, "GET", `/v1/payment/${req.params.orderId}`, { environment: req.query.environment as string });
        res.json(result);
      } catch (error) {
        res.status(500).json({ error: String(error) });
      }
    });

    // DELETE /v1/payment/:orderId
    app.delete("/v1/payment/:orderId", async (req, res) => {
      try {
        const result = await dispatchToMcp(ctx, "DELETE", `/v1/payment/${req.params.orderId}`, { environment: req.query.environment as string });
        res.json(result);
      } catch (error) {
        res.status(500).json({ error: String(error) });
      }
    });

    // POST /v1/payout/create
    app.post("/v1/payout/create", async (req, res) => {
      try {
        const result = await dispatchToMcp(ctx, "POST", "/v1/payout/create", req.body);
        res.json(result);
      } catch (error) {
        res.status(500).json({ error: String(error) });
      }
    });

    // GET /v1/payout/:orderId
    app.get("/v1/payout/:orderId", async (req, res) => {
      try {
        const result = await dispatchToMcp(ctx, "GET", `/v1/payout/${req.params.orderId}`, { environment: req.query.environment as string });
        res.json(result);
      } catch (error) {
        res.status(500).json({ error: String(error) });
      }
    });

    // GET /v1/balance
    app.get("/v1/balance", async (req, res) => {
      try {
        const result = await dispatchToMcp(ctx, "GET", "/v1/balance", { environment: req.query.environment as string });
        res.json(result);
      } catch (error) {
        res.status(500).json({ error: String(error) });
      }
    });

    // Start listening
    app.listen(config.port, () => {
      console.log("");
      console.log(`  ╔══════════════════════════════════════════════╗`);
      console.log(`  ║        ${msg.started.padEnd(34)}    ║`);
      console.log(`  ╠══════════════════════════════════════════════╣`);
      console.log(`  ║  ${msg.endpoint}: http://localhost:${config.port}`);
      console.log(`  ║  Pay To: ${config.payTo}`);
      console.log(`  ║  Facilitator: ${config.facilitatorUrl}`);
      console.log(`  ║  Networks: ${config.networks.join(", ")}`);
      console.log(`  ╠══════════════════════════════════════════════╣`);
      console.log(`  ║  ${msg.tools}:`);

      const toolList = Object.keys(routeMap);
      for (const key of toolList) {
        const route = routeMap[key];
        const prices = route.accepts.map((a) => `$${a.maxAmountRequired}`).join(" / ");
        console.log(`  ║    ${key.padEnd(32)} ${prices}`);
      }

      console.log(`  ╚══════════════════════════════════════════════╝`);
      console.log("");
    });
  } catch (error) {
    console.error(`${msg.error}:`, error);
    process.exit(1);
  }
}
