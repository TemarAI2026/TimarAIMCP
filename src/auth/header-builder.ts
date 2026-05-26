import { createRequestId } from "./request-id.ts";
import { buildSigningPayload, signPayload } from "./signing.ts";

export interface SignedHeadersResult {
  requestId: string;
  timestamp: string;
  headers: Record<string, string>;
}

export function buildSignedHeaders(params: {
  apiKey: string;
  secretKey: string;
  rawBody?: string;
  timestamp?: string;
  requestId?: string;
}): SignedHeadersResult {
  const timestamp = params.timestamp ?? Date.now().toString();
  const requestId = params.requestId ?? createRequestId();
  const payload = buildSigningPayload(timestamp, requestId, params.rawBody);
  const signature = signPayload(params.secretKey, payload);

  return {
    requestId,
    timestamp,
    headers: {
      "Content-Type": "application/json",
      "X-Api-Key": params.apiKey,
      "X-Api-Timestamp": timestamp,
      "X-Api-RequestId": requestId,
      "X-Api-Sign": signature
    }
  };
}

