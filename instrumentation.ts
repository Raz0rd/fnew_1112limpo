/**
 * Instrumentation - Executado ao iniciar o servidor Next.js
 * https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 */

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { checkEnvironmentVariables } = await import('./lib/env-check')
    checkEnvironmentVariables()
  }
}
