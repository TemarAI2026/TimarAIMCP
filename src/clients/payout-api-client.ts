import type {
  ApiExecutionResult,
  PayoutCreateRequest,
  PayoutCreateResponse,
  PayoutGetRequest,
  PayoutGetResponse,
  RuntimeEnvironmentConfig
} from "../models/public-api-types.ts";
import { BaseApiClient, type BaseApiClientDependencies } from "./base-api-client.ts";

export class PayoutApiClient extends BaseApiClient {
  constructor(dependencies: BaseApiClientDependencies = {}) {
    super(dependencies);
  }

  createPayout(
    environment: RuntimeEnvironmentConfig,
    request: PayoutCreateRequest
  ): Promise<ApiExecutionResult<PayoutCreateResponse>> {
    return this.request({
      environment,
      method: "POST",
      path: "/api/v2/digital/payouts",
      body: request
    });
  }

  getPayout(
    environment: RuntimeEnvironmentConfig,
    request: PayoutGetRequest
  ): Promise<ApiExecutionResult<PayoutGetResponse>> {
    return this.request({
      environment,
      method: "GET",
      path: `/api/v2/digital/payouts/${encodeURIComponent(request.orderId)}`
    });
  }
}

