# MCP Consumer Onboarding Design

## Goal

Define the next implementation slice for `TemarAIMCP` so external AI coding assistants can reliably connect to the MCP server with minimal guesswork.

The focus of this slice is:

- keep the MCP runtime thin
- make configuration explicit
- make startup reproducible
- make external client onboarding copy-paste friendly

This is an onboarding and runtime-entry design, not a business-capability expansion.

## Scope

This design covers:

- a canonical runtime configuration loading path
- public-facing repository documentation
- example environment-variable configuration
- example file-based configuration
- external MCP client connection examples
- startup validation and error clarity for local users

This design does not cover:

- new payment or payout business logic
- new capability tools
- settlement, ledger, fee, freeze, unfreeze, reconciliation, KYC, KYB, wallet, or chain-state workflows
- x402 or other protocol adapters

Those can be layered later on top of the same MCP foundation.

## Problem

The repository now has a working thin MCP runtime and a real stdio MCP protocol server, but it is still optimized for internal development rather than external consumer onboarding.

Current gaps:

- startup still depends on embedded fallback values
- there is no canonical public README for external users
- there is no `.env` example
- there is no file-based config example
- there are no ready-to-copy client configuration snippets

That means an external AI coding assistant user can inspect the codebase, but may still fail to connect correctly or may invent unsupported configuration patterns.

## Design Principles

### MCP stays thin

This repository remains:

- an MCP server
- a configuration adapter
- an auth adapter
- a capability router
- a client for existing Temar public APIs

It does not become:

- a payment engine
- a business-rule host
- a second public API platform

### Configuration should be explicit

External users should not need to infer:

- which variables are required
- how environments are selected
- whether sandbox and production can coexist
- how to point the server at a config file

### One runtime config shape

No matter whether the user configures the server through environment variables or a local JSON file, both should normalize into the same environment-first runtime config shape already used by the server core.

### Onboarding should be copy-paste friendly

A new user should be able to:

1. fill in credentials
2. copy one client config example
3. start the server
4. confirm `initialize` and `tools/list` work

## Recommended User Experience

The server should support two onboarding modes.

### Mode 1: Environment variables

This is the default and recommended path for most MCP client users.

The user sets environment variables such as:

- `TEMAR_MCP_DEFAULT_ENVIRONMENT`
- `TEMAR_MCP_SANDBOX_BASE_URL`
- `TEMAR_MCP_SANDBOX_API_KEY`
- `TEMAR_MCP_SANDBOX_SECRET_KEY`
- `TEMAR_MCP_SANDBOX_TIMEOUT_MS`
- `TEMAR_MCP_PRODUCTION_BASE_URL`
- `TEMAR_MCP_PRODUCTION_API_KEY`
- `TEMAR_MCP_PRODUCTION_SECRET_KEY`
- `TEMAR_MCP_PRODUCTION_TIMEOUT_MS`

The server reads these values at startup and assembles the runtime config.

### Mode 2: File-based configuration

This is the optional path for teams that prefer checked local templates or structured config management.

The user sets:

- `TEMAR_MCP_CONFIG=<absolute-or-relative-path>`

The pointed JSON file contains the canonical runtime config object:

```json
{
  "defaultEnvironment": "sandbox",
  "environments": {
    "sandbox": {
      "baseUrl": "https://sandbox.example.com",
      "apiKey": "sandbox-key",
      "secretKey": "sandbox-secret",
      "timeoutMs": 5000
    },
    "production": {
      "baseUrl": "https://api.example.com",
      "apiKey": "production-key",
      "secretKey": "production-secret",
      "timeoutMs": 5000
    }
  }
}
```

If `TEMAR_MCP_CONFIG` is present, the server should prefer the file input over environment assembly.

## Runtime Loading Design

Add one focused runtime source loader that sits above the existing config validation layer.

Recommended flow:

1. check whether `TEMAR_MCP_CONFIG` exists
2. if present, load and parse the JSON file
3. otherwise, assemble config from environment variables
4. pass the result into the existing runtime config validation path
5. fail fast with a clear, user-facing startup error when required values are missing

This layer should only transform configuration sources. It should not validate business inputs, call APIs, or sign requests.

## File Responsibilities

Recommended repository additions and updates:

- `README.md`
  public project overview, tool surface, prerequisites, startup guide, client examples
- `.env.example`
  environment-variable template for local users
- `config/runtime.config.example.json`
  example file-based runtime config
- `src/config/load-runtime-source.ts`
  load config from `TEMAR_MCP_CONFIG` or environment variables and return a plain raw config object
- `scripts/start-stdio-server.mjs`
  use the runtime source loader instead of hard-coded fallback config

If needed, `src/server/index.ts` can stay unchanged because the new source loader should normalize into the existing runtime contract before server creation.

## Configuration Contract

The canonical runtime config remains:

```json
{
  "defaultEnvironment": "sandbox",
  "environments": {
    "sandbox": {
      "baseUrl": "...",
      "apiKey": "...",
      "secretKey": "...",
      "timeoutMs": 5000
    },
    "production": {
      "baseUrl": "...",
      "apiKey": "...",
      "secretKey": "...",
      "timeoutMs": 5000
    }
  }
}
```

Rules:

- `defaultEnvironment` is required
- only configured environments should appear in `environments`
- each configured environment must contain `baseUrl`, `apiKey`, and `secretKey`
- `timeoutMs` may remain optional only if the existing validation layer already supports a default; otherwise it should be required in examples

## Startup and Error Behavior

Startup must stop immediately when required configuration is missing.

Examples of clear failures:

- missing `TEMAR_MCP_DEFAULT_ENVIRONMENT` when no config file is provided
- missing `baseUrl` or credentials for the selected environment
- unreadable `TEMAR_MCP_CONFIG` path
- invalid JSON in the config file

Error output should help the consumer fix the problem quickly without exposing secrets.

It is acceptable for startup errors to include:

- which source path was used
- which environment name is missing fields
- which variable name is required

It is not acceptable to print:

- `secretKey`
- signature values
- full auth headers

## Public Documentation Design

The repository README should explain the project in this order:

1. what this repository is
2. what it is not
3. supported tools
4. prerequisites
5. configuration methods
6. local startup
7. MCP client integration examples
8. troubleshooting

### Messaging

README language should reinforce these points:

- this MCP server calls existing Temar public APIs
- merchant and credential provisioning are prerequisites
- the server does not replace business onboarding or permissions setup
- signing is internal and should not be supplied by the MCP caller

## Client Integration Examples

The repository should ship copy-paste examples for at least:

- Claude Desktop style stdio MCP config
- Cursor/Cline style stdio MCP config
- a generic stdio MCP client example

Each example should show:

- command
- arguments
- working directory when relevant
- environment variables when relevant

Examples should avoid any fake production secrets. Use placeholders only.

## Testing Design

This slice should add focused tests for configuration-source loading.

Recommended coverage:

- config file path loads valid JSON
- invalid file path fails clearly
- invalid JSON fails clearly
- environment variables assemble the expected raw config shape
- missing required environment variables fail clearly

The existing runtime smoke and protocol smoke should still pass after the startup script is changed.

## Acceptance Criteria

This slice is complete when:

1. a new user can configure the server through environment variables only
2. a new user can configure the server through `TEMAR_MCP_CONFIG`
3. `npm` is not required for understanding usage; direct Node invocation is documented
4. README contains copy-paste client setup examples
5. startup no longer relies on embedded sample credentials
6. validation errors are actionable and secret-safe
7. existing MCP tools and runtime behavior remain thin and unchanged

## Risks and Non-Risks

### Main risk

The main risk is drifting from a thin adapter into a more opinionated runtime.

Mitigation:

- keep the new loader focused on source assembly only
- keep validation in the existing config layer
- do not add capability-specific logic in onboarding code

### Non-risk

This slice does not change:

- tool names
- payment/payout routing
- signing rules
- upstream public API paths

## Future Extensions

Once this onboarding slice is complete, the same pattern can support later additions such as:

- fiat capability routers
- diagnostics tools
- notification helpers
- x402 or other higher-level protocol adapters

Those should reuse the same runtime foundation rather than introducing separate connection logic.

## Bottom Line

The next step for `TemarAIMCP` should make the repository easy to connect from external AI coding assistants without changing its core role.

The result should be:

- thin
- configurable
- reproducible
- documented
- ready for external MCP client onboarding
