export function logError(context: string, error: unknown): void {
  const name = error instanceof Error ? error.name : 'UnknownError';
  const code = typeof error === 'object' && error !== null && 'code' in error &&
    typeof error.code === 'string'
    ? error.code
    : undefined;
  console.error(`${context}: ${name}${code ? ` [${code}]` : ''}`);
}
