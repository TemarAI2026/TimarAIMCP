export type ErrorKind =
  | "transport_error"
  | "auth_error"
  | "business_error"
  | "config_error"
  | "validation_error";

export class McpRuntimeError extends Error {
  readonly kind: ErrorKind;
  readonly requestId?: string;

  constructor(kind: ErrorKind, message: string, requestId?: string, options?: ErrorOptions) {
    super(message, options);
    this.name = "McpRuntimeError";
    this.kind = kind;
    this.requestId = requestId;
  }
}

