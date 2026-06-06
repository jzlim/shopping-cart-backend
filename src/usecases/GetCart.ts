import { createCart, type Cart } from '../domain/entities/Cart.js';
import type { CartRepository } from '../domain/repositories/CartRepository.js';

export type GetCartInput = {
  sessionId: string;
};

export type GetCart = {
  execute(input: GetCartInput): Promise<Cart>;
};

/**
 * Return the cart for a session. Carts are session-scoped and created lazily, so
 * "no cart yet" and "empty cart" are the same state to a caller — a fresh empty
 * cart is returned rather than a 404, keeping the endpoint idempotent.
 */
export const createGetCart = (carts: CartRepository): GetCart => ({
  async execute({ sessionId }): Promise<Cart> {
    return (await carts.findBySessionId(sessionId)) ?? createCart(sessionId);
  },
});
