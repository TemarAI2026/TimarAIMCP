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
    title: "Get Payout",
    description: "Get a Timar payout order by platform order ID.",
    inputSchema: {
      type: "object",
      properties: {
        environment: { type: "string" },
        orderId: { type: "string" }
      },
      required: ["orderId"]
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
      title: "Get Payout",
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false
    },
    execute(input) {
      return router.get(parsePayoutGetInput(input));
    }
  };
}
