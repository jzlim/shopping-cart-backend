import express, { type Express } from 'express';
import { createContainer } from './container.js';
import { createCartRouter } from './routes.js';
import { errorHandler, notFoundHandler } from './errorHandler.js';

/**
 * Build the Express application. Separated from `server.ts` (the listen call) so
 * the app can be exercised in-process by supertest without binding a port.
 */
export const createApp = (): Express => {
  const app = express();
  app.use(express.json());

  const { cartController } = createContainer();

  app.get('/health', (_req, res) => {
    res.status(200).json({ status: 'ok' });
  });

  app.use('/api/cart', createCartRouter(cartController));

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
};
