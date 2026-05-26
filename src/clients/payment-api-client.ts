import type {
  ApiExecutionResult,
  PaymentCancelRequest,
  PaymentCreateRequest,
  PaymentCreateResponse,
  PaymentGetRequest,
  PaymentGetResponse,
  RuntimeEnvironmentConfig
} from "../models/public-api-types.ts";
import { BaseApiClient, type BaseApiClientDependencies } from "./base-api-client.ts";

export class PaymentApiClient extends BaseApiClient {
  constructor(dependencies: BaseApiClientDependencies = {}) {
    super(dependencies);
  }

  createPayment(
    environment: RuntimeEnvironmentConfig,
    request: PaymentCreateRequest
  ): Promise<ApiExecutionResult<PaymentCreateResponse>> {
    return this.request({
      environment,
      method: "POST",
      path: "/api/v2/digital/payments",
      body: request
    });
  }

  getPayment(
    environment: RuntimeEnvironmentConfig,
    request: PaymentGetRequest
  ): Promise<ApiExecutionResult<PaymentGetResponse>> {
    return this.request({
      environment,
      method: "GET",
      path: `/api/v2/digital/payments/${encodeURIComponent(request.orderId)}`
    });
  }

  cancelPayment(
    environment: RuntimeEnvironmentConfig,
    request: PaymentCancelRequest
  ): Promise<ApiExecutionResult<boolean>> {
    return this.request({
      environment,
      method: "POST",
      path: `/api/v2/digital/payments/${encodeURIComponent(request.orderId)}/cancel`
    });
  }
}

