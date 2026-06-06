import { InvalidQuantityError } from '../errors/index.js';

/**
 * A positive integer quantity. Centralises the "positive integer" rule in one
 * place and removes primitive obsession around bare `number`s.
 */
export type Quantity = {
  readonly value: number;
};

export const createQuantity = (value: number): Quantity => {
  if (!Number.isInteger(value) || value <= 0) {
    throw new InvalidQuantityError(value);
  }
  return { value };
};

/** Sum two quantities — used when merging duplicate product lines. */
export const addQuantity = (a: Quantity, b: Quantity): Quantity =>
  createQuantity(a.value + b.value);

export const quantityEquals = (a: Quantity, b: Quantity): boolean =>
  a.value === b.value;
