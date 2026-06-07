import { describe, it, expect } from 'vitest';
import { createCheckoutCart } from './CheckoutCart.js';
import { createInMemoryCartRepository } from '../adapters/repositories/InMemoryCartRepository.js';
import { addItemToCart, createCart } from '../domain/entities/Cart.js';
import { createCartItem } from '../domain/value-objects/CartItem.js';
import { createProductId } from '../domain/value-objects/ProductId.js';
import { createMoney } from '../domain/value-objects/Money.js';
import { createQuantity } from '../domain/value-objects/Quantity.js';
import { EmptyCartError } from '../domain/errors/index.js';

const lineFor = (id: string, amount: number, qty: number) =>
  createCartItem({
    productId: createProductId(id),
    name: id,
    unitPrice: createMoney(amount, 'USD'),
    quantity: createQuantity(qty),
  });

describe('CheckoutCart use case', () => {
  it('produces a CheckoutResult summarising the cart', async () => {
    const carts = createInMemoryCartRepository();
    let cart = createCart('s1');
    cart = addItemToCart(cart, lineFor('prod-a', 1000, 2)); // 2000
    cart = addItemToCart(cart, lineFor('prod-b', 500, 3)); // 1500
    await carts.save(cart);

    const result = await createCheckoutCart(carts).execute({ sessionId: 's1' });

    expect(result.total).toEqual(createMoney(3500, 'USD'));
    expect(result.itemCount).toBe(5);
    expect(result.lineItems).toHaveLength(2);
    expect(result.checkedOutAt).toBeInstanceOf(Date);
  });

  it('empties the stored cart, so a second checkout is rejected', async () => {
    const carts = createInMemoryCartRepository();
    let cart = createCart('s1');
    cart = addItemToCart(cart, lineFor('prod-a', 1000, 2));
    await carts.save(cart);

    const checkout = createCheckoutCart(carts);
    await checkout.execute({ sessionId: 's1' });

    const stored = await carts.findBySessionId('s1');
    expect(stored?.items).toHaveLength(0);
    await expect(checkout.execute({ sessionId: 's1' })).rejects.toThrow(
      EmptyCartError,
    );
  });

  it('throws EmptyCartError for a session with no cart', async () => {
    const carts = createInMemoryCartRepository();
    await expect(
      createCheckoutCart(carts).execute({ sessionId: 'never-seen' }),
    ).rejects.toThrow(EmptyCartError);
  });

  it('throws EmptyCartError for a stored but empty cart', async () => {
    const carts = createInMemoryCartRepository();
    await carts.save(createCart('s1'));
    await expect(
      createCheckoutCart(carts).execute({ sessionId: 's1' }),
    ).rejects.toThrow(EmptyCartError);
  });
});
