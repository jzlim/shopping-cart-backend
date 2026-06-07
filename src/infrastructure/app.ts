import express, { type Express, type RequestHandler } from 'express';
import { createContainer } from './container.js';
import { createCartRouter } from './routes.js';
import { createErrorHandler, notFoundHandler } from './errorHandler.js';
import { createLogger, type Logger } from './logger.js';

export type AppOptions = {
  logger?: Logger;
};

/** Log one structured line per request once the response is finished. */
const requestLogger =
  (logger: Logger): RequestHandler =>
  (req, res, next) => {
    const start = process.hrtime.bigint();
    res.on('finish', () => {
      const durationMs = Number(process.hrtime.bigint() - start) / 1e6;
      logger.info(
        {
          method: req.method,
          path: req.originalUrl,
          status: res.statusCode,
          durationMs: Math.round(durationMs),
        },
        'request',
      );
    });
    next();
  };

/**
 * Build the Express application. Separated from `server.ts` (the listen call) so
 * the app can be exercised in-process by supertest without binding a port. A
 * logger may be injected; tests pass a silent one to keep output clean.
 */
export const createApp = (options: AppOptions = {}): Express => {
  const logger = options.logger ?? createLogger('info');
  const app = express();
  app.use(express.json());
  app.use(requestLogger(logger));

  const { cartController } = createContainer();

  app.get('/health', (_req, res) => {
    res.status(200).json({ status: 'ok' });
  });

  app.use('/api/cart', createCartRouter(cartController));

  app.use(notFoundHandler);
  app.use(createErrorHandler(logger));

  return app;
};
