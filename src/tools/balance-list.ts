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
    title: "List Balances",
    description: "List Temar balances for the selected environment.",
    inputSchema: {
      type: "object",
      properties: {
        environment: { type: "string" }
      },
      required: ["environment"]
    },
    outputSchema: {
      type: "object",
      properties: {
        ok: { type: "boolean" },
        environment: { type: "string" },
        requestId: { type: "string" },
        code: { type: "string" },
        message: { type: "string" },
        data: { type: "object" }
      },
      required: ["ok", "environment", "requestId", "code", "message"]
    },
    annotations: {
      title: "List Balances",
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false
    },
    execute(input) {
      return router.list(parseBalanceListInput(input));
    }
  };
}
