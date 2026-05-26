export function createRequestId(prefix = "req"): string {
  const timestamp = new Date().toISOString().replace(/[-:.TZ]/g, "");
  const randomPart = Math.random().toString(36).slice(2, 10);
  return `${prefix}-${timestamp}-${randomPart}`;
}

