import type { RuntimeConfig } from "../models/public-api-types.ts";
import type { ToolDefinition } from "../models/tool-outputs.ts";
import type { BaseApiClientDependencies } from "../clients/base-api-client.ts";
import { PaymentApiClient } from "../clients/payment-api-client.ts";
import { PayoutApiClient } from "../clients/payout-api-client.ts";
import { BalanceApiClient } from "../clients/balance-api-client.ts";
import { PaymentRouter } from "../routers/payment-router.ts";
import { PayoutRouter } from "../routers/payout-router.ts";
import { BalanceRouter } from "../routers/balance-router.ts";
import { createPaymentCreateTool } from "../tools/payment-create.ts";
import { createPaymentGetTool } from "../tools/payment-get.ts";
import { createPaymentCancelTool } from "../tools/payment-cancel.ts";
import { createPayoutCreateTool } from "../tools/payout-create.ts";
import { createPayoutGetTool } from "../tools/payout-get.ts";
import { createBalanceListTool } from "../tools/balance-list.ts";

export function registerTools(
  config: RuntimeConfig,
  dependencies: BaseApiClientDependencies = {}
): ToolDefinition[] {
  const paymentRouter = new PaymentRouter(config, new PaymentApiClient(dependencies));
  const payoutRouter = new PayoutRouter(config, new PayoutApiClient(dependencies));
  const balanceRouter = new BalanceRouter(config, new BalanceApiClient(dependencies));

  return [
    createPaymentCreateTool(paymentRouter),
    createPaymentGetTool(paymentRouter),
    createPaymentCancelTool(paymentRouter),
    createPayoutCreateTool(payoutRouter),
    createPayoutGetTool(payoutRouter),
    createBalanceListTool(balanceRouter)
  ];
}

