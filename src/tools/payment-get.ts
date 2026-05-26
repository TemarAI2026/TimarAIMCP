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
    description: "Get a Timar payment order by platform order ID.",
    execute(input) {
      return router.get(parsePaymentGetInput(input));
    }
  };
}

