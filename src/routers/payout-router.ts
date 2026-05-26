import { resolveEnvironment } from "../config/environment-resolver.ts";
import { normalizeErrorToToolResult } from "../errors/normalize-error.ts";
import { toSuccessResult, type McpToolResult } from "../models/tool-outputs.ts";
import type { PayoutCreateInput, PayoutGetInput } from "../models/tool-inputs.ts";
import type {
  PayoutCreateResponse,
  PayoutGetResponse,
  RuntimeConfig
} from "../models/public-api-types.ts";
import { PayoutApiClient } from "../clients/payout-api-client.ts";

export class PayoutRouter {
  private readonly config: RuntimeConfig;
  private readonly payoutApiClient: PayoutApiClient;

  constructor(
    config: RuntimeConfig,
    payoutApiClient: PayoutApiClient
  ) {
    this.config = config;
    this.payoutApiClient = payoutApiClient;
  }

  async create(input: PayoutCreateInput): Promise<McpToolResult<PayoutCreateResponse>> {
    try {
      const environment = resolveEnvironment(this.config, input.environment);
      const response = await this.payoutApiClient.createPayout(environment, input);
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

  async get(input: PayoutGetInput): Promise<McpToolResult<PayoutGetResponse>> {
    try {
      const environment = resolveEnvironment(this.config, input.environment);
      const response = await this.payoutApiClient.getPayout(environment, input);
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
