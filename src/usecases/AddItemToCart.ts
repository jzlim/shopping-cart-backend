import {
  addItemToCart,
  createCart,
  type Cart,
} from '../domain/entities/Cart.js';
import { createCartItem } from '../domain/value-objects/CartItem.js';
import {
  createProductId,
  type ProductId,
} from '../domain/value-objects/ProductId.js';
import { createQuantity } from '../domain/value-objects/Quantity.js';
import type { CartRepository } from '../domain/repositories/CartRepository.js';
import type { ProductCatalog } from '../domain/repositories/ProductCatalog.js';
import { ProductNotFoundError } from '../domain/errors/index.js';

export type AddItemToCartInput = {
  sessionId: string;
  productId: string;
  quantity: number;
};

export type AddItemToCart = {
  execute(input: AddItemToCartInput): Promise<Cart>;
};

/**
 * Resolve the product server-side, lazily create the cart if absent, add/merge
 * the line through the aggregate root, and persist. Dependencies are injected as
 * arguments — this factory closure *is* the DI mechanism.
 */
export const createAddItemToCart = (
  carts: CartRepository,
  catalog: ProductCatalog,
): AddItemToCart => ({
  async execute({ sessionId, productId, quantity }): Promise<Cart> {
    const id: ProductId = createProductId(productId);

    const product = await catalog.findById(id);
    if (!product) {
      throw new ProductNotFoundError(productId);
    }

    const cart =
      (await carts.findBySessionId(sessionId)) ?? createCart(sessionId);

    const item = createCartItem({
      productId: product.productId,
      name: product.name,
      unitPrice: product.unitPrice,
      quantity: createQuantity(quantity),
    });

    const updated = addItemToCart(cart, item);
    await carts.save(updated);
    return updated;
  },
});
