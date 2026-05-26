import { createServerRuntime } from "../src/server/index.ts";
import { startStdioMcpServer } from "../src/server/mcp-protocol.ts";

const runtime = createServerRuntime({
  defaultEnvironment: "sandbox",
  environments: {
    sandbox: {
      baseUrl: process.env.TIMAR_MCP_SANDBOX_BASE_URL ?? "https://sandbox.example.com",
      apiKey: process.env.TIMAR_MCP_SANDBOX_API_KEY ?? "sandbox-key",
      secretKey: process.env.TIMAR_MCP_SANDBOX_SECRET_KEY ?? "sandbox-secret",
      timeoutMs: Number(process.env.TIMAR_MCP_SANDBOX_TIMEOUT_MS ?? "5000")
    },
    production: {
      baseUrl: process.env.TIMAR_MCP_PRODUCTION_BASE_URL ?? "https://production.example.com",
      apiKey: process.env.TIMAR_MCP_PRODUCTION_API_KEY ?? "production-key",
      secretKey: process.env.TIMAR_MCP_PRODUCTION_SECRET_KEY ?? "production-secret",
      timeoutMs: Number(process.env.TIMAR_MCP_PRODUCTION_TIMEOUT_MS ?? "5000")
    }
  }
});

startStdioMcpServer(runtime);
