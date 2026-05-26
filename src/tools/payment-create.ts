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
    description: "Create a Timar payment order by calling the public payment API.",
    execute(input) {
      return router.create(parsePaymentCreateInput(input));
    }
  };
}

