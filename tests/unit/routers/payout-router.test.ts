import test from "node:test";
import assert from "node:assert/strict";
import { PayoutRouter } from "../../../src/routers/payout-router.ts";
import { PayoutApiClient } from "../../../src/clients/payout-api-client.ts";
import { loadConfigFromObject } from "../../../src/config/config-loader.ts";
import { runtimeConfigFixture } from "../../fixtures/runtime-config.ts";

test("PayoutRouter.get returns normalized MCP output", async () => {
  const config = loadConfigFromObject(runtimeConfigFixture);
  const router = new PayoutRouter(
    config,
    new PayoutApiClient({
      fetchImplementation: async () =>
        new Response(
          JSON.stringify({
            code: "0",
            msg: "",
            data: { orderId: "w-1", status: 0 }
          }),
          { status: 200, headers: { "content-type": "application/json" } }
        )
    })
  );

  const result = await router.get({
    environment: "sandbox",
    orderId: "w-1"
  });

  assert.equal(result.ok, true);
  assert.equal(result.data?.orderId, "w-1");
  assert.equal(result.environment, "sandbox");
});

