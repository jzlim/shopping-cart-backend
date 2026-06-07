import { describe, it, expect } from 'vitest';
import { createInMemoryCartRepository } from './InMemoryCartRepository.js';
import {
  addItemToCart,
  createCart,
  type Cart,
} from '../../domain/entities/Cart.js';
import { createCartItem } from '../../domain/value-objects/CartItem.js';
import { createProductId } from '../../domain/value-objects/ProductId.js';
import { createMoney } from '../../domain/value-objects/Money.js';
import { createQuantity } from '../../domain/value-objects/Quantity.js';

/**
 * Adapter (contract) tests for the cart-persistence seam. These verify the
 * in-memory adapter honours the `CartRepository` port — the same contract any
 * real database-backed adapter would have to satisfy — independently of the use
 * cases that consume it.
 */

const cartWithItem = (sessionId: string, quantity = 1): Cart =>
  addItemToCart(
    createCart(sessionId),
    createCartItem({
      productId: createProductId('prod-mouse'),
      name: 'Wireless Mouse',
      unitPrice: createMoney(2999, 'USD'),
      quantity: createQuantity(quantity),
    }),
  );

describe('InMemoryCartRepository (adapter contract)', () => {
  it('returns null for a session that was never saved', async () => {
    const repo = createInMemoryCartRepository();
    expect(await repo.findBySessionId('absent')).toBeNull();
  });

  it('persists a cart and retrieves it by session id', async () => {
    const repo = createInMemoryCartRepository();
    const cart = cartWithItem('s1');

    await repo.save(cart);

    const stored = await repo.findBySessionId('s1');
    expect(stored).toEqual(cart);
    expect(stored?.items).toHaveLength(1);
  });

  it('overwrites the previous cart on re-save (upsert by session id)', async () => {
    const repo = createInMemoryCartRepository();
    await repo.save(cartWithItem('s1', 1));
    await repo.save(cartWithItem('s1', 5));

    const stored = await repo.findBySessionId('s1');
    expect(stored?.items[0]?.quantity.value).toBe(5);
  });

  it('keeps carts for different sessions independent', async () => {
    const repo = createInMemoryCartRepository();
    await repo.save(cartWithItem('s1'));
    await repo.save(cartWithItem('s2'));

    expect((await repo.findBySessionId('s1'))?.sessionId).toBe('s1');
    expect((await repo.findBySessionId('s2'))?.sessionId).toBe('s2');
  });

  it('isolates storage between repository instances', async () => {
    const repoA = createInMemoryCartRepository();
    const repoB = createInMemoryCartRepository();

    await repoA.save(cartWithItem('s1'));

    expect(await repoB.findBySessionId('s1')).toBeNull();
  });
});
