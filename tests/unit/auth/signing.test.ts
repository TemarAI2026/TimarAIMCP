import test from "node:test";
import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { buildSigningPayload, signPayload } from "../../../src/auth/signing.ts";

test("buildSigningPayload includes raw body when present", () => {
  const payload = buildSigningPayload("1716200000123", "req-1", '{"amount":1}');
  assert.equal(payload, '1716200000123req-1{"amount":1}');
});

test("buildSigningPayload omits body when missing", () => {
  const payload = buildSigningPayload("1716200000123", "req-1");
  assert.equal(payload, "1716200000123req-1");
});

test("signPayload matches HMAC-SHA256 base64 output", () => {
  const payload = "1716200000123req-1";
  const expected = createHmac("sha256", Buffer.from("secret", "utf8"))
    .update(Buffer.from(payload, "utf8"))
    .digest("base64");

  assert.equal(signPayload("secret", payload), expected);
});

