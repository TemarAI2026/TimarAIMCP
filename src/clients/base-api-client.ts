import { McpRuntimeError } from "../errors/error-types.ts";
import { buildSignedHeaders } from "../auth/header-builder.ts";
import { serializeJsonBody } from "../utils/json.ts";
import type { ApiExecutionResult, PublicApiResponse, RuntimeEnvironmentConfig } from "../models/public-api-types.ts";
import type { Logger } from "../utils/logging.ts";
import { consoleLogger } from "../utils/logging.ts";

export interface BaseApiClientDependencies {
  fetchImplementation?: typeof fetch;
  logger?: Logger;
}

export class BaseApiClient {
  private readonly fetchImplementation: typeof fetch;
  private readonly logger: Logger;

  constructor(dependencies: BaseApiClientDependencies = {}) {
    this.fetchImplementation = dependencies.fetchImplementation ?? fetch;
    this.logger = dependencies.logger ?? consoleLogger;
  }

  protected async request<TData>(params: {
    environment: RuntimeEnvironmentConfig;
    method: "GET" | "POST";
    path: string;
    body?: unknown;
  }): Promise<ApiExecutionResult<TData>> {
    const rawBody = serializeJsonBody(params.body);
    const { headers, requestId } = buildSignedHeaders({
      apiKey: params.environment.apiKey,
      secretKey: params.environment.secretKey,
      rawBody
    });

    const url = new URL(params.path, ensureTrailingSlash(params.environment.baseUrl)).toString();
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), params.environment.timeoutMs);

    try {
      this.logger.debug("Executing outbound Timar API request.", {
        environment: params.environment.name,
        method: params.method,
        path: params.path,
        requestId
      });

      const response = await this.fetchImplementation(url, {
        method: params.method,
        headers,
        body: rawBody,
        signal: controller.signal
      });

      const text = await response.text();
      const parsed = JSON.parse(text) as PublicApiResponse<TData>;

      if (
        typeof parsed.code !== "string" ||
        typeof parsed.msg !== "string" ||
        !Object.prototype.hasOwnProperty.call(parsed, "data")
      ) {
        throw new McpRuntimeError("transport_error", "Public API response wrapper is invalid.", requestId);
      }

      return {
        environment: params.environment.name,
        requestId,
        response: parsed
      };
    } catch (error) {
      if (error instanceof McpRuntimeError) {
        throw error;
      }

      if (error instanceof Error) {
        throw new McpRuntimeError("transport_error", error.message, requestId, { cause: error });
      }

      throw new McpRuntimeError("transport_error", "Unknown HTTP execution failure.", requestId);
    } finally {
      clearTimeout(timeout);
    }
  }
}

function ensureTrailingSlash(baseUrl: string): string {
  return baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
}

