import test from "node:test";
import assert from "node:assert/strict";
import { BalanceRouter } from "../../../src/routers/balance-router.ts";
import { BalanceApiClient } from "../../../src/clients/balance-api-client.ts";
import { loadConfigFromObject } from "../../../src/config/config-loader.ts";
import { runtimeConfigFixture } from "../../fixtures/runtime-config.ts";

test("BalanceRouter.list returns normalized MCP output", async () => {
  const config = loadConfigFromObject(runtimeConfigFixture);
  const router = new BalanceRouter(
    config,
    new BalanceApiClient({
      fetchImplementation: async () =>
        new Response(
          JSON.stringify({
            code: "0",
            msg: "",
            data: [{ currency: "USDT", availableBalance: 10, lockedBalance: 1, totalBalance: 11 }]
          }),
          { status: 200, headers: { "content-type": "application/json" } }
        )
    })
  );

  const result = await router.list({ environment: "sandbox" });

  assert.equal(result.ok, true);
  assert.equal(result.data?.[0]?.currency, "USDT");
});

