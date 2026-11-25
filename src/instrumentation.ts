export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs' && process.env.DD_TRACE_ENABLED !== 'false') {
    await import('../datadog');
  }
}
