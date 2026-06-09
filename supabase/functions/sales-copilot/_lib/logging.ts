/**
 * Logger padronizado para edges.
 */
export function logEdgeError(
  functionName: string,
  error: unknown,
  context?: Record<string, unknown>,
): void {
  const msg = error instanceof Error ? error.message : String(error);
  const stack = error instanceof Error ? error.stack : undefined;
  console.error(
    `[${functionName}] ERROR: ${msg}`,
    context ? { context } : "",
    stack ? `\n${stack}` : "",
  );
}

export function logEdgeInfo(
  functionName: string,
  message: string,
  context?: Record<string, unknown>,
): void {
  console.log(`[${functionName}] ${message}`, context ?? "");
}

export function logEdgeWarn(
  functionName: string,
  message: string,
  context?: Record<string, unknown>,
): void {
  console.warn(`[${functionName}] ${message}`, context ?? "");
}
