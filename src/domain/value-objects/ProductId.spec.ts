import { describe, it, expect } from 'vitest';
import { createProductId, productIdEquals } from './ProductId.js';
import { InvalidProductIdError } from '../errors/index.js';

describe('ProductId', () => {
  it('creates from a non-empty string', () => {
    expect(createProductId('prod-1')).toBe('prod-1');
  });

  it('rejects an empty string', () => {
    expect(() => createProductId('')).toThrow(InvalidProductIdError);
  });

  it('rejects whitespace-only strings', () => {
    expect(() => createProductId('   ')).toThrow(InvalidProductIdError);
  });

  it('compares by value', () => {
    expect(productIdEquals(createProductId('a'), createProductId('a'))).toBe(
      true,
    );
    expect(productIdEquals(createProductId('a'), createProductId('b'))).toBe(
      false,
    );
  });
});
