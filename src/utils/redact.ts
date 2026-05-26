const SECRET_PATTERNS = ["secretKey", "x-api-sign", "signature"];

export function redactSecrets(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => redactSecrets(item));
  }

  if (value && typeof value === "object") {
    const redacted: Record<string, unknown> = {};

    for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
      const lowerKey = key.toLowerCase();
      redacted[key] = SECRET_PATTERNS.some((pattern) => lowerKey.includes(pattern))
        ? "[REDACTED]"
        : redactSecrets(child);
    }

    return redacted;
  }

  return value;
}

