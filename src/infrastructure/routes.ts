import { Router } from 'express';
import type { CartController } from '../adapters/controllers/CartController.js';
import {
  addItemBodySchema,
  itemParamsSchema,
  sessionIdParamSchema,
} from './schemas.js';

/**
 * Express wiring. This is the only place that reads `req` and writes `res`.
 * Routes parse + validate input with Zod, hand a typed object to the
 * framework-agnostic controller, and serialise the returned DTO. Express 5
 * forwards rejected promises to the error middleware automatically, so thrown
 * domain errors need no try/catch here.
 */
export const createCartRouter = (controller: CartController): Router => {
  const router = Router();

  // POST /api/cart/:sessionId/items — add product to cart
  router.post('/:sessionId/items', async (req, res) => {
    const { sessionId } = sessionIdParamSchema.parse(req.params);
    const body = addItemBodySchema.parse(req.body);
    const cart = await controller.addItem({ sessionId, ...body });
    res.status(201).json(cart);
  });

  // GET /api/cart/:sessionId — get cart contents
  router.get('/:sessionId', async (req, res) => {
    const { sessionId } = sessionIdParamSchema.parse(req.params);
    const cart = await controller.getCart({ sessionId });
    res.status(200).json(cart);
  });

  // POST /api/cart/:sessionId/checkout — checkout cart
  router.post('/:sessionId/checkout', async (req, res) => {
    const { sessionId } = sessionIdParamSchema.parse(req.params);
    const result = await controller.checkout({ sessionId });
    res.status(200).json(result);
  });

  // DELETE /api/cart/:sessionId/items/:itemId — remove item (itemId === productId)
  router.delete('/:sessionId/items/:itemId', async (req, res) => {
    const { sessionId, itemId } = itemParamsSchema.parse(req.params);
    const cart = await controller.removeItem({ sessionId, productId: itemId });
    res.status(200).json(cart);
  });

  return router;
};
