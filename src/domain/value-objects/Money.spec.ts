import { describe, it, expect } from 'vitest';
import {
  addMoney,
  createMoney,
  moneyEquals,
  multiplyMoney,
  zeroMoney,
} from './Money.js';
import { createQuantity } from './Quantity.js';
import { CurrencyMismatchError, InvalidMoneyError } from '../errors/index.js';

describe('Money', () => {
  it('creates money from integer minor units', () => {
    const money = createMoney(1099, 'USD');
    expect(money.amountInMinorUnits).toBe(1099);
    expect(money.currency).toBe('USD');
  });

  it('rejects non-integer amounts (no floats)', () => {
    expect(() => createMoney(10.5, 'USD')).toThrow(InvalidMoneyError);
  });

  it('rejects negative amounts', () => {
    expect(() => createMoney(-1, 'USD')).toThrow(InvalidMoneyError);
  });

  it('rejects an empty currency', () => {
    expect(() => createMoney(100, '')).toThrow(InvalidMoneyError);
  });

  it('creates a zero value', () => {
    expect(zeroMoney('USD').amountInMinorUnits).toBe(0);
  });

  it('adds amounts of the same currency', () => {
    expect(addMoney(createMoney(100, 'USD'), createMoney(250, 'USD'))).toEqual(
      createMoney(350, 'USD'),
    );
  });

  it('rejects adding differing currencies', () => {
    expect(() =>
      addMoney(createMoney(100, 'USD'), createMoney(100, 'EUR')),
    ).toThrow(CurrencyMismatchError);
  });

  it('multiplies by a quantity', () => {
    expect(multiplyMoney(createMoney(199, 'USD'), createQuantity(3))).toEqual(
      createMoney(597, 'USD'),
    );
  });

  it('compares by value', () => {
    expect(moneyEquals(createMoney(100, 'USD'), createMoney(100, 'USD'))).toBe(
      true,
    );
    expect(moneyEquals(createMoney(50, 'USD'), createMoney(100, 'USD'))).toBe(
      false,
    );
    expect(moneyEquals(createMoney(100, 'USD'), createMoney(100, 'EUR'))).toBe(
      false,
    );
  });
});
