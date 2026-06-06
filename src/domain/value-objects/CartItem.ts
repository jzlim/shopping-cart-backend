import { multiplyMoney, type Money } from './Money.js';
import { addQuantity, type Quantity } from './Quantity.js';
import type { ProductId } from './ProductId.js';

/**
 * A line item, keyed by `productId` within the cart. It is a value object with
 * no identity of its own beyond the product it represents — re-adding the same
 * product merges quantities rather than creating a second line. A consequence:
 * the API route's `:itemId` is the `productId`.
 *
 * `name` and `unitPrice` are snapshotted from the catalog at add-time, so later
 * catalog price changes never retroactively mutate a cart.
 */
export type CartItem = {
  readonly productId: ProductId;
  readonly name: string;
  readonly unitPrice: Money;
  readonly quantity: Quantity;
};

export const createCartItem = (params: {
  productId: ProductId;
  name: string;
  unitPrice: Money;
  quantity: Quantity;
}): CartItem => ({
  productId: params.productId,
  name: params.name,
  unitPrice: params.unitPrice,
  quantity: params.quantity,
});

/** Line subtotal: unit price × quantity. */
export const cartItemSubtotal = (item: CartItem): Money =>
  multiplyMoney(item.unitPrice, item.quantity);

/**
 * Merge two lines for the same product by summing their quantities. The price
 * snapshot from the existing line is retained.
 */
export const mergeCartItems = (
  existing: CartItem,
  incoming: CartItem,
): CartItem => ({
  ...existing,
  quantity: addQuantity(existing.quantity, incoming.quantity),
});
