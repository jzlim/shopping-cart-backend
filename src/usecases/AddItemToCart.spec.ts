import { describe, it, expect } from 'vitest';
import { createAddItemToCart } from './AddItemToCart.js';
import { createInMemoryCartRepository } from '../adapters/repositories/InMemoryCartRepository.js';
import { createInMemoryProductCatalog } from '../adapters/repositories/InMemoryProductCatalog.js';
import type { CatalogProduct } from '../domain/repositories/ProductCatalog.js';
import { createProductId } from '../domain/value-objects/ProductId.js';
import { createMoney } from '../domain/value-objects/Money.js';
import {
  CurrencyMismatchError,
  ProductNotFoundError,
} from '../domain/errors/index.js';

/**
 * A USD product plus an off-currency (MYR) product. The MYR entry exists solely
 * to exercise the single-currency-per-cart invariant via the catalog → use case
 * path; it is deliberately kept out of the default production seed
 * (`defaultSeedProducts`) and lives here as a test fixture instead.
 */
const seed: ReadonlyArray<CatalogProduct> = [
  {
    productId: createProductId('prod-usd'),
    name: 'USD Product',
    unitPrice: createMoney(1000, 'USD'),
  },
  {
    productId: createProductId('prod-myr'),
    name: 'MYR Product',
    unitPrice: createMoney(1000, 'MYR'),
  },
];

const makeUseCase = () => {
  const carts = createInMemoryCartRepository();
  const catalog = createInMemoryProductCatalog(seed);
  return { useCase: createAddItemToCart(carts, catalog), carts };
};

describe('AddItemToCart use case', () => {
  it('resolves price server-side and adds the line', async () => {
    const { useCase } = makeUseCase();
    const cart = await useCase.execute({
      sessionId: 's1',
      productId: 'prod-usd',
      quantity: 2,
    });
    expect(cart.items).toHaveLength(1);
    expect(cart.items[0]!.unitPrice).toEqual(createMoney(1000, 'USD'));
    expect(cart.items[0]!.quantity.value).toBe(2);
  });

  it('persists the updated cart to the repository', async () => {
    const { useCase, carts } = makeUseCase();
    await useCase.execute({
      sessionId: 's1',
      productId: 'prod-usd',
      quantity: 1,
    });
    const stored = await carts.findBySessionId('s1');
    expect(stored?.items).toHaveLength(1);
  });

  it('throws ProductNotFoundError for an unknown product', async () => {
    const { useCase } = makeUseCase();
    await expect(
      useCase.execute({ sessionId: 's1', productId: 'ghost', quantity: 1 }),
    ).rejects.toThrow(ProductNotFoundError);
  });

  it('enforces a single currency per cart across catalog-resolved items', async () => {
    const { useCase } = makeUseCase();
    await useCase.execute({
      sessionId: 's1',
      productId: 'prod-usd',
      quantity: 1,
    });
    await expect(
      useCase.execute({ sessionId: 's1', productId: 'prod-myr', quantity: 1 }),
    ).rejects.toThrow(CurrencyMismatchError);
  });
});
