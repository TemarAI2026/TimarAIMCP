import type { PaymentRouter } from "../routers/payment-router.ts";
import type { PaymentCancelInput } from "../models/tool-inputs.ts";
import type { ToolDefinition } from "../models/tool-outputs.ts";
import { parsePaymentCancelInput } from "../models/tool-inputs.ts";

export function createPaymentCancelTool(router: PaymentRouter): ToolDefinition<PaymentCancelInput, boolean> {
  return {
    name: "payment.cancel",
    title: "Cancel Payment",
    description: "Cancel a Temar payment order by platform order ID.",
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
        data: { type: "boolean" }
      },
      required: ["ok", "environment", "requestId", "code", "message"]
    },
    annotations: {
      title: "Cancel Payment",
      readOnlyHint: false,
      destructiveHint: true,
      idempotentHint: false,
      openWorldHint: false
    },
    execute(input) {
      return router.cancel(parsePaymentCancelInput(input));
    }
  };
}
