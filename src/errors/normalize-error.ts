import { McpRuntimeError } from "./error-types.ts";
import { toFailureResult, type McpToolResult } from "../models/tool-outputs.ts";

export function normalizeErrorToToolResult(
  error: unknown,
  environment = "unknown"
): McpToolResult<null> {
  if (error instanceof McpRuntimeError) {
    return toFailureResult({
      environment,
      requestId: error.requestId ?? "",
      code: error.kind,
      message: error.message
    });
  }

  if (error instanceof Error) {
    return toFailureResult({
      environment,
      requestId: "",
      code: "transport_error",
      message: error.message
    });
  }

  return toFailureResult({
    environment,
    requestId: "",
    code: "transport_error",
    message: "Unknown runtime failure."
  });
}

