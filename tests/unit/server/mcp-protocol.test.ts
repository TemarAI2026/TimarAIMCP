import test from "node:test";
import assert from "node:assert/strict";
import { createServerRuntime } from "../../../src/server/index.ts";
import { handleMcpMessage } from "../../../src/server/mcp-protocol.ts";
import { runtimeConfigFixture } from "../../fixtures/runtime-config.ts";

test("handleMcpMessage responds to initialize with tools capability", async () => {
  const runtime = createServerRuntime(runtimeConfigFixture);
  const response = await handleMcpMessage(runtime, {
    jsonrpc: "2.0",
    id: 1,
    method: "initialize",
    params: {
      protocolVersion: "2025-11-25",
      capabilities: {},
      clientInfo: { name: "test-client", version: "1.0.0" }
    }
  });

  assert.equal(response?.result?.protocolVersion, "2025-11-25");
  assert.deepEqual(response?.result?.capabilities, {
    tools: {
      listChanged: false
    }
  });
});

test("handleMcpMessage returns tool definitions for tools/list", async () => {
  const runtime = createServerRuntime(runtimeConfigFixture);
  const response = await handleMcpMessage(runtime, {
    jsonrpc: "2.0",
    id: 2,
    method: "tools/list"
  });

  const tools = response?.result?.tools as Array<Record<string, unknown>>;
  assert.ok(Array.isArray(tools));
  assert.ok(tools.some((tool) => tool.name === "payment.create"));
  assert.ok(tools.some((tool) => tool.name === "balance.list"));
});

test("handleMcpMessage executes tools/call and returns structuredContent", async () => {
  const runtime = createServerRuntime(runtimeConfigFixture, {
    fetchImplementation: async () =>
      new Response(
        JSON.stringify({
          code: "0",
          msg: "",
          data: {
            orderId: "p-1",
            merchantOrderId: "m-1"
          }
        }),
        {
          status: 200,
          headers: {
            "content-type": "application/json"
          }
        }
      )
  });

  const response = await handleMcpMessage(runtime, {
    jsonrpc: "2.0",
    id: 3,
    method: "tools/call",
    params: {
      name: "payment.create",
      arguments: {
        environment: "sandbox",
        merchantOrderId: "m-1",
        merchantUserId: "u-1",
        amount: 10,
        currency: "USDT",
        network: "TRC20"
      }
    }
  });

  const result = response?.result as Record<string, unknown>;
  assert.equal(result.isError, false);
  assert.equal((result.structuredContent as Record<string, unknown>).code, "0");
});

test("handleMcpMessage returns protocol error for unknown tool", async () => {
  const runtime = createServerRuntime(runtimeConfigFixture);
  const response = await handleMcpMessage(runtime, {
    jsonrpc: "2.0",
    id: 4,
    method: "tools/call",
    params: {
      name: "missing.tool",
      arguments: {}
    }
  });

  assert.equal(response?.error?.code, -32602);
});

test("handleMcpMessage accepts initialize payload with a leading BOM once parsed", async () => {
  const runtime = createServerRuntime(runtimeConfigFixture);
  const rawLine =
    '\uFEFF{"jsonrpc":"2.0","id":5,"method":"initialize","params":{"protocolVersion":"2025-11-25","capabilities":{},"clientInfo":{"name":"test-client","version":"1.0.0"}}}';

  const response = await handleMcpMessage(runtime, JSON.parse(rawLine.replace(/^\uFEFF/, "")));

  assert.equal(response?.result?.protocolVersion, "2025-11-25");
});
