type LogContext = Record<string, string | number | boolean | null | undefined>;

export function logEvent(event: string, context: LogContext = {}) {
  console.log(JSON.stringify({
    timestamp: new Date().toISOString(),
    event,
    ...context,
  }));
}

export function logError(event: string, error: unknown, context: LogContext = {}) {
  console.error(JSON.stringify({
    timestamp: new Date().toISOString(),
    event,
    error: error instanceof Error ? error.message : String(error),
    ...context,
  }));
}
