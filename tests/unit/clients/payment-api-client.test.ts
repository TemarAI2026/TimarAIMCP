import test from "node:test";
import assert from "node:assert/strict";
import { PaymentApiClient } from "../../../src/clients/payment-api-client.ts";
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

test("PaymentApiClient.createPayment calls published create endpoint", async () => {
  const config = loadConfigFromObject(runtimeConfigFixture);
  let url = "";
  let method = "";

  const client = new PaymentApiClient({
    fetchImplementation: async (input, init) => {
      url = String(input);
      method = String(init?.method);
      return createJsonResponse({
        code: "0",
        msg: "",
        data: { orderId: "p-1" }
      });
    }
  });

  await client.createPayment(config.environments.sandbox, {
    merchantOrderId: "m-1",
    merchantUserId: "u-1",
    amount: 1,
    currency: "USDT",
    network: "TRC20"
  });

  assert.equal(method, "POST");
  assert.equal(url, "https://sandbox.example.com/api/v2/digital/payments");
});

test("PaymentApiClient.getPayment calls published query endpoint", async () => {
  const config = loadConfigFromObject(runtimeConfigFixture);
  let url = "";

  const client = new PaymentApiClient({
    fetchImplementation: async (input) => {
      url = String(input);
      return createJsonResponse({
        code: "0",
        msg: "",
        data: { orderId: "p-1", status: "PENDING" }
      });
    }
  });

  await client.getPayment(config.environments.sandbox, { orderId: "p-1" });
  assert.equal(url, "https://sandbox.example.com/api/v2/digital/payments/p-1");
});

test("PaymentApiClient.cancelPayment calls published cancel endpoint", async () => {
  const config = loadConfigFromObject(runtimeConfigFixture);
  let url = "";
  let method = "";

  const client = new PaymentApiClient({
    fetchImplementation: async (input, init) => {
      url = String(input);
      method = String(init?.method);
      return createJsonResponse({
        code: "0",
        msg: "",
        data: true
      });
    }
  });

  await client.cancelPayment(config.environments.sandbox, { orderId: "p-1" });
  assert.equal(method, "POST");
  assert.equal(url, "https://sandbox.example.com/api/v2/digital/payments/p-1/cancel");
});

