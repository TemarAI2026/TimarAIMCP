import test from "node:test";
import assert from "node:assert/strict";
import { PaymentRouter } from "../../../src/routers/payment-router.ts";
import { PaymentApiClient } from "../../../src/clients/payment-api-client.ts";
import { loadConfigFromObject } from "../../../src/config/config-loader.ts";
import { runtimeConfigFixture } from "../../fixtures/runtime-config.ts";

test("PaymentRouter.create returns normalized MCP output", async () => {
  const config = loadConfigFromObject(runtimeConfigFixture);
  const router = new PaymentRouter(
    config,
    new PaymentApiClient({
      fetchImplementation: async () =>
        new Response(
          JSON.stringify({
            code: "0",
            msg: "",
            data: { orderId: "p-1", merchantOrderId: "m-1" }
          }),
          { status: 200, headers: { "content-type": "application/json" } }
        )
    })
  );

  const result = await router.create({
    environment: "sandbox",
    merchantOrderId: "m-1",
    merchantUserId: "u-1",
    amount: 10,
    currency: "USDT",
    network: "TRC20"
  });

  assert.equal(result.ok, true);
  assert.equal(result.environment, "sandbox");
  assert.equal(result.code, "0");
  assert.equal(result.data?.orderId, "p-1");
});

