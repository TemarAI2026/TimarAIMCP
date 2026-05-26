import type { PayoutRouter } from "../routers/payout-router.ts";
import type { PayoutGetResponse } from "../models/public-api-types.ts";
import type { PayoutGetInput } from "../models/tool-inputs.ts";
import type { ToolDefinition } from "../models/tool-outputs.ts";
import { parsePayoutGetInput } from "../models/tool-inputs.ts";

export function createPayoutGetTool(
  router: PayoutRouter
): ToolDefinition<PayoutGetInput, PayoutGetResponse> {
  return {
    name: "payout.get",
    description: "Get a Timar payout order by platform order ID.",
    execute(input) {
      return router.get(parsePayoutGetInput(input));
    }
  };
}

