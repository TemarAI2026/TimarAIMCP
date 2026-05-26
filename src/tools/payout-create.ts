import type { PayoutRouter } from "../routers/payout-router.ts";
import type { PayoutCreateResponse } from "../models/public-api-types.ts";
import type { PayoutCreateInput } from "../models/tool-inputs.ts";
import type { ToolDefinition } from "../models/tool-outputs.ts";
import { parsePayoutCreateInput } from "../models/tool-inputs.ts";

export function createPayoutCreateTool(
  router: PayoutRouter
): ToolDefinition<PayoutCreateInput, PayoutCreateResponse> {
  return {
    name: "payout.create",
    description: "Create a Timar payout order by calling the public payout API.",
    execute(input) {
      return router.create(parsePayoutCreateInput(input));
    }
  };
}

