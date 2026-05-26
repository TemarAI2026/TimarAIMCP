import test from "node:test";
import assert from "node:assert/strict";
import { buildSignedHeaders } from "../../../src/auth/header-builder.ts";
import { buildSigningPayload, signPayload } from "../../../src/auth/signing.ts";

test("buildSignedHeaders emits all required public headers", () => {
  const timestamp = "1716200000123";
  const requestId = "req-fixed";
  const rawBody = '{"amount":1}';

  const result = buildSignedHeaders({
    apiKey: "api-key",
    secretKey: "secret-key",
    rawBody,
    timestamp,
    requestId
  });

  assert.equal(result.requestId, requestId);
  assert.equal(result.timestamp, timestamp);
  assert.equal(result.headers["X-Api-Key"], "api-key");
  assert.equal(result.headers["X-Api-Timestamp"], timestamp);
  assert.equal(result.headers["X-Api-RequestId"], requestId);
  assert.equal(
    result.headers["X-Api-Sign"],
    signPayload("secret-key", buildSigningPayload(timestamp, requestId, rawBody))
  );
});

