#!/usr/bin/env node

/**
 * Timar AI MCP - Interactive Setup Wizard (i18n)
 *
 * Step 1: Choose language (简体中文 / 繁體中文 / English)
 * Step 2: Choose environment (sandbox / production / both)
 * Step 3: Enter domain, API Key, Secret Key
 * Step 4: Set timeout
 * Step 5: Configure X402 payment adapter (optional)
 * Step 6: Save configuration
 * Step 7: Print AI client integration snippet
 */

import { writeFileSync, mkdirSync, existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { createInterface } from "node:readline";

// ─── Colors ─────────────────────────────────────────────────────

const CYAN = "\x1b[36m";
const GREEN = "\x1b[32m";
const YELLOW = "\x1b[33m";
const RED = "\x1b[31m";
const BOLD = "\x1b[1m";
const DIM = "\x1b[2m";
const RESET = "\x1b[0m";

function log(msg) {
  process.stdout.write(`${msg}\n`);
}

function question(rl, prompt, defaultValue) {
  return new Promise((resolve) => {
    const suffix = defaultValue ? ` [${defaultValue}]` : "";
    rl.question(`${CYAN}  ❯ ${prompt}${suffix}: ${RESET}`, (answer) => {
      resolve(answer.trim() || defaultValue || "");
    });
  });
}

function questionSecret(rl, prompt) {
  return new Promise((resolve) => {
    process.stdout.write(`${CYAN}  ❯ ${prompt}: ${RESET}`);

    const stdin = process.stdin;
    const wasRaw = stdin.isRaw;

    if (stdin.isTTY) {
      stdin.setRawMode(true);
    }

    let value = "";

    const onData = (ch) => {
      const c = ch.toString();

      if (c === "\n" || c === "\r") {
        if (stdin.isTTY) {
          stdin.setRawMode(wasRaw ?? false);
        }
        stdin.removeListener("data", onData);
        process.stdout.write("\n");
        resolve(value);
      } else if (c === "\u007f" || c === "\b") {
        if (value.length > 0) {
          value = value.slice(0, -1);
          process.stdout.write("\b \b");
        }
      } else if (c === "\u0003") {
        process.stdout.write("\n");
        process.exit(1);
      } else {
        value += c;
        process.stdout.write("*");
      }
    };

    stdin.on("data", onData);
  });
}

async function choose(rl, prompt, options, t) {
  log("");
  log(`${BOLD}${prompt}${RESET}`);
  options.forEach((opt, i) => {
    log(`  ${GREEN}${i + 1}${RESET}. ${opt.label}`);
  });

  const answer = await question(rl, t.selectNumber, "1");
  const index = parseInt(answer, 10) - 1;

  if (index >= 0 && index < options.length) {
    return options[index].value;
  }

  return options[0].value;
}

// ─── i18n ───────────────────────────────────────────────────────

const i18n = {
  "zh-CN": {
    langName: "简体中文",
    banner: [
      "  ╔══════════════════════════════════════════╗",
      "  ║                                          ║",
      "  ║       🚀 Timar AI MCP 配置向导          ║",
      "  ║                                          ║",
      "  ║   接下来将引导你完成 MCP 服务器配置     ║",
      "  ║   大约需要 2 分钟                        ║",
      "  ║                                          ║",
      "  ╚══════════════════════════════════════════╝",
    ],
    stepLanguage: "🌍 步骤 1/7：选择语言 / Select Language",
    stepEnv: "📡 步骤 2/7：选择要配置的环境",
    stepDefaultEnv: "📡 步骤 3/7：默认使用哪个环境？",
    envSandbox: "Sandbox（沙箱测试环境）— 推荐先配置这个",
    envProduction: "Production（生产环境）",
    envBoth: "两个都配置（Sandbox + Production）",
    envRecommended: "（推荐）",
    configSection: (envName) => `── 配置 ${envName} 环境 ──`,
    configHint: (envName) => `请输入你的 Timar ${envName} 环境信息`,
    domainPrompt: (envName) => `🌐 ${envName} API 域名`,
    apiKeyPrompt: (envName) => `🔑 ${envName} API Key`,
    secretKeyPrompt: (envName) => `🔐 ${envName} Secret Key`,
    timeoutPrompt: "⏱️  请求超时 (毫秒)",
    apiKeyRequired: "⚠️  API Key 不能为空，请重新输入",
    secretKeyRequired: "⚠️  Secret Key 不能为空，请重新输入",
    configSaved: "✅ 配置完成！",
    configPath: "📋 配置文件已保存到：",
    nextStepTitle: [
      "  ╔══════════════════════════════════════════╗",
      "  ║     下一步：配置你的 AI 客户端          ║",
      "  ╚══════════════════════════════════════════╝",
    ],
    claudeDesktop: "📱 Claude Desktop",
    configFileLocation: "配置文件位置：",
    cursor: "🖥️ Cursor",
    quickTest: "🧪 快速测试",
    usageTips: "💡 使用提示",
    usageTipIntro: "配置好 AI 客户端后，你可以这样使用：",
    usageExamples: [
      '• "帮我创建一个 100 USDT 的支付订单"',
      '• "查询 sandbox 环境的余额"',
      '• "取消订单 pay_abc123"',
    ],
    selectNumber: "请选择 (输入数字)",
    setupFailed: "配置失败",
    stepX402: "💳 步骤 4/7：是否配置 X402 支付协议适配？",
    x402Yes: "是，配置 X402（让 AI Agent 用稳定币按次付费调用 API）",
    x402No: "跳过，暂不需要",
    x402PayTo: "💰 收款钱包地址（EVM 或 Solana）",
    x402PayToRequired: "⚠️  钱包地址不能为空",
    x402Facilitator: "🔗 Facilitator 服务地址",
    x402Port: "🌐 HTTP 服务端口",
    x402Networks: "📡 支持的支付网络",
    x402NetworkBase: "Base（推荐，低 gas）",
    x402NetworkEthereum: "Ethereum",
    x402NetworkSolana: "Solana",
    x402Saved: "✅ X402 支付适配配置完成！",
    x402Skipped: "⏭️  跳过 X402 配置",
    stepTimeout: "⏱️  步骤 5/7：请求超时设置",
  },

  "zh-TW": {
    langName: "繁體中文",
    banner: [
      "  ╔══════════════════════════════════════════╗",
      "  ║                                          ║",
      "  ║       🚀 Timar AI MCP 設定精靈          ║",
      "  ║                                          ║",
      "  ║   接下來將引導你完成 MCP 伺服器設定     ║",
      "  ║   大約需要 2 分鐘                        ║",
      "  ║                                          ║",
      "  ╚══════════════════════════════════════════╝",
    ],
    stepLanguage: "🌍 步驟 1/7：選擇語言 / Select Language",
    stepEnv: "📡 步驟 2/7：選擇要設定的環境",
    stepDefaultEnv: "📡 步驟 3/7：預設使用哪個環境？",
    envSandbox: "Sandbox（沙箱測試環境）— 建議先設定這個",
    envProduction: "Production（正式環境）",
    envBoth: "兩個都設定（Sandbox + Production）",
    envRecommended: "（建議）",
    configSection: (envName) => `── 設定 ${envName} 環境 ──`,
    configHint: (envName) => `請輸入你的 Timar ${envName} 環境資訊`,
    domainPrompt: (envName) => `🌐 ${envName} API 網域`,
    apiKeyPrompt: (envName) => `🔑 ${envName} API Key`,
    secretKeyPrompt: (envName) => `🔐 ${envName} Secret Key`,
    timeoutPrompt: "⏱️  請求逾時 (毫秒)",
    apiKeyRequired: "⚠️  API Key 不能為空，請重新輸入",
    secretKeyRequired: "⚠️  Secret Key 不能為空，請重新輸入",
    configSaved: "✅ 設定完成！",
    configPath: "📋 設定檔已儲存到：",
    nextStepTitle: [
      "  ╔══════════════════════════════════════════╗",
      "  ║     下一步：設定你的 AI 用戶端          ║",
      "  ╚══════════════════════════════════════════╝",
    ],
    claudeDesktop: "📱 Claude Desktop",
    configFileLocation: "設定檔位置：",
    cursor: "🖥️ Cursor",
    quickTest: "🧪 快速測試",
    usageTips: "💡 使用提示",
    usageTipIntro: "設定好 AI 用戶端後，你可以這樣使用：",
    usageExamples: [
      '• "幫我建立一個 100 USDT 的付款訂單"',
      '• "查詢 sandbox 環境的餘額"',
      '• "取消訂單 pay_abc123"',
    ],
    selectNumber: "請選擇 (輸入數字)",
    setupFailed: "設定失敗",
    stepX402: "💳 步驟 4/7：是否設定 X402 支付協議適配？",
    x402Yes: "是，設定 X402（讓 AI Agent 用穩定幣按次付費呼叫 API）",
    x402No: "跳過，暫時不需要",
    x402PayTo: "💰 收款錢包地址（EVM 或 Solana）",
    x402PayToRequired: "⚠️  錢包地址不能為空",
    x402Facilitator: "🔗 Facilitator 服務地址",
    x402Port: "🌐 HTTP 服務連接埠",
    x402Networks: "📡 支援的支付網路",
    x402NetworkBase: "Base（建議，低 gas）",
    x402NetworkEthereum: "Ethereum",
    x402NetworkSolana: "Solana",
    x402Saved: "✅ X402 支付適配設定完成！",
    x402Skipped: "⏭️  跳過 X402 設定",
    stepTimeout: "⏱️  步驟 5/7：請求逾時設定",
  },

  "en": {
    langName: "English",
    banner: [
      "  ╔══════════════════════════════════════════╗",
      "  ║                                          ║",
      "  ║       🚀 Timar AI MCP Setup Wizard      ║",
      "  ║                                          ║",
      "  ║   This wizard will guide you through     ║",
      "  ║   MCP server configuration (~2 min)      ║",
      "  ║                                          ║",
      "  ╚══════════════════════════════════════════╝",
    ],
    stepLanguage: "🌍 Step 1/7: Choose Language / 选择语言",
    stepEnv: "📡 Step 2/7: Choose environment to configure",
    stepDefaultEnv: "📡 Step 3/7: Which environment should be default?",
    envSandbox: "Sandbox (Test environment) — Recommended to start",
    envProduction: "Production (Live environment)",
    envBoth: "Both (Sandbox + Production)",
    envRecommended: " (Recommended)",
    configSection: (envName) => `── Configure ${envName} Environment ──`,
    configHint: (envName) => `Enter your Timar ${envName} environment details`,
    domainPrompt: (envName) => `🌐 ${envName} API Domain`,
    apiKeyPrompt: (envName) => `🔑 ${envName} API Key`,
    secretKeyPrompt: (envName) => `🔐 ${envName} Secret Key`,
    timeoutPrompt: "⏱️  Request timeout (ms)",
    apiKeyRequired: "⚠️  API Key is required, please re-enter",
    secretKeyRequired: "⚠️  Secret Key is required, please re-enter",
    configSaved: "✅ Configuration complete!",
    configPath: "📋 Config file saved to:",
    nextStepTitle: [
      "  ╔══════════════════════════════════════════╗",
      "  ║     Next Step: Configure AI Client       ║",
      "  ╚══════════════════════════════════════════╝",
    ],
    claudeDesktop: "📱 Claude Desktop",
    configFileLocation: "Config file location:",
    cursor: "🖥️ Cursor",
    quickTest: "🧪 Quick Test",
    usageTips: "💡 Usage Tips",
    usageTipIntro: "After configuring your AI client, you can use it like this:",
    usageExamples: [
      '• "Create a payment order for 100 USDT"',
      '• "Check sandbox environment balances"',
      '• "Cancel order pay_abc123"',
    ],
    selectNumber: "Select (enter number)",
    setupFailed: "Setup failed",
    stepX402: "💳 Step 4/7: Configure X402 payment protocol adapter?",
    x402Yes: "Yes, configure X402 (let AI Agents pay per API call with stablecoins)",
    x402No: "Skip, not needed now",
    x402PayTo: "💰 Wallet address to receive payments (EVM or Solana)",
    x402PayToRequired: "⚠️  Wallet address is required",
    x402Facilitator: "🔗 Facilitator service URL",
    x402Port: "🌐 HTTP server port",
    x402Networks: "📡 Supported payment networks",
    x402NetworkBase: "Base (Recommended, low gas)",
    x402NetworkEthereum: "Ethereum",
    x402NetworkSolana: "Solana",
    x402Saved: "✅ X402 payment adapter configured!",
    x402Skipped: "⏭️  X402 configuration skipped",
    stepTimeout: "⏱️  Step 5/7: Request timeout settings",
  },
};

// ─── Step 1: Choose Language ─────────────────────────────────────

async function stepChooseLanguage(rl) {
  const lang = await choose(rl, i18n["zh-CN"].stepLanguage, [
    { value: "zh-CN", label: `简体中文` },
    { value: "zh-TW", label: `繁體中文` },
    { value: "en", label: `English` },
  ], i18n["zh-CN"]);

  return lang;
}

// ─── Step 2: Choose environments ────────────────────────────────

async function stepChooseEnvironments(rl, t) {
  const mode = await choose(rl, t.stepEnv, [
    { value: "sandbox", label: t.envSandbox },
    { value: "production", label: t.envProduction },
    { value: "both", label: t.envBoth },
  ], t);

  return mode;
}

// ─── Step 3: Configure environment ──────────────────────────────

async function stepConfigureEnvironment(rl, envName, t) {
  log("");
  log(`${BOLD}${YELLOW}  ${t.configSection(envName)}${RESET}`);
  log(`${DIM}  ${t.configHint(envName)}${RESET}`);
  log("");

  const defaultDomain =
    envName === "Sandbox"
      ? "https://sandbox-api.temar.ai"
      : "https://api.temar.ai";

  const baseUrl = await question(rl, t.domainPrompt(envName), defaultDomain);

  const apiKey = await questionSecret(rl, t.apiKeyPrompt(envName));

  if (!apiKey) {
    log(`${YELLOW}  ${t.apiKeyRequired}${RESET}`);
    return stepConfigureEnvironment(rl, envName, t);
  }

  const secretKey = await questionSecret(rl, t.secretKeyPrompt(envName));

  if (!secretKey) {
    log(`${YELLOW}  ${t.secretKeyRequired}${RESET}`);
    return stepConfigureEnvironment(rl, envName, t);
  }

  const timeoutMs = await question(rl, t.timeoutPrompt, "5000");

  return {
    baseUrl,
    apiKey,
    secretKey,
    timeoutMs: parseInt(timeoutMs, 10) || 5000,
  };
}

// ─── Step 4: Default environment ────────────────────────────────

async function stepDefaultEnvironment(rl, availableEnvs, t) {
  if (availableEnvs.length === 1) {
    return availableEnvs[0];
  }

  const options = availableEnvs.map((env) => ({
    value: env,
    label: `${env}${env === "sandbox" ? t.envRecommended : ""}`,
  }));

  return choose(rl, t.stepDefaultEnv, options, t);
}

// ─── Step 4: X402 Configuration (optional) ──────────────────────

async function stepConfigureX402(rl, t) {
  const wantX402 = await choose(rl, t.stepX402, [
    { value: "yes", label: t.x402Yes },
    { value: "no", label: t.x402No },
  ], t);

  if (wantX402 === "no") {
    log(`${DIM}  ${t.x402Skipped}${RESET}`);
    return null;
  }

  log("");
  log(`${BOLD}${YELLOW}  ── X402 Payment Configuration ──${RESET}`);
  log("");

  const payTo = await question(rl, t.x402PayTo, "");
  if (!payTo) {
    log(`${YELLOW}  ${t.x402PayToRequired}${RESET}`);
    return stepConfigureX402(rl, t);
  }

  const facilitatorUrl = await question(rl, t.x402Facilitator, "https://facilitator.x402.org");
  const port = await question(rl, t.x402Port, "3402");

  const networkChoice = await choose(rl, t.x402Networks, [
    { value: "base", label: t.x402NetworkBase },
    { value: "ethereum", label: t.x402NetworkEthereum },
    { value: "solana", label: t.x402NetworkSolana },
    { value: "all", label: `Base + Ethereum + Solana` },
  ], t);

  const networks = networkChoice === "all"
    ? ["base", "ethereum", "solana"]
    : [networkChoice];

  log(`${GREEN}  ${t.x402Saved}${RESET}`);

  return {
    payTo,
    facilitatorUrl,
    port: parseInt(port, 10) || 3402,
    networks,
  };
}

// ─── Step 5: Save config ───────────────────────────────────────

function stepSaveConfig(config, configDir) {
  const configPath = join(configDir, "runtime.config.json");

  if (!existsSync(configDir)) {
    mkdirSync(configDir, { recursive: true });
  }

  writeFileSync(configPath, JSON.stringify(config, null, 2), "utf-8");

  return configPath;
}

// ─── Step 6: Print integration snippet ──────────────────────────

function stepPrintIntegration(configPath, t) {
  const absolutePath = resolve(configPath);
  const scriptDir = resolve(configPath, "..", "..", "scripts");
  const startScript = join(scriptDir, "start-stdio-server.mjs").replace(/\\/g, "/");
  const configPathJson = absolutePath.replace(/\\/g, "/");

  log("");
  log(`${GREEN}${BOLD}  ${t.configSaved}${RESET}`);
  log("");
  log(`${BOLD}  ${t.configPath}${RESET}`);
  log(`     ${absolutePath}`);
  log("");

  t.nextStepTitle.forEach((line) => log(`${BOLD}${CYAN}${line}${RESET}`));
  log("");

  // Claude Desktop
  log(`${BOLD}  ${t.claudeDesktop}${RESET}`);
  log(`${DIM}  ${t.configFileLocation}${RESET}`);
  log(`${DIM}  macOS: ~/Library/Application Support/Claude/claude_desktop_config.json${RESET}`);
  log(`${DIM}  Windows: %APPDATA%\\Claude\\claude_desktop_config.json${RESET}`);
  log("");
  log(`  \`\`\`json`);
  log(`  {`);
  log(`    "mcpServers": {`);
  log(`      "timar-ai": {`);
  log(`        "command": "node",`);
  log(`        "args": ["${startScript}"],`);
  log(`        "env": {`);
  log(`          "TIMAR_MCP_CONFIG": "${configPathJson}"`);
  log(`        }`);
  log(`      }`);
  log(`    }`);
  log(`  }`);
  log(`  \`\`\``);
  log("");

  // Cursor
  log(`${BOLD}  ${t.cursor}${RESET}`);
  log(`${DIM}  .cursor/mcp.json${RESET}`);
  log("");
  log(`  \`\`\`json`);
  log(`  {`);
  log(`    "mcpServers": {`);
  log(`      "timar-ai": {`);
  log(`        "command": "node",`);
  log(`        "args": ["${startScript}"],`);
  log(`        "env": {`);
  log(`          "TIMAR_MCP_CONFIG": "${configPathJson}"`);
  log(`        }`);
  log(`      }`);
  log(`    }`);
  log(`  }`);
  log(`  \`\`\``);
  log("");

  // Quick test
  log(`${BOLD}  ${t.quickTest}${RESET}`);
  log(`  \`\`\`bash`);
  log(`  TIMAR_MCP_CONFIG="${configPathJson}" node scripts/start-stdio-server.mjs`);
  log(`  \`\`\``);
  log("");

  // Usage tips
  log(`${BOLD}  ${t.usageTips}${RESET}`);
  log(`  ${t.usageTipIntro}`);
  log("");
  t.usageExamples.forEach((ex) => log(`  ${DIM}${ex}${RESET}`));
  log("");
}

// ─── Main ───────────────────────────────────────────────────────

async function main() {
  const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  try {
    // Step 1: Choose language FIRST
    const lang = await stepChooseLanguage(rl);
    const t = i18n[lang];

    // Now print banner in the selected language
    log("");
    t.banner.forEach((line) => log(`${CYAN}${BOLD}${line}${RESET}`));
    log("");

    // Step 2: Choose environments
    const envMode = await stepChooseEnvironments(rl, t);

    // Step 3: Configure each environment
    const environments = {};
    const envNames = [];

    if (envMode === "sandbox" || envMode === "both") {
      environments.sandbox = await stepConfigureEnvironment(rl, "Sandbox", t);
      envNames.push("sandbox");
    }

    if (envMode === "production" || envMode === "both") {
      environments.production = await stepConfigureEnvironment(rl, "Production", t);
      envNames.push("production");
    }

    // Step 4: Default environment
    const defaultEnvironment = await stepDefaultEnvironment(rl, envNames, t);

    // Step 4: Configure X402 (optional)
    const x402Config = await stepConfigureX402(rl, t);

    // Step 5: Save config (includes language preference)
    const projectDir = resolve(import.meta.dirname, "..");
    const configDir = join(projectDir, "config");
    const config = {
      language: lang,
      defaultEnvironment,
      environments,
    };

    if (x402Config) {
      config.x402 = x402Config;
    }

    const configPath = stepSaveConfig(config, configDir);

    // Step 6: Print integration snippet
    stepPrintIntegration(configPath, t);
  } finally {
    rl.close();
  }
}

main().catch((error) => {
  log("");
  log(`❌ Setup failed: ${error.message}`);
  log("");
  process.exit(1);
});
