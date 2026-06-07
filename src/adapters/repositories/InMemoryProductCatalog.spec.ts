import { describe, it, expect } from 'vitest';
import {
  createInMemoryProductCatalog,
  defaultSeedProducts,
} from './InMemoryProductCatalog.js';
import { createProductId } from '../../domain/value-objects/ProductId.js';
import { createMoney } from '../../domain/value-objects/Money.js';
import type { CatalogProduct } from '../../domain/repositories/ProductCatalog.js';

/**
 * Adapter (contract) tests for the product-catalog seam. In production this port
 * would front an external catalog service/API; these tests pin the contract the
 * adapter must satisfy — authoritative product data resolved server-side, and a
 * null (not a throw) for unknown products.
 */

describe('InMemoryProductCatalog (adapter contract)', () => {
  it('resolves a seeded product by id', async () => {
    const seed: ReadonlyArray<CatalogProduct> = [
      {
        productId: createProductId('prod-x'),
        name: 'Product X',
        unitPrice: createMoney(1234, 'USD'),
      },
    ];
    const catalog = createInMemoryProductCatalog(seed);

    const product = await catalog.findById(createProductId('prod-x'));
    expect(product?.name).toBe('Product X');
    expect(product?.unitPrice).toEqual(createMoney(1234, 'USD'));
  });

  it('returns null for an unknown product (no throw)', async () => {
    const catalog = createInMemoryProductCatalog([]);
    expect(await catalog.findById(createProductId('ghost'))).toBeNull();
  });

  it('falls back to the default seed when none is supplied', async () => {
    const catalog = createInMemoryProductCatalog();
    const product = await catalog.findById(createProductId('prod-keyboard'));
    expect(product?.name).toBe('Mechanical Keyboard');
  });

  it('default seed prices are all USD and positive', () => {
    for (const product of defaultSeedProducts()) {
      expect(product.unitPrice.currency).toBe('USD');
      expect(product.unitPrice.amountInMinorUnits).toBeGreaterThan(0);
    }
  });
});
