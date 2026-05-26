import { McpRuntimeError } from "../errors/error-types.ts";
import type {
  BalanceListRequest,
  PaymentCancelRequest,
  PaymentCreateRequest,
  PaymentGetRequest,
  PayoutCreateRequest,
  PayoutGetRequest
} from "./public-api-types.ts";

export interface EnvironmentScopedInput {
  environment?: string;
}

export interface PaymentCreateInput extends EnvironmentScopedInput, PaymentCreateRequest {}
export interface PaymentGetInput extends EnvironmentScopedInput, PaymentGetRequest {}
export interface PaymentCancelInput extends EnvironmentScopedInput, PaymentCancelRequest {}
export interface PayoutCreateInput extends EnvironmentScopedInput, PayoutCreateRequest {}
export interface PayoutGetInput extends EnvironmentScopedInput, PayoutGetRequest {}
export interface BalanceListInput extends BalanceListRequest {}

const RESERVED_CONTROL_FIELDS = new Set(["timestamp", "requestId", "sign", "headers"]);

function assertRecord(value: unknown, operation: string): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new McpRuntimeError("validation_error", `${operation} input must be an object.`);
  }

  return value as Record<string, unknown>;
}

function assertReservedFields(record: Record<string, unknown>, operation: string): void {
  for (const fieldName of RESERVED_CONTROL_FIELDS) {
    if (fieldName in record) {
      throw new McpRuntimeError(
        "validation_error",
        `${operation} must not include reserved control field "${fieldName}".`
      );
    }
  }
}

function readRequiredString(record: Record<string, unknown>, key: string, operation: string): string {
  const value = record[key];

  if (typeof value !== "string" || value.trim().length === 0) {
    throw new McpRuntimeError("validation_error", `${operation}.${key} must be a non-empty string.`);
  }

  return value;
}

function readOptionalString(record: Record<string, unknown>, key: string, operation: string): string | undefined {
  if (!(key in record) || record[key] === undefined || record[key] === null) {
    return undefined;
  }

  return readRequiredString(record, key, operation);
}

function readRequiredNumber(record: Record<string, unknown>, key: string, operation: string): number {
  const value = record[key];

  if (typeof value !== "number" || Number.isNaN(value) || value <= 0) {
    throw new McpRuntimeError("validation_error", `${operation}.${key} must be a positive number.`);
  }

  return value;
}

function readEnvironment(record: Record<string, unknown>): string | undefined {
  if (!("environment" in record) || record.environment === undefined || record.environment === null) {
    return undefined;
  }

  if (typeof record.environment !== "string" || record.environment.trim().length === 0) {
    throw new McpRuntimeError("validation_error", "environment must be a non-empty string.");
  }

  return record.environment;
}

export function parsePaymentCreateInput(input: unknown): PaymentCreateInput {
  const operation = "payment.create";
  const record = assertRecord(input, operation);
  assertReservedFields(record, operation);

  return {
    environment: readEnvironment(record),
    merchantOrderId: readRequiredString(record, "merchantOrderId", operation),
    merchantUserId: readRequiredString(record, "merchantUserId", operation),
    amount: readRequiredNumber(record, "amount", operation),
    currency: readRequiredString(record, "currency", operation),
    network: readRequiredString(record, "network", operation),
    returnUrl: readOptionalString(record, "returnUrl", operation),
    cancelUrl: readOptionalString(record, "cancelUrl", operation)
  };
}

export function parsePaymentGetInput(input: unknown): PaymentGetInput {
  const operation = "payment.get";
  const record = assertRecord(input, operation);
  assertReservedFields(record, operation);

  return {
    environment: readEnvironment(record),
    orderId: readRequiredString(record, "orderId", operation)
  };
}

export function parsePaymentCancelInput(input: unknown): PaymentCancelInput {
  const operation = "payment.cancel";
  const record = assertRecord(input, operation);
  assertReservedFields(record, operation);

  return {
    environment: readEnvironment(record),
    orderId: readRequiredString(record, "orderId", operation)
  };
}

export function parsePayoutCreateInput(input: unknown): PayoutCreateInput {
  const operation = "payout.create";
  const record = assertRecord(input, operation);
  assertReservedFields(record, operation);

  return {
    environment: readEnvironment(record),
    merchantOrderId: readRequiredString(record, "merchantOrderId", operation),
    merchantUserId: readRequiredString(record, "merchantUserId", operation),
    amount: readRequiredNumber(record, "amount", operation),
    currency: readRequiredString(record, "currency", operation),
    network: readRequiredString(record, "network", operation),
    withdrawAddress: readRequiredString(record, "withdrawAddress", operation)
  };
}

export function parsePayoutGetInput(input: unknown): PayoutGetInput {
  const operation = "payout.get";
  const record = assertRecord(input, operation);
  assertReservedFields(record, operation);

  return {
    environment: readEnvironment(record),
    orderId: readRequiredString(record, "orderId", operation)
  };
}

export function parseBalanceListInput(input: unknown): BalanceListInput {
  const operation = "balance.list";
  const record = assertRecord(input, operation);
  assertReservedFields(record, operation);
  const environment = readEnvironment(record);

  if (!environment) {
    throw new McpRuntimeError("validation_error", `${operation}.environment is required.`);
  }

  return {
    environment
  };
}

