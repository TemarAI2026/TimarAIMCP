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
    title: "Create Payout",
    description: "Create a Temar payout order by calling the public payout API.",
    inputSchema: {
      type: "object",
      properties: {
        environment: { type: "string" },
        merchantOrderId: { type: "string" },
        merchantUserId: { type: "string" },
        amount: { type: "number" },
        currency: { type: "string" },
        network: { type: "string" },
        withdrawAddress: { type: "string" }
      },
      required: [
        "merchantOrderId",
        "merchantUserId",
        "amount",
        "currency",
        "network",
        "withdrawAddress"
      ]
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
      title: "Create Payout",
      readOnlyHint: false,
      destructiveHint: true,
      idempotentHint: false,
      openWorldHint: false
    },
    execute(input) {
      return router.create(parsePayoutCreateInput(input));
    }
  };
}
