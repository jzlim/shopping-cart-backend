import { createMoney } from '../../domain/value-objects/Money.js';
import { createProductId } from '../../domain/value-objects/ProductId.js';
import type {
  CatalogProduct,
  ProductCatalog,
} from '../../domain/repositories/ProductCatalog.js';

/**
 * In-memory product catalog seeded with a small fixed set of products. Resolving
 * price server-side (rather than trusting a client-supplied price) is a
 * deliberate security choice — see docs/architecture.md.
 */
export const createInMemoryProductCatalog = (
  seed: ReadonlyArray<CatalogProduct> = defaultSeedProducts(),
): ProductCatalog => {
  const store = new Map<string, CatalogProduct>(
    seed.map((product) => [product.productId, product]),
  );

  return {
    findById(productId): Promise<CatalogProduct | null> {
      return Promise.resolve(store.get(productId) ?? null);
    },
  };
};

/**
 * A small fixed set of products to seed the in-memory product catalog with. In a
 * real application, this data would likely come from a database or external API, but
 * for the sake of this demo, hardcoding a few products is sufficient.
 */
export const defaultSeedProducts = (): ReadonlyArray<CatalogProduct> => [
  {
    productId: createProductId('prod-keyboard'),
    name: 'Mechanical Keyboard',
    unitPrice: createMoney(7999, 'USD'),
  },
  {
    productId: createProductId('prod-mouse'),
    name: 'Wireless Mouse',
    unitPrice: createMoney(2999, 'USD'),
  },
  {
    productId: createProductId('prod-monitor'),
    name: 'Monitor',
    unitPrice: createMoney(34999, 'USD'),
  },
  {
    productId: createProductId('prod-headset'),
    name: 'Wireless Headset',
    unitPrice: createMoney(4999, 'USD'),
  },
];
