import { describe, it, expect } from 'vitest';
import { addQuantity, createQuantity, quantityEquals } from './Quantity.js';
import { InvalidQuantityError } from '../errors/index.js';

describe('Quantity', () => {
  it('creates a positive integer quantity', () => {
    expect(createQuantity(3).value).toBe(3);
  });

  it('rejects zero', () => {
    expect(() => createQuantity(0)).toThrow(InvalidQuantityError);
  });

  it('rejects negatives', () => {
    expect(() => createQuantity(-2)).toThrow(InvalidQuantityError);
  });

  it('rejects non-integers', () => {
    expect(() => createQuantity(1.5)).toThrow(InvalidQuantityError);
  });

  it('adds quantities', () => {
    expect(addQuantity(createQuantity(2), createQuantity(3))).toEqual(
      createQuantity(5),
    );
  });

  it('compares by value', () => {
    expect(quantityEquals(createQuantity(2), createQuantity(2))).toBe(true);
    expect(quantityEquals(createQuantity(2), createQuantity(3))).toBe(false);
  });
});
