import test from "node:test";
import assert from "node:assert/strict";
import {
  parseBalanceListInput,
  parsePaymentCreateInput,
  parsePayoutCreateInput
} from "../../../src/models/tool-inputs.ts";

test("parsePaymentCreateInput accepts valid business input", () => {
  const input = parsePaymentCreateInput({
    environment: "sandbox",
    merchantOrderId: "m-1",
    merchantUserId: "u-1",
    amount: 10,
    currency: "USDT",
    network: "TRC20"
  });

  assert.equal(input.environment, "sandbox");
  assert.equal(input.amount, 10);
});

test("parsePayoutCreateInput requires withdrawAddress", () => {
  assert.throws(
    () =>
      parsePayoutCreateInput({
        environment: "sandbox",
        merchantOrderId: "m-1",
        merchantUserId: "u-1",
        amount: 10,
        currency: "USDT",
        network: "TRC20"
      }),
    /withdrawAddress/
  );
});

test("parseBalanceListInput requires environment", () => {
  assert.throws(() => parseBalanceListInput({}), /environment is required/);
});

test("parsePaymentCreateInput rejects reserved signing fields", () => {
  assert.throws(
    () =>
      parsePaymentCreateInput({
        merchantOrderId: "m-1",
        merchantUserId: "u-1",
        amount: 10,
        currency: "USDT",
        network: "TRC20",
        sign: "bad"
      }),
    /reserved control field "sign"/
  );
});

