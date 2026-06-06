import type { AddItemToCart } from '../../usecases/AddItemToCart.js';
import type { GetCart } from '../../usecases/GetCart.js';
import type { CheckoutCart } from '../../usecases/CheckoutCart.js';
import type { RemoveItemFromCart } from '../../usecases/RemoveItemFromCart.js';
import {
  presentCart,
  presentCheckoutResult,
  type CartDTO,
  type CheckoutResultDTO,
} from '../presenters/cartPresenter.js';

export type CartUseCases = {
  addItem: AddItemToCart;
  getCart: GetCart;
  checkout: CheckoutCart;
  removeItem: RemoveItemFromCart;
};

/**
 * Framework-agnostic controller. It receives already-parsed, typed inputs and
 * returns plain DTOs — it never touches Express `req`/`res`. The HTTP wiring
 * lives only in `routes.ts`, keeping even the adapter layer free of framework
 * types.
 */
export type CartController = {
  addItem(input: {
    sessionId: string;
    productId: string;
    quantity: number;
  }): Promise<CartDTO>;
  getCart(input: { sessionId: string }): Promise<CartDTO>;
  checkout(input: { sessionId: string }): Promise<CheckoutResultDTO>;
  removeItem(input: { sessionId: string; productId: string }): Promise<CartDTO>;
};

export const createCartController = (
  useCases: CartUseCases,
): CartController => ({
  async addItem(input): Promise<CartDTO> {
    return presentCart(await useCases.addItem.execute(input));
  },
  async getCart(input): Promise<CartDTO> {
    return presentCart(await useCases.getCart.execute(input));
  },
  async checkout(input): Promise<CheckoutResultDTO> {
    return presentCheckoutResult(await useCases.checkout.execute(input));
  },
  async removeItem(input): Promise<CartDTO> {
    return presentCart(await useCases.removeItem.execute(input));
  },
});
