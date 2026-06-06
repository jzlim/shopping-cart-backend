import {
  cartItemSubtotal,
  mergeCartItems,
  type CartItem,
} from '../value-objects/CartItem.js';
import { addMoney, zeroMoney, type Money } from '../value-objects/Money.js';
import type { ProductId } from '../value-objects/ProductId.js';
import type { CheckoutResult } from '../value-objects/CheckoutResult.js';
import {
  CurrencyMismatchError,
  EmptyCartError,
  ItemNotFoundError,
} from '../errors/index.js';

/**
 * The Cart aggregate root, identified by `sessionId`. It owns its items and is
 * the only place cart invariants are enforced:
 *
 *  - quantities are always positive integers (guarded by the Quantity VO);
 *  - no duplicate product lines — re-adding a product merges quantities;
 *  - a single currency per cart — protects the total calculation;
 *  - removing an absent item raises `ItemNotFoundError`;
 *  - checkout on an empty cart is rejected.
 *
 * All operations are pure functions that return a new `Cart`; the value is never
 * mutated in place.
 */
export type Cart = {
  readonly sessionId: string;
  readonly items: ReadonlyArray<CartItem>;
  readonly createdAt: Date;
  readonly updatedAt: Date;
};

export const createCart = (
  sessionId: string,
  now: Date = new Date(),
): Cart => ({
  sessionId,
  items: [],
  createdAt: now,
  updatedAt: now,
});

const findItemIndex = (cart: Cart, productId: ProductId): number =>
  cart.items.findIndex((item) => item.productId === productId);

/** Reject items whose currency differs from items already in the cart. */
const assertSingleCurrency = (cart: Cart, item: CartItem): void => {
  const existing = cart.items[0];
  if (existing && existing.unitPrice.currency !== item.unitPrice.currency) {
    throw new CurrencyMismatchError(
      existing.unitPrice.currency,
      item.unitPrice.currency,
    );
  }
};

export const addItemToCart = (
  cart: Cart,
  item: CartItem,
  now: Date = new Date(),
): Cart => {
  assertSingleCurrency(cart, item);

  const index = findItemIndex(cart, item.productId);
  const items =
    index === -1
      ? [...cart.items, item]
      : cart.items.map((existing, i) =>
          i === index ? mergeCartItems(existing, item) : existing,
        );

  return { ...cart, items, updatedAt: now };
};

export const removeItemFromCart = (
  cart: Cart,
  productId: ProductId,
  now: Date = new Date(),
): Cart => {
  if (findItemIndex(cart, productId) === -1) {
    throw new ItemNotFoundError(productId);
  }
  return {
    ...cart,
    items: cart.items.filter((item) => item.productId !== productId),
    updatedAt: now,
  };
};

export const isCartEmpty = (cart: Cart): boolean => cart.items.length === 0;

/** Σ (unit price × quantity), in the cart's single currency. */
export const calculateTotal = (cart: Cart, currency = 'USD'): Money => {
  const seed = cart.items[0]
    ? zeroMoney(cart.items[0].unitPrice.currency)
    : zeroMoney(currency);
  return cart.items.reduce(
    (total, item) => addMoney(total, cartItemSubtotal(item)),
    seed,
  );
};

export const totalItemCount = (cart: Cart): number =>
  cart.items.reduce((count, item) => count + item.quantity.value, 0);

export const checkoutCart = (
  cart: Cart,
  now: Date = new Date(),
): CheckoutResult => {
  if (isCartEmpty(cart)) {
    throw new EmptyCartError();
  }
  return {
    lineItems: cart.items,
    total: calculateTotal(cart),
    itemCount: totalItemCount(cart),
    checkedOutAt: now,
  };
};
