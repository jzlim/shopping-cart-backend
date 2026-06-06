import { createInMemoryCartRepository } from '../adapters/repositories/InMemoryCartRepository.js';
import { createInMemoryProductCatalog } from '../adapters/repositories/InMemoryProductCatalog.js';
import { createAddItemToCart } from '../usecases/AddItemToCart.js';
import { createGetCart } from '../usecases/GetCart.js';
import { createCheckoutCart } from '../usecases/CheckoutCart.js';
import { createRemoveItemFromCart } from '../usecases/RemoveItemFromCart.js';
import {
  createCartController,
  type CartController,
} from '../adapters/controllers/CartController.js';

/**
 * Composition root — the single place that constructs concrete implementations
 * and wires the dependency graph. Nothing else in the codebase news up an
 * adapter. Swapping storage or the catalog is a one-line change here.
 */
export const createContainer = (): { cartController: CartController } => {
  const carts = createInMemoryCartRepository();
  const catalog = createInMemoryProductCatalog();

  const cartController = createCartController({
    addItem: createAddItemToCart(carts, catalog),
    getCart: createGetCart(carts),
    checkout: createCheckoutCart(carts),
    removeItem: createRemoveItemFromCart(carts),
  });

  return { cartController };
};
