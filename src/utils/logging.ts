import { redactSecrets } from "./redact.ts";

export interface Logger {
  debug(message: string, meta?: Record<string, unknown>): void;
  info(message: string, meta?: Record<string, unknown>): void;
  error(message: string, meta?: Record<string, unknown>): void;
}

export const consoleLogger: Logger = {
  debug(message, meta) {
    console.debug(message, meta ? redactSecrets(meta) : undefined);
  },
  info(message, meta) {
    console.info(message, meta ? redactSecrets(meta) : undefined);
  },
  error(message, meta) {
    console.error(message, meta ? redactSecrets(meta) : undefined);
  }
};

