import type { Cart } from '../entities/Cart.js';

/**
 * Port for persisting and retrieving carts. The interface lives in the domain;
 * concrete implementations (e.g. `InMemoryCartRepository`) live in `adapters/`.
 * Async by design so the seam matches a real database's contract.
 */
export interface CartRepository {
  findBySessionId(sessionId: string): Promise<Cart | null>;
  save(cart: Cart): Promise<void>;
}
