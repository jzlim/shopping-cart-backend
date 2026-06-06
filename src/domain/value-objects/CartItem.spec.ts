import { describe, it, expect } from 'vitest';
import {
  cartItemSubtotal,
  createCartItem,
  mergeCartItems,
} from './CartItem.js';
import { createMoney } from './Money.js';
import { createProductId } from './ProductId.js';
import { createQuantity } from './Quantity.js';

const item = (productId: string, price: number, qty: number) =>
  createCartItem({
    productId: createProductId(productId),
    name: 'Widget',
    unitPrice: createMoney(price, 'USD'),
    quantity: createQuantity(qty),
  });

describe('CartItem', () => {
  it('computes a subtotal of unit price x quantity', () => {
    expect(cartItemSubtotal(item('p1', 199, 3))).toEqual(
      createMoney(597, 'USD'),
    );
  });

  it('merges two lines for the same product by summing quantities', () => {
    const merged = mergeCartItems(item('p1', 199, 2), item('p1', 199, 5));
    expect(merged.quantity).toEqual(createQuantity(7));
  });

  it('retains the existing price snapshot when merging', () => {
    const merged = mergeCartItems(item('p1', 199, 1), item('p1', 999, 1));
    expect(merged.unitPrice).toEqual(createMoney(199, 'USD'));
  });
});
