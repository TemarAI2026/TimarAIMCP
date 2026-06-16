import type { PaymentRouter } from "../routers/payment-router.ts";
import type { PaymentGetResponse } from "../models/public-api-types.ts";
import type { PaymentGetInput } from "../models/tool-inputs.ts";
import type { ToolDefinition } from "../models/tool-outputs.ts";
import { parsePaymentGetInput } from "../models/tool-inputs.ts";

export function createPaymentGetTool(
  router: PaymentRouter
): ToolDefinition<PaymentGetInput, PaymentGetResponse> {
  return {
    name: "payment.get",
    title: "Get Payment",
    description: "Get a Temar payment order by platform order ID.",
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
      title: "Get Payment",
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false
    },
    execute(input) {
      return router.get(parsePaymentGetInput(input));
    }
  };
}
