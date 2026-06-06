import type { CartItem } from './CartItem.js';
import type { Money } from './Money.js';

/**
 * An immutable snapshot returned by checkout. Deliberately NOT a persisted
 * `Order` aggregate — orders and payment are out of scope, noted as future work.
 */
export type CheckoutResult = {
  readonly lineItems: ReadonlyArray<CartItem>;
  readonly total: Money;
  readonly itemCount: number;
  readonly checkedOutAt: Date;
};
