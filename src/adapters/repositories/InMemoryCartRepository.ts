import type { Cart } from '../../domain/entities/Cart.js';
import type { CartRepository } from '../../domain/repositories/CartRepository.js';

/**
 * In-memory `CartRepository` backed by a `Map`. Storage is process-local and
 * non-persistent — real persistence is explicitly out of scope. The async
 * signature matches the port so swapping in a real database is a pure adapter
 * change.
 */
export const createInMemoryCartRepository = (): CartRepository => {
  const store = new Map<string, Cart>();

  return {
    findBySessionId(sessionId: string): Promise<Cart | null> {
      return Promise.resolve(store.get(sessionId) ?? null);
    },
    save(cart: Cart): Promise<void> {
      store.set(cart.sessionId, cart);
      return Promise.resolve();
    },
  };
};
