import type { PaymentRouter } from "../routers/payment-router.ts";
import type { PaymentCreateResponse } from "../models/public-api-types.ts";
import type { PaymentCreateInput } from "../models/tool-inputs.ts";
import type { ToolDefinition } from "../models/tool-outputs.ts";
import { parsePaymentCreateInput } from "../models/tool-inputs.ts";

export function createPaymentCreateTool(
  router: PaymentRouter
): ToolDefinition<PaymentCreateInput, PaymentCreateResponse> {
  return {
    name: "payment.create",
    title: "Create Payment",
    description: "Create a Timar payment order by calling the public payment API.",
    inputSchema: {
      type: "object",
      properties: {
        environment: { type: "string" },
        merchantOrderId: { type: "string" },
        merchantUserId: { type: "string" },
        amount: { type: "number" },
        currency: { type: "string" },
        network: { type: "string" },
        returnUrl: { type: "string" },
        cancelUrl: { type: "string" }
      },
      required: ["merchantOrderId", "merchantUserId", "amount", "currency", "network"]
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
      title: "Create Payment",
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: false,
      openWorldHint: false
    },
    execute(input) {
      return router.create(parsePaymentCreateInput(input));
    }
  };
}
