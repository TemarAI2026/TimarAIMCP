import test from "node:test";
import assert from "node:assert/strict";
import { BalanceApiClient } from "../../../src/clients/balance-api-client.ts";
import { loadConfigFromObject } from "../../../src/config/config-loader.ts";
import { runtimeConfigFixture } from "../../fixtures/runtime-config.ts";

test("BalanceApiClient.listBalances calls published balance endpoint", async () => {
  const config = loadConfigFromObject(runtimeConfigFixture);
  let url = "";
  let method = "";

  const client = new BalanceApiClient({
    fetchImplementation: async (input, init) => {
      url = String(input);
      method = String(init?.method);
      return new Response(
        JSON.stringify({
          code: "0",
          msg: "",
          data: []
        }),
        {
          status: 200,
          headers: { "content-type": "application/json" }
        }
      );
    }
  });

  await client.listBalances(config.environments.sandbox);
  assert.equal(method, "GET");
  assert.equal(url, "https://sandbox.example.com/api/v2/digital/balances");
});

