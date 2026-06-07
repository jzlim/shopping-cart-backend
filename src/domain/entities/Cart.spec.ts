import { describe, it, expect } from 'vitest';
import {
  addItemToCart,
  calculateTotal,
  checkoutCart,
  createCart,
  isCartEmpty,
  removeItemFromCart,
  totalItemCount,
} from './Cart.js';
import { createCartItem } from '../value-objects/CartItem.js';
import { createMoney } from '../value-objects/Money.js';
import { createProductId } from '../value-objects/ProductId.js';
import { createQuantity } from '../value-objects/Quantity.js';
import {
  CurrencyMismatchError,
  EmptyCartError,
  ItemNotFoundError,
} from '../errors/index.js';

const item = (
  productId: string,
  price: number,
  qty: number,
  currency = 'USD',
) =>
  createCartItem({
    productId: createProductId(productId),
    name: productId,
    unitPrice: createMoney(price, currency),
    quantity: createQuantity(qty),
  });

describe('Cart aggregate', () => {
  it('creates an empty cart for a session', () => {
    const cart = createCart('s1');
    expect(cart.sessionId).toBe('s1');
    expect(isCartEmpty(cart)).toBe(true);
  });

  it('adds an item to the cart', () => {
    const cart = addItemToCart(createCart('s1'), item('p1', 100, 2));
    expect(cart.items).toHaveLength(1);
    expect(cart.items[0]!.quantity).toEqual(createQuantity(2));
  });

  it('merges duplicate product lines rather than creating a second line', () => {
    let cart = createCart('s1');
    cart = addItemToCart(cart, item('p1', 100, 2));
    cart = addItemToCart(cart, item('p1', 100, 3));
    expect(cart.items).toHaveLength(1);
    expect(cart.items[0]!.quantity).toEqual(createQuantity(5));
  });

  it('keeps distinct products as separate lines', () => {
    let cart = createCart('s1');
    cart = addItemToCart(cart, item('p1', 100, 1));
    cart = addItemToCart(cart, item('p2', 200, 1));
    expect(cart.items).toHaveLength(2);
  });

  it('enforces a single currency per cart', () => {
    const cart = addItemToCart(createCart('s1'), item('p1', 100, 1, 'USD'));
    expect(() => addItemToCart(cart, item('p2', 100, 1, 'EUR'))).toThrow(
      CurrencyMismatchError,
    );
  });

  it('does not mutate the original cart (immutability)', () => {
    const original = createCart('s1');
    addItemToCart(original, item('p1', 100, 1));
    expect(original.items).toHaveLength(0);
  });

  it('removes an item by productId', () => {
    let cart = addItemToCart(createCart('s1'), item('p1', 100, 1));
    cart = removeItemFromCart(cart, createProductId('p1'));
    expect(isCartEmpty(cart)).toBe(true);
  });

  it('raises ItemNotFoundError when removing an absent item', () => {
    expect(() =>
      removeItemFromCart(createCart('s1'), createProductId('ghost')),
    ).toThrow(ItemNotFoundError);
  });

  it('calculates the total across lines', () => {
    let cart = createCart('s1');
    cart = addItemToCart(cart, item('p1', 199, 3)); // 597
    cart = addItemToCart(cart, item('p2', 1000, 2)); // 2000
    expect(calculateTotal(cart)).toEqual(createMoney(2597, 'USD'));
  });

  it('returns zero total for an empty cart', () => {
    expect(calculateTotal(createCart('s1'))).toEqual(createMoney(0, 'USD'));
  });

  it('counts total quantity across lines', () => {
    let cart = createCart('s1');
    cart = addItemToCart(cart, item('p1', 100, 3));
    cart = addItemToCart(cart, item('p2', 100, 2));
    expect(totalItemCount(cart)).toBe(5);
  });

  it('produces a checkout snapshot', () => {
    let cart = createCart('s1');
    cart = addItemToCart(cart, item('p1', 199, 3));
    const { result } = checkoutCart(cart);
    expect(result.total).toEqual(createMoney(597, 'USD'));
    expect(result.itemCount).toBe(3);
    expect(result.lineItems).toHaveLength(1);
    expect(result.checkedOutAt).toBeInstanceOf(Date);
  });

  it('empties the cart on checkout, leaving the snapshot intact', () => {
    let cart = createCart('s1');
    cart = addItemToCart(cart, item('p1', 199, 3));
    const { result, cart: emptied } = checkoutCart(cart);
    expect(isCartEmpty(emptied)).toBe(true);
    expect(emptied.sessionId).toBe('s1');
    // the snapshot still holds the lines that were checked out
    expect(result.lineItems).toHaveLength(1);
    // a second checkout of the emptied cart is now rejected
    expect(() => checkoutCart(emptied)).toThrow(EmptyCartError);
  });

  it('rejects checkout of an empty cart', () => {
    expect(() => checkoutCart(createCart('s1'))).toThrow(EmptyCartError);
  });
});
