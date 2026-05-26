import type { ApiExecutionResult, BalanceItem, RuntimeEnvironmentConfig } from "../models/public-api-types.ts";
import { BaseApiClient, type BaseApiClientDependencies } from "./base-api-client.ts";

export class BalanceApiClient extends BaseApiClient {
  constructor(dependencies: BaseApiClientDependencies = {}) {
    super(dependencies);
  }

  listBalances(environment: RuntimeEnvironmentConfig): Promise<ApiExecutionResult<BalanceItem[]>> {
    return this.request({
      environment,
      method: "GET",
      path: "/api/v2/digital/balances"
    });
  }
}

