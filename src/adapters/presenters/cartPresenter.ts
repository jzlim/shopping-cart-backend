import {
  calculateTotal,
  totalItemCount,
  type Cart,
} from '../../domain/entities/Cart.js';
import {
  cartItemSubtotal,
  type CartItem,
} from '../../domain/value-objects/CartItem.js';
import type { Money } from '../../domain/value-objects/Money.js';
import type { CheckoutResult } from '../../domain/value-objects/CheckoutResult.js';

/**
 * Response DTOs. The presenter shapes domain objects into plain serialisable
 * data, keeping response formatting out of both the controller and the domain.
 */
export type MoneyDTO = {
  amountInMinorUnits: number;
  currency: string;
};

export type CartItemDTO = {
  productId: string;
  name: string;
  unitPrice: MoneyDTO;
  quantity: number;
  subtotal: MoneyDTO;
};

export type CartDTO = {
  sessionId: string;
  items: CartItemDTO[];
  total: MoneyDTO;
  itemCount: number;
  createdAt: string;
  updatedAt: string;
};

export type CheckoutResultDTO = {
  lineItems: CartItemDTO[];
  total: MoneyDTO;
  itemCount: number;
  checkedOutAt: string;
};

const presentMoney = (money: Money): MoneyDTO => ({
  amountInMinorUnits: money.amountInMinorUnits,
  currency: money.currency,
});

const presentItem = (item: CartItem): CartItemDTO => ({
  productId: item.productId,
  name: item.name,
  unitPrice: presentMoney(item.unitPrice),
  quantity: item.quantity.value,
  subtotal: presentMoney(cartItemSubtotal(item)),
});

export const presentCart = (cart: Cart): CartDTO => ({
  sessionId: cart.sessionId,
  items: cart.items.map(presentItem),
  total: presentMoney(calculateTotal(cart)),
  itemCount: totalItemCount(cart),
  createdAt: cart.createdAt.toISOString(),
  updatedAt: cart.updatedAt.toISOString(),
});

export const presentCheckoutResult = (
  result: CheckoutResult,
): CheckoutResultDTO => ({
  lineItems: result.lineItems.map(presentItem),
  total: presentMoney(result.total),
  itemCount: result.itemCount,
  checkedOutAt: result.checkedOutAt.toISOString(),
});
