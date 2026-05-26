import { createServerRuntime } from "../src/server/index.ts";

const runtime = createServerRuntime({
  defaultEnvironment: "sandbox",
  environments: {
    sandbox: {
      baseUrl: "https://sandbox.example.com",
      apiKey: "sandbox-key",
      secretKey: "sandbox-secret",
      timeoutMs: 5000
    }
  }
});

console.log(JSON.stringify(runtime.diagnostics, null, 2));
