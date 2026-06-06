/**
 * Base class for all domain errors. Domain code never throws a generic `Error`;
 * every failure is an explicit, named subclass so adapters can map it to an HTTP
 * status code without leaking framework concerns into the domain.
 */
export abstract class DomainError extends Error {
  constructor(message: string) {
    super(message);
    this.name = new.target.name;
    // Restore prototype chain when targeting older runtimes / transpilation.
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class InvalidQuantityError extends DomainError {
  constructor(value: number) {
    super(`Quantity must be a positive integer, received: ${value}`);
  }
}

export class InvalidMoneyError extends DomainError {
  constructor(message: string) {
    super(message);
  }
}

export class CurrencyMismatchError extends DomainError {
  constructor(left: string, right: string) {
    super(`Cannot operate on differing currencies: ${left} vs ${right}`);
  }
}

export class InvalidProductIdError extends DomainError {
  constructor() {
    super('ProductId must be a non-empty string');
  }
}

export class ItemNotFoundError extends DomainError {
  constructor(productId: string) {
    super(`No item with productId "${productId}" exists in the cart`);
  }
}

export class EmptyCartError extends DomainError {
  constructor() {
    super('Cannot checkout an empty cart');
  }
}

export class ProductNotFoundError extends DomainError {
  constructor(productId: string) {
    super(`No product with id "${productId}" exists in the catalog`);
  }
}
