import type { Money } from '../value-objects/Money.js';
import type { ProductId } from '../value-objects/ProductId.js';

/**
 * The authoritative product data the cart snapshots at add-time.
 */
export type CatalogProduct = {
  readonly productId: ProductId;
  readonly name: string;
  readonly unitPrice: Money;
};

/**
 * Port that resolves trusted product data. Plays the "ProductValidator" role
 * from the brief, renamed for honesty: it resolves authoritative product data
 * server-side rather than trusting a client-supplied price (a security
 * consideration as much as a modelling one).
 */
export interface ProductCatalog {
  findById(productId: ProductId): Promise<CatalogProduct | null>;
}
