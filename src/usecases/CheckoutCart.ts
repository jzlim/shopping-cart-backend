import { checkoutCart, createCart } from '../domain/entities/Cart.js';
import type { CheckoutResult } from '../domain/value-objects/CheckoutResult.js';
import type { CartRepository } from '../domain/repositories/CartRepository.js';

export type CheckoutCartInput = {
  sessionId: string;
};

export type CheckoutCart = {
  execute(input: CheckoutCartInput): Promise<CheckoutResult>;
};

/**
 * Produce a `CheckoutResult` snapshot from the cart. The aggregate rejects an
 * empty cart with `EmptyCartError`.
 */
export const createCheckoutCart = (carts: CartRepository): CheckoutCart => ({
  async execute({ sessionId }): Promise<CheckoutResult> {
    const cart =
      (await carts.findBySessionId(sessionId)) ?? createCart(sessionId);
    return checkoutCart(cart);
  },
});
