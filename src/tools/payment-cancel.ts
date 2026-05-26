import type { PaymentRouter } from "../routers/payment-router.ts";
import type { PaymentCancelInput } from "../models/tool-inputs.ts";
import type { ToolDefinition } from "../models/tool-outputs.ts";
import { parsePaymentCancelInput } from "../models/tool-inputs.ts";

export function createPaymentCancelTool(router: PaymentRouter): ToolDefinition<PaymentCancelInput, boolean> {
  return {
    name: "payment.cancel",
    description: "Cancel a Timar payment order by platform order ID.",
    execute(input) {
      return router.cancel(parsePaymentCancelInput(input));
    }
  };
}

