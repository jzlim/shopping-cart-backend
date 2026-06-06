import { describe, it, expect } from 'vitest';
import { createRemoveItemFromCart } from './RemoveItemFromCart.js';
import { createInMemoryCartRepository } from '../adapters/repositories/InMemoryCartRepository.js';
import { addItemToCart, createCart } from '../domain/entities/Cart.js';
import { createCartItem } from '../domain/value-objects/CartItem.js';
import { createProductId } from '../domain/value-objects/ProductId.js';
import { createMoney } from '../domain/value-objects/Money.js';
import { createQuantity } from '../domain/value-objects/Quantity.js';
import { ItemNotFoundError } from '../domain/errors/index.js';

const lineFor = (id: string) =>
  createCartItem({
    productId: createProductId(id),
    name: id,
    unitPrice: createMoney(1000, 'USD'),
    quantity: createQuantity(1),
  });

const seedTwoItemCart = () => {
  const carts = createInMemoryCartRepository();
  let cart = createCart('s1');
  cart = addItemToCart(cart, lineFor('prod-a'));
  cart = addItemToCart(cart, lineFor('prod-b'));
  return { carts, cart };
};

describe('RemoveItemFromCart use case', () => {
  it('removes the targeted line and persists the result', async () => {
    const { carts, cart } = seedTwoItemCart();
    await carts.save(cart);

    const updated = await createRemoveItemFromCart(carts).execute({
      sessionId: 's1',
      productId: 'prod-a',
    });

    expect(updated.items).toHaveLength(1);
    expect(updated.items[0]!.productId).toBe('prod-b');

    const stored = await carts.findBySessionId('s1');
    expect(stored?.items).toHaveLength(1);
    expect(stored?.items[0]!.productId).toBe('prod-b');
  });

  it('throws ItemNotFoundError when the line is not in the cart', async () => {
    const { carts, cart } = seedTwoItemCart();
    await carts.save(cart);

    await expect(
      createRemoveItemFromCart(carts).execute({
        sessionId: 's1',
        productId: 'prod-absent',
      }),
    ).rejects.toThrow(ItemNotFoundError);
  });

  it('throws ItemNotFoundError when no cart exists for the session', async () => {
    const carts = createInMemoryCartRepository();
    await expect(
      createRemoveItemFromCart(carts).execute({
        sessionId: 'never-seen',
        productId: 'prod-a',
      }),
    ).rejects.toThrow(ItemNotFoundError);
  });
});
