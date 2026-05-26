import { createHmac } from "node:crypto";

export function buildSigningPayload(
  timestamp: string,
  requestId: string,
  rawBody?: string
): string {
  return `${timestamp}${requestId}${rawBody ?? ""}`;
}

export function signPayload(secretKey: string, payload: string): string {
  return createHmac("sha256", Buffer.from(secretKey, "utf8"))
    .update(Buffer.from(payload, "utf8"))
    .digest("base64");
}

