export const runtimeConfigFixture = {
  defaultEnvironment: "sandbox",
  environments: {
    sandbox: {
      baseUrl: "https://sandbox.example.com",
      apiKey: "sandbox-key",
      secretKey: "sandbox-secret",
      timeoutMs: 5000
    },
    production: {
      baseUrl: "https://production.example.com",
      apiKey: "production-key",
      secretKey: "production-secret",
      timeoutMs: 5000
    }
  }
};

