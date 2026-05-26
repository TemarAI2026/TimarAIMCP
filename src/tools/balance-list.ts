import type { BalanceRouter } from "../routers/balance-router.ts";
import type { BalanceItem } from "../models/public-api-types.ts";
import type { BalanceListInput } from "../models/tool-inputs.ts";
import type { ToolDefinition } from "../models/tool-outputs.ts";
import { parseBalanceListInput } from "../models/tool-inputs.ts";

export function createBalanceListTool(
  router: BalanceRouter
): ToolDefinition<BalanceListInput, BalanceItem[]> {
  return {
    name: "balance.list",
    description: "List Timar balances for the selected environment.",
    execute(input) {
      return router.list(parseBalanceListInput(input));
    }
  };
}

