import { InvalidProductIdError } from '../errors/index.js';

/**
 * A branded non-empty string identifying a catalog product.
 *
 * The brand (a phantom `__brand` field that exists only at the type level)
 * prevents a raw `string` from being passed where a validated `ProductId` is
 * required — the only way to obtain one is through {@link createProductId}.
 */
export type ProductId = string & { readonly __brand: 'ProductId' };

export const createProductId = (value: string): ProductId => {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new InvalidProductIdError();
  }
  return value as ProductId;
};

export const productIdEquals = (a: ProductId, b: ProductId): boolean => a === b;
