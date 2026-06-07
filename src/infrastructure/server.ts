import { createApp } from './app.js';
import { loadConfig } from './config.js';
import { createLogger } from './logger.js';

const config = loadConfig();
const logger = createLogger(config.LOG_LEVEL);

const app = createApp({ logger });
const server = app.listen(config.PORT, () => {
  logger.info(
    { port: config.PORT, env: config.NODE_ENV },
    'Shopping cart API listening',
  );
});

/**
 * Graceful shutdown: on SIGTERM/SIGINT, stop accepting new connections and let
 * in-flight requests drain before exiting. A timeout guards against hung
 * connections so an orchestrator's SIGKILL is never what stops us. ECS/Kubernetes
 * send SIGTERM, so honouring it avoids dropping requests mid-deploy.
 */
const SHUTDOWN_TIMEOUT_MS = 10_000;

const shutdown = (signal: string): void => {
  logger.info({ signal }, 'Shutting down');
  server.close((err) => {
    if (err) {
      logger.error({ err }, 'Error during shutdown');
      process.exit(1);
    }
    logger.info('Closed remaining connections, exiting');
    process.exit(0);
  });

  setTimeout(() => {
    logger.error('Shutdown timed out, forcing exit');
    process.exit(1);
  }, SHUTDOWN_TIMEOUT_MS).unref();
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
