export interface McpToolResult<TData = unknown> {
  ok: boolean;
  environment: string;
  requestId: string;
  code: string;
  message: string;
  data: TData | null;
}

export interface ToolDefinition<TInput = unknown, TData = unknown> {
  name: string;
  description: string;
  execute(input: unknown): Promise<McpToolResult<TData>>;
}

export function toSuccessResult<TData>(params: {
  environment: string;
  requestId: string;
  code: string;
  message: string;
  data: TData;
}): McpToolResult<TData> {
  return {
    ok: params.code === "0",
    environment: params.environment,
    requestId: params.requestId,
    code: params.code,
    message: params.message,
    data: params.data
  };
}

export function toFailureResult(params: {
  environment: string;
  requestId: string;
  code: string;
  message: string;
}): McpToolResult<null> {
  return {
    ok: false,
    environment: params.environment,
    requestId: params.requestId,
    code: params.code,
    message: params.message,
    data: null
  };
}

