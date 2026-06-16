import { createInterface } from "node:readline";
import { McpRuntimeError } from "../errors/error-types.ts";
import { normalizeErrorToToolResult } from "../errors/normalize-error.ts";
import type { McpToolResult, ToolDefinition } from "../models/tool-outputs.ts";
import type { McpServerRuntime } from "./index.ts";

const SUPPORTED_PROTOCOL_VERSION = "2025-11-25";
const SERVER_NAME = "temar-ai-mcp";
const SERVER_VERSION = "0.1.0";

type RequestId = string | number | null;

interface JsonRpcRequest {
  jsonrpc: "2.0";
  id?: RequestId;
  method: string;
  params?: Record<string, unknown>;
}

interface JsonRpcResponse {
  jsonrpc: "2.0";
  id: RequestId;
  result?: Record<string, unknown>;
  error?: {
    code: number;
    message: string;
    data?: unknown;
  };
}

interface TextContentBlock {
  type: "text";
  text: string;
}

function isRequestWithId(message: JsonRpcRequest): message is JsonRpcRequest & { id: RequestId } {
  return Object.prototype.hasOwnProperty.call(message, "id");
}

function createSuccessResponse(id: RequestId, result: Record<string, unknown>): JsonRpcResponse {
  return {
    jsonrpc: "2.0",
    id,
    result
  };
}

function createErrorResponse(
  id: RequestId,
  code: number,
  message: string,
  data?: unknown
): JsonRpcResponse {
  return {
    jsonrpc: "2.0",
    id,
    error: {
      code,
      message,
      data
    }
  };
}

function validateJsonRpcRequest(value: unknown): JsonRpcRequest {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new McpRuntimeError("validation_error", "JSON-RPC message must be an object.");
  }

  const message = value as Record<string, unknown>;

  if (message.jsonrpc !== "2.0") {
    throw new McpRuntimeError("validation_error", 'JSON-RPC message must include jsonrpc: "2.0".');
  }

  if (typeof message.method !== "string" || message.method.length === 0) {
    throw new McpRuntimeError("validation_error", "JSON-RPC request must include a method.");
  }

  if ("params" in message && message.params !== undefined) {
    if (!message.params || typeof message.params !== "object" || Array.isArray(message.params)) {
      throw new McpRuntimeError("validation_error", "JSON-RPC params must be an object when present.");
    }
  }

  return message as JsonRpcRequest;
}

function createToolList(runtime: McpServerRuntime): Record<string, unknown> {
  return {
    tools: runtime.tools.map((tool) => ({
      name: tool.name,
      title: tool.title,
      description: tool.description,
      inputSchema: tool.inputSchema,
      outputSchema: tool.outputSchema,
      annotations: tool.annotations
    }))
  };
}

function createToolCallResult(result: McpToolResult): Record<string, unknown> {
  const text = JSON.stringify(
    {
      ok: result.ok,
      environment: result.environment,
      requestId: result.requestId,
      code: result.code,
      message: result.message,
      data: result.data
    },
    null,
    2
  );

  return {
    content: [{ type: "text", text } satisfies TextContentBlock],
    structuredContent: {
      ok: result.ok,
      environment: result.environment,
      requestId: result.requestId,
      code: result.code,
      message: result.message,
      data: result.data
    },
    isError: !result.ok
  };
}

function findTool(runtime: McpServerRuntime, toolName: string): ToolDefinition | undefined {
  return runtime.tools.find((tool) => tool.name === toolName);
}

export async function handleMcpMessage(
  runtime: McpServerRuntime,
  rawMessage: unknown
): Promise<JsonRpcResponse | null> {
  let message: JsonRpcRequest;

  try {
    message = validateJsonRpcRequest(rawMessage);
  } catch (error) {
    const normalized = normalizeErrorToToolResult(error, "unknown");
    return createErrorResponse(
      isRequestWithId((rawMessage ?? {}) as JsonRpcRequest) ? ((rawMessage as JsonRpcRequest).id ?? null) : null,
      -32600,
      normalized.message
    );
  }

  if (message.method === "notifications/initialized" || message.method === "notifications/cancelled") {
    return null;
  }

  if (!isRequestWithId(message)) {
    return null;
  }

  switch (message.method) {
    case "initialize": {
      return createSuccessResponse(message.id, {
        protocolVersion: SUPPORTED_PROTOCOL_VERSION,
        capabilities: {
          tools: {
            listChanged: false
          }
        },
        serverInfo: {
          name: SERVER_NAME,
          version: SERVER_VERSION
        },
        instructions:
          "Use payment.create/get/cancel, payout.create/get, and balance.list to call Temar public APIs through this thin MCP adapter."
      });
    }

    case "ping": {
      return createSuccessResponse(message.id, {});
    }

    case "tools/list": {
      return createSuccessResponse(message.id, createToolList(runtime));
    }

    case "tools/call": {
      const toolName = typeof message.params?.name === "string" ? message.params.name : undefined;

      if (!toolName) {
        return createErrorResponse(message.id, -32602, "tools/call requires params.name.");
      }

      const tool = findTool(runtime, toolName);

      if (!tool) {
        return createErrorResponse(message.id, -32602, `Unknown tool: ${toolName}`);
      }

      try {
        const result = await tool.execute(message.params?.arguments ?? {});
        return createSuccessResponse(message.id, createToolCallResult(result));
      } catch (error) {
        const result = normalizeErrorToToolResult(error, "unknown");
        return createSuccessResponse(message.id, createToolCallResult(result));
      }
    }

    default:
      return createErrorResponse(message.id, -32601, `Method not found: ${message.method}`);
  }
}

export function startStdioMcpServer(runtime: McpServerRuntime): void {
  const reader = createInterface({
    input: process.stdin,
    crlfDelay: Infinity
  });

  reader.on("line", async (line) => {
    const normalizedLine = line.replace(/^\uFEFF/, "");

    if (!normalizedLine.trim()) {
      return;
    }

    let parsed: unknown;

    try {
      parsed = JSON.parse(normalizedLine);
    } catch (error) {
      const response = createErrorResponse(
        null,
        -32700,
        error instanceof Error ? error.message : "Failed to parse JSON-RPC message."
      );
      process.stdout.write(`${JSON.stringify(response)}\n`);
      return;
    }

    const response = await handleMcpMessage(runtime, parsed);
    if (response) {
      process.stdout.write(`${JSON.stringify(response)}\n`);
    }
  });

  reader.on("close", () => {
    process.exit(0);
  });
}
