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
 * empty cart with `EmptyCartError`; on success the cart is emptied and the
 * cleared state is persisted, so the session starts fresh next time.
 */
export const createCheckoutCart = (carts: CartRepository): CheckoutCart => ({
  async execute({ sessionId }): Promise<CheckoutResult> {
    const cart =
      (await carts.findBySessionId(sessionId)) ?? createCart(sessionId);
    const { result, cart: emptiedCart } = checkoutCart(cart);
    await carts.save(emptiedCart);
    return result;
  },
});
