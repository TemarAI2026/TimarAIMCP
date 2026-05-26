export interface PublicApiResponse<TData> {
  code: string;
  msg: string;
  data: TData;
}

export interface RuntimeEnvironmentConfig {
  name: string;
  baseUrl: string;
  apiKey: string;
  secretKey: string;
  timeoutMs: number;
}

export interface RuntimeConfig {
  defaultEnvironment: string;
  environments: Record<string, RuntimeEnvironmentConfig>;
}

export interface PaymentCreateRequest {
  merchantOrderId: string;
  merchantUserId: string;
  amount: number;
  currency: string;
  network: string;
  returnUrl?: string;
  cancelUrl?: string;
}

export interface PaymentGetRequest {
  orderId: string;
}

export interface PaymentCancelRequest {
  orderId: string;
}

export interface PayoutCreateRequest {
  merchantOrderId: string;
  merchantUserId: string;
  amount: number;
  currency: string;
  network: string;
  withdrawAddress: string;
}

export interface PayoutGetRequest {
  orderId: string;
}

export interface BalanceListRequest {
  environment: string;
}

export interface PaymentCreateResponse {
  orderId: string;
  merchantOrderId: string;
  paymentUrl: string;
  amount: number;
  receiveAddress: string;
  currency: string;
  network: string;
  expiresInSeconds: number;
}

export interface PaymentGetResponse {
  orderId: string;
  merchantOrderId: string;
  merchantUserId: string;
  amount: number;
  status: string;
  currency: string;
  network: string;
  paidAmount: number;
  paymentUrl: string;
  receiveAddress: string;
  expiresInSeconds: number;
  fee: number;
  feeCurrency: string;
  depositDetails: Array<Record<string, unknown>>;
}

export interface PayoutCreateResponse {
  orderId: string;
  merchantOrderId: string;
  merchantUserId: string;
  amount: number;
  fee: number;
  currency: string;
  network: string;
  withdrawAddress: string;
}

export interface PayoutGetResponse {
  orderId: string;
  merchantOrderId: string;
  merchantUserId: string;
  amount: number;
  totalFee: number;
  networkFee: number;
  serviceFee: number;
  status: number;
  currency: string;
  network: string;
  txId: string;
  withdrawAddress: string;
  sourceAddress: string;
  feeCurrency: string;
}

export interface BalanceItem {
  currency: string;
  availableBalance: number;
  lockedBalance: number;
  totalBalance: number;
}

export interface ApiExecutionResult<TData> {
  environment: string;
  requestId: string;
  response: PublicApiResponse<TData>;
}

