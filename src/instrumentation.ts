export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { validateEnv } = await import('@/lib/envCheck');
    validateEnv();

    const { reportError } = await import('@/lib/errorLogger');

    process.on('unhandledRejection', (reason) => {
      reportError(reason, 'unhandledRejection').catch(() => {});
    });

    process.on('uncaughtException', (err) => {
      reportError(err, 'uncaughtException').catch(() => {});
    });
  }
}
