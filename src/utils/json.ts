export function serializeJsonBody(body: unknown): string | undefined {
  if (body === undefined || body === null) {
    return undefined;
  }

  return JSON.stringify(body);
}

