import test from "node:test";
import assert from "node:assert/strict";
import { PayoutApiClient } from "../../../src/clients/payout-api-client.ts";
import { loadConfigFromObject } from "../../../src/config/config-loader.ts";
import { runtimeConfigFixture } from "../../fixtures/runtime-config.ts";

function createJsonResponse(body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: {
      "content-type": "application/json"
    }
  });
}

test("PayoutApiClient.createPayout calls published create endpoint", async () => {
  const config = loadConfigFromObject(runtimeConfigFixture);
  let url = "";

  const client = new PayoutApiClient({
    fetchImplementation: async (input) => {
      url = String(input);
      return createJsonResponse({
        code: "0",
        msg: "",
        data: { orderId: "w-1" }
      });
    }
  });

  await client.createPayout(config.environments.sandbox, {
    merchantOrderId: "m-1",
    merchantUserId: "u-1",
    amount: 1,
    currency: "USDT",
    network: "TRC20",
    withdrawAddress: "address"
  });

  assert.equal(url, "https://sandbox.example.com/api/v2/digital/payouts");
});

test("PayoutApiClient.getPayout calls published query endpoint", async () => {
  const config = loadConfigFromObject(runtimeConfigFixture);
  let url = "";

  const client = new PayoutApiClient({
    fetchImplementation: async (input) => {
      url = String(input);
      return createJsonResponse({
        code: "0",
        msg: "",
        data: { orderId: "w-1", status: 0 }
      });
    }
  });

  await client.getPayout(config.environments.sandbox, { orderId: "w-1" });
  assert.equal(url, "https://sandbox.example.com/api/v2/digital/payouts/w-1");
});

