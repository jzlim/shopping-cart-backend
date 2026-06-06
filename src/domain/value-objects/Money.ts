import { CurrencyMismatchError, InvalidMoneyError } from '../errors/index.js';
import type { Quantity } from './Quantity.js';

/**
 * Money stored as integer minor units (e.g. cents), never a float, because
 * floating-point arithmetic makes money a correctness bug (`0.1 + 0.2 !== 0.3`).
 * Every binary operation guards that the currencies match.
 */
export type Money = {
  readonly amountInMinorUnits: number; // integer, e.g. cents
  readonly currency: string;
};

export const createMoney = (
  amountInMinorUnits: number,
  currency: string,
): Money => {
  if (!Number.isInteger(amountInMinorUnits)) {
    throw new InvalidMoneyError(
      `Money amount must be an integer number of minor units, received: ${amountInMinorUnits}`,
    );
  }
  if (amountInMinorUnits < 0) {
    throw new InvalidMoneyError(
      `Money amount cannot be negative, received: ${amountInMinorUnits}`,
    );
  }
  if (typeof currency !== 'string' || currency.trim().length === 0) {
    throw new InvalidMoneyError('Money currency must be a non-empty string');
  }
  return { amountInMinorUnits, currency };
};

export const zeroMoney = (currency: string): Money => createMoney(0, currency);

const assertSameCurrency = (a: Money, b: Money): void => {
  if (a.currency !== b.currency) {
    throw new CurrencyMismatchError(a.currency, b.currency);
  }
};

export const addMoney = (a: Money, b: Money): Money => {
  assertSameCurrency(a, b);
  return createMoney(a.amountInMinorUnits + b.amountInMinorUnits, a.currency);
};

export const multiplyMoney = (money: Money, quantity: Quantity): Money =>
  createMoney(money.amountInMinorUnits * quantity.value, money.currency);

export const moneyEquals = (a: Money, b: Money): boolean =>
  a.amountInMinorUnits === b.amountInMinorUnits && a.currency === b.currency;
