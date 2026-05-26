import { loadConfigFromObject } from "../config/config-loader.ts";
import { registerTools } from "./register-tools.ts";
import type { RuntimeConfig } from "../models/public-api-types.ts";
import type { ToolDefinition } from "../models/tool-outputs.ts";
import type { BaseApiClientDependencies } from "../clients/base-api-client.ts";

export interface McpServerRuntime {
  config: RuntimeConfig;
  tools: ToolDefinition[];
  diagnostics: {
    toolNames: string[];
    environmentNames: string[];
  };
}

export function createServerRuntime(
  rawConfig: unknown,
  dependencies: BaseApiClientDependencies = {}
): McpServerRuntime {
  const config = loadConfigFromObject(rawConfig);
  const tools = registerTools(config, dependencies);

  return {
    config,
    tools,
    diagnostics: {
      toolNames: tools.map((tool) => tool.name),
      environmentNames: Object.keys(config.environments)
    }
  };
}

export function ensureRuntimeStarts(rawConfig: unknown): McpServerRuntime {
  return createServerRuntime(rawConfig);
}
