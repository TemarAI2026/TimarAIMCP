import { resolveEnvironment } from "../config/environment-resolver.ts";
import { normalizeErrorToToolResult } from "../errors/normalize-error.ts";
import {
  toFailureResult,
  toSuccessResult,
  type McpToolResult
} from "../models/tool-outputs.ts";
import type {
  PaymentCancelInput,
  PaymentCreateInput,
  PaymentGetInput
} from "../models/tool-inputs.ts";
import type {
  PaymentCreateResponse,
  PaymentGetResponse,
  RuntimeConfig
} from "../models/public-api-types.ts";
import { PaymentApiClient } from "../clients/payment-api-client.ts";

export class PaymentRouter {
  private readonly config: RuntimeConfig;
  private readonly paymentApiClient: PaymentApiClient;

  constructor(
    config: RuntimeConfig,
    paymentApiClient: PaymentApiClient
  ) {
    this.config = config;
    this.paymentApiClient = paymentApiClient;
  }

  async create(input: PaymentCreateInput): Promise<McpToolResult<PaymentCreateResponse>> {
    try {
      const environment = resolveEnvironment(this.config, input.environment);
      const response = await this.paymentApiClient.createPayment(environment, input);
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

  async get(input: PaymentGetInput): Promise<McpToolResult<PaymentGetResponse>> {
    try {
      const environment = resolveEnvironment(this.config, input.environment);
      const response = await this.paymentApiClient.getPayment(environment, input);
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

  async cancel(input: PaymentCancelInput): Promise<McpToolResult<boolean>> {
    try {
      const environment = resolveEnvironment(this.config, input.environment);
      const response = await this.paymentApiClient.cancelPayment(environment, input);
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
