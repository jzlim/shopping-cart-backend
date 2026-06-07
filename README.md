# Shopping Cart REST API

Build a REST API supporting shopping cart operations with emphasis on design patterns, architecture, and domain modeling.

## API Endpoints

```
1. POST /api/cart/:sessionId/items            // Add product to card
2. GET /api/cart/:sessionId                   // Get cart items
3. POST /api/cart/:sessionId/checkout         // Checkout cart
4. DELETE /api/cart/:sessionId/items/:itemId  // Remove item from cart
```

## Domain Model

> Full details and rationale: [`docs/domain-model.md`](./docs/domain-model.md).

The model centres on a single **Cart** bounded context. `Product` lives in an
external **Catalog** context; the cart references it by id and snapshots
`name`/`price` when an item is added.

### Entities vs. Value Objects

| Type             | Kind                        | Why |
|------------------|-----------------------------|-----|
| `Cart`           | **Entity** (aggregate root) | Has continuity over time, identified by `sessionId`. |
| `Money`          | Value object                | Defined by amount + currency; immutable. |
| `ProductId`      | Value object                | Identifies a catalog product. |
| `Quantity`       | Value object                | Centralises the "positive integer" rule. |
| `CartItem`       | Value object                | A line item with no identity beyond its `productId`. |
| `CheckoutResult` | Value object                | Immutable snapshot returned by checkout. |

**`CartItem` is a value object keyed by `productId`** (not an entity). Quantities
merge by product, so a line has no identity beyond the product it represents —
which also means the API's `:itemId` **is** the `productId`. (Rejected: a local
entity with a generated `itemId`; unnecessary until duplicate lines per product
are required.)

### Aggregate boundaries

One aggregate — **`Cart`**, containing its `CartItem`s. All changes go through the
root, so invariants are always enforced. `Product` stays **outside** the boundary
(referenced by id, with price snapshotted) to keep the aggregate small and
decoupled from catalog lifecycle. Checkout returns a `CheckoutResult` value
object rather than a full `Order` aggregate (out of scope; noted as future work).

### Invariants the Cart protects

- Quantity is always a **positive integer**.
- **No duplicate product lines** — re-adding a product merges its quantity.
- **Single currency per cart** — protects the total calculation.
- Removing an absent item → `ItemNotFoundError`.
- **Checkout on an empty cart is rejected.**
- **Checkout empties the cart** — a successful checkout returns a `CheckoutResult`
  snapshot and clears the cart for reuse under the same `sessionId` (no `status`
  field; a checked-out cart is simply an empty one).

### Money

`Money` stores **integer minor units** (cents), never floats, because
floating-point arithmetic makes money a correctness bug (`0.1 + 0.2 !== 0.3`).
Operations (`add`, `multiply`) guard that currencies match. This is a
**deliberate deviation** from the float-based example in `requirements.md`. (Type
shown in the consolidated block below.)

The integer approach is the right default but not free — division/rounding still
needs an explicit policy, "minor units" isn't universally 1/100 (JPY=0, BHD=3),
and decimal inputs/outputs need conversion at the boundary. See
[`docs/domain-model.md`](./docs/domain-model.md#how-do-you-handle-money-calculations)
for the full trade-off discussion.

### Quantity as its own type

Yes — it puts the positive-integer rule in one place, removes primitive obsession,
and hosts the merge operation. By contrast, an item's `name` stays a plain
`string`: a primitive gets wrapped only when there's a rule to protect, which is
how the model stays lean.

### The model in types

Every value object is immutable and constructed through a validating factory, so
it cannot exist in an invalid state. The `Cart` aggregate is the only entity.

```typescript
// — Value objects ————————————————————————————————————————————————

export type ProductId = string; // branded non-empty string

export type Quantity = {
  readonly value: number; // positive integer
};

export type Money = {
  readonly amountInMinorUnits: number; // integer, e.g. cents — never a float
  readonly currency: string;
};

// A line item, keyed by productId within the cart (no identity of its own)
export type CartItem = {
  readonly productId: ProductId;
  readonly name: string;
  readonly unitPrice: Money;
  readonly quantity: Quantity;
};

// Immutable snapshot returned by checkout (not a persisted Order aggregate)
export type CheckoutResult = {
  readonly lineItems: ReadonlyArray<CartItem>;
  readonly total: Money;
  readonly itemCount: number;
  readonly checkedOutAt: Date;
};

// — Aggregate root ———————————————————————————————————————————————

export type Cart = {
  readonly sessionId: string; // identity
  readonly items: ReadonlyArray<CartItem>;
  readonly createdAt: Date;
  readonly updatedAt: Date;
};
```

Cart operations are **pure functions** that return a new `Cart`, enforcing
invariants on the way through (merge by `productId`, single-currency, etc.). They
live in the domain layer; the use cases orchestrate them:

```typescript
createCart(sessionId): Cart;
addItemToCart(cart, item): Cart;        // merge by productId; single-currency
removeItemFromCart(cart, productId): Cart; // ItemNotFoundError if absent
calculateTotal(cart): Money;            // Σ unitPrice × quantity, one currency
checkoutCart(cart): { result: CheckoutResult; cart: Cart }; // EmptyCartError if empty; cart returned emptied
```

### Domain errors

`InvalidQuantityError`, `CurrencyMismatchError`, `ItemNotFoundError`,
`EmptyCartError`, `ProductNotFoundError` — explicit named errors that adapters map
to HTTP status codes.
