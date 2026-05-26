import { resolveEnvironment } from "../config/environment-resolver.ts";
import { normalizeErrorToToolResult } from "../errors/normalize-error.ts";
import { toSuccessResult, type McpToolResult } from "../models/tool-outputs.ts";
import type { BalanceListInput } from "../models/tool-inputs.ts";
import type { BalanceItem, RuntimeConfig } from "../models/public-api-types.ts";
import { BalanceApiClient } from "../clients/balance-api-client.ts";

export class BalanceRouter {
  private readonly config: RuntimeConfig;
  private readonly balanceApiClient: BalanceApiClient;

  constructor(
    config: RuntimeConfig,
    balanceApiClient: BalanceApiClient
  ) {
    this.config = config;
    this.balanceApiClient = balanceApiClient;
  }

  async list(input: BalanceListInput): Promise<McpToolResult<BalanceItem[]>> {
    try {
      const environment = resolveEnvironment(this.config, input.environment);
      const response = await this.balanceApiClient.listBalances(environment);
      return toSuccessResult({
        environment: response.environment,
        requestId: response.requestId,
        code: response.response.code,
        message: response.response.msg,
        data: response.response.data
      });
    } catch (error) {
      return normalizeErrorToToolResult(error, input.environment);
    }
  }
}
