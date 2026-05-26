export interface McpToolResult<TData = unknown> {
  ok: boolean;
  environment: string;
  requestId: string;
  code: string;
  message: string;
  data: TData | null;
}

export interface ToolInputSchema {
  type: "object";
  properties?: Record<string, object>;
  required?: string[];
}

export interface ToolOutputSchema {
  type: "object";
  properties?: Record<string, object>;
  required?: string[];
}

export interface ToolAnnotations {
  title?: string;
  readOnlyHint?: boolean;
  destructiveHint?: boolean;
  idempotentHint?: boolean;
  openWorldHint?: boolean;
}

export interface ToolDefinition<TInput = unknown, TData = unknown> {
  name: string;
  title?: string;
  description: string;
  inputSchema: ToolInputSchema;
  outputSchema?: ToolOutputSchema;
  annotations?: ToolAnnotations;
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
