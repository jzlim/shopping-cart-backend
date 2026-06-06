import { describe, it, expect } from 'vitest';
import { createGetCart } from './GetCart.js';
import { createInMemoryCartRepository } from '../adapters/repositories/InMemoryCartRepository.js';
import { addItemToCart, createCart } from '../domain/entities/Cart.js';
import { createCartItem } from '../domain/value-objects/CartItem.js';
import { createProductId } from '../domain/value-objects/ProductId.js';
import { createMoney } from '../domain/value-objects/Money.js';
import { createQuantity } from '../domain/value-objects/Quantity.js';

const seededItem = createCartItem({
  productId: createProductId('prod-usd'),
  name: 'USD Product',
  unitPrice: createMoney(1000, 'USD'),
  quantity: createQuantity(2),
});

describe('GetCart use case', () => {
  it('returns a fresh empty cart for an unknown session rather than null', async () => {
    const carts = createInMemoryCartRepository();
    const useCase = createGetCart(carts);

    const cart = await useCase.execute({ sessionId: 'never-seen' });

    expect(cart.sessionId).toBe('never-seen');
    expect(cart.items).toHaveLength(0);
  });

  it('returns the stored cart when one exists for the session', async () => {
    const carts = createInMemoryCartRepository();
    await carts.save(addItemToCart(createCart('s1'), seededItem));
    const useCase = createGetCart(carts);

    const cart = await useCase.execute({ sessionId: 's1' });

    expect(cart.items).toHaveLength(1);
    expect(cart.items[0]!.productId).toBe('prod-usd');
    expect(cart.items[0]!.quantity.value).toBe(2);
  });

  it('does not create or persist a cart for an unknown session', async () => {
    const carts = createInMemoryCartRepository();
    const useCase = createGetCart(carts);

    await useCase.execute({ sessionId: 'transient' });

    // The lazily-returned empty cart is a read convenience, not a write.
    expect(await carts.findBySessionId('transient')).toBeNull();
  });
});
