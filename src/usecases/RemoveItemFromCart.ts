import {
  createCart,
  removeItemFromCart,
  type Cart,
} from '../domain/entities/Cart.js';
import { createProductId } from '../domain/value-objects/ProductId.js';
import type { CartRepository } from '../domain/repositories/CartRepository.js';

export type RemoveItemFromCartInput = {
  sessionId: string;
  productId: string;
};

export type RemoveItemFromCart = {
  execute(input: RemoveItemFromCartInput): Promise<Cart>;
};

/**
 * Remove a line from the cart. The route's `:itemId` is the `productId` (a
 * `CartItem` has no identity beyond its product). The aggregate raises
 * `ItemNotFoundError` if the line is absent.
 */
export const createRemoveItemFromCart = (
  carts: CartRepository,
): RemoveItemFromCart => ({
  async execute({ sessionId, productId }): Promise<Cart> {
    const cart =
      (await carts.findBySessionId(sessionId)) ?? createCart(sessionId);
    const updated = removeItemFromCart(cart, createProductId(productId));
    await carts.save(updated);
    return updated;
  },
});
