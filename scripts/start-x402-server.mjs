#!/usr/bin/env node

/**
 * Start the X402 Protocol Adapter server.
 *
 * Reads configuration from the same runtime.config.json used by the
 * MCP STDIO server, plus an "x402" section for payment settings.
 *
 * Usage:
 *   node scripts/start-x402-server.mjs
 *   TEMAR_MCP_CONFIG=/path/to/config.json node scripts/start-x402-server.mjs
 */

import { readFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

// ── i18n messages ──────────────────────────────────────────────

const MSG = {
  "zh-CN": {
    noConfig: "未找到配置文件。请先运行 npm run setup 创建配置。",
    noX402: "配置文件中缺少 x402 部分。请运行 npm run setup 重新配置。",
    loading: "正在加载 X402 协议适配配置...",
    invalidConfig: "配置验证失败：",
  },
  "zh-TW": {
    noConfig: "未找到設定檔。請先執行 npm run setup 建立設定。",
    noX402: "設定檔中缺少 x402 區段。請執行 npm run setup 重新設定。",
    loading: "正在載入 X402 協議適配設定...",
    invalidConfig: "設定驗證失敗：",
  },
  en: {
    noConfig: "No config file found. Run npm run setup first.",
    noX402: "Config file is missing the x402 section. Run npm run setup to reconfigure.",
    loading: "Loading X402 Protocol Adapter config...",
    invalidConfig: "Config validation failed: ",
  },
};

function getMsg(lang) {
  return MSG[lang] ?? MSG.en;
}

// ── Config loading ─────────────────────────────────────────────

function findConfigPath() {
  const envPath = process.env.TEMAR_MCP_CONFIG;
  if (envPath && existsSync(envPath)) return envPath;

  const defaultPath = resolve(__dirname, "..", "config", "runtime.config.json");
  if (existsSync(defaultPath)) return defaultPath;

  return null;
}

function loadConfig() {
  const configPath = findConfigPath();
  const lang = process.env.LANG?.startsWith("zh_TW") ? "zh-TW"
    : process.env.LANG?.startsWith("zh") ? "zh-CN"
    : "en";
  const msg = getMsg(lang);

  if (!configPath) {
    console.error(`\n  ❌ ${msg.noConfig}\n`);
    process.exit(1);
  }

  const raw = JSON.parse(readFileSync(configPath, "utf-8"));
  const language = raw.language ?? lang;

  if (!raw.x402) {
    const m = getMsg(language);
    console.error(`\n  ❌ ${m.noX402}\n`);
    process.exit(1);
  }

  return { raw, language, configPath };
}

// ── Main ───────────────────────────────────────────────────────

async function main() {
  const { raw, language } = loadConfig();
  const msg = getMsg(language);

  console.log(`  ℹ️  ${msg.loading}`);

  // Dynamic import for TypeScript source (Node 24+ --experimental-strip-types)
  const { validateRuntimeConfig } = await import("../src/config/config-schema.ts");
  const { validateX402Config, startX402Server } = await import("../src/x402/index.ts");

  let runtimeConfig;
  try {
    runtimeConfig = validateRuntimeConfig(raw);
  } catch (err) {
    console.error(`\n  ❌ ${msg.invalidConfig}${err.message}\n`);
    process.exit(1);
  }

  const x402Config = validateX402Config(runtimeConfig, language, raw.x402);

  await startX402Server(x402Config);
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
