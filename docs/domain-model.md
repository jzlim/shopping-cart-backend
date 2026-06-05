# Domain Model

This document describes the domain model for the shopping cart, the reasoning
behind each decision, and the alternatives that were considered and rejected.
The guiding principle is **model the rules that exist, and no more** — every
type below earns its place by protecting an invariant or removing primitive
obsession.

## Bounded context

The model covers a single **Cart** context. A `Product` belongs to a separate
**Catalog** context owned elsewhere; the cart references products by id and
snapshots the data it needs (name, price) at the moment an item is added.

## Building blocks

### Value Objects

Immutable, equality by value, validated on construction. They cannot exist in an
invalid state.

| Value Object   | Shape                                                        | Why a value object |
|----------------|-------------------------------------------------------------|--------------------|
| `Money`        | `{ amountInMinorUnits: integer, currency: string }`         | Defined entirely by its amount + currency; two `Money` of equal amount/currency are interchangeable. |
| `ProductId`    | non-empty string                                            | Identifies a catalog product; no lifecycle of its own here. |
| `Quantity`     | positive integer                                            | Centralises the "positive integer" rule; kills primitive obsession. |
| `CartItem`     | `{ productId, name, unitPrice: Money, quantity: Quantity }` | A line item with no identity beyond its `productId` (see below). |
| `CheckoutResult` | `{ lineItems, total: Money, itemCount, checkedOutAt }`    | An immutable snapshot returned by checkout; not a persisted aggregate. |

### Entities

| Entity | Identity    | Notes |
|--------|-------------|-------|
| `Cart` | `sessionId` | The single **aggregate root**. Owns its items and enforces all invariants. |

### Repositories (interfaces, defined in the domain)

```ts
interface CartRepository {
  findBySessionId(sessionId: string): Promise<Cart | null>
  save(cart: Cart): Promise<void>
}
```

Implementations (e.g. `InMemoryCartRepository`) live in the adapters layer.

---

## Question-by-question rationale

### What should be an entity vs a value object?

The test is **identity vs. attributes**. `Cart` needs continuity over time and is
referenced by `sessionId`, so it is an **entity**. Everything else is defined
purely by its values and is freely replaceable, so it is a **value object**.

**`CartItem` is modelled as a value object keyed by `productId`.** Because
quantities merge by product, a line item has no meaningful identity beyond the
product it represents. This keeps the model simple (no id generation) and matches
the merge rule directly. A consequence: the API route's `:itemId` **is** the
`productId`.

> **Rejected alternative:** modelling `CartItem` as a *local entity* with its own
> generated `itemId`. That is the textbook DDD choice and would be required if we
> two separate lines for the same product were ever needed (e.g. different gift
> wrapping). No such requirement exists, so adding id generation now would be
> overengineering. The model can be promoted later without touching the rest of
> the system.

### What are the aggregate boundaries?

There is exactly one aggregate: **`Cart`**, containing its `CartItem`s.

- Nothing outside the cart loads or mutates a `CartItem` directly — all changes
  go through the root, which is how invariants stay enforced.
- `Product` is **outside** the boundary. The cart references it by `ProductId`
  and snapshots `name`/`unitPrice`, so later catalog price changes do not
  retroactively alter a cart. This keeps the aggregate small and decoupled from
  the catalog's lifecycle.
- Checkout returns a **`CheckoutResult` value object**, not an `Order` aggregate.

> **Rejected alternative:** a full `Order`/`Payment` aggregate created at
> checkout. Correct in a real system, but out of scope here (no persistence of
> orders, no payment). Noted as a future boundary.

### What business rules / invariants must the Cart protect?

- A `Quantity` is always a **positive integer**.
- **No duplicate product lines** — adding a product already in the cart merges
  into the existing line's quantity rather than creating a second line.
- **Single currency per cart** — adding an item whose currency differs from the
  items already present is rejected. This protects the total calculation.
- Removing an item that is not in the cart raises an explicit `ItemNotFoundError`.
- **Checkout on an empty cart is rejected.**
- *(Could add later, currently out of scope:)* maximum quantity per line and
  maximum distinct items per cart.

These rules live **inside the `Cart` aggregate** (and the value objects it uses),
not in the use cases — the use cases orchestrate, the domain enforces.

### How do you handle money calculations?

`Money` stores **integer minor units** (e.g. cents), never a floating-point
amount. Floating point makes money a correctness bug (`0.1 + 0.2 !== 0.3`).
`Money` exposes `add`, `multiply(by: Quantity)`, and value equality, and each
binary operation guards that the currencies match (`CurrencyMismatchError`).

> **Deliberate deviation from the brief's example.** `requirements.md` shows a
> `Money` with a `number` `amount` and float multiplication. This model deviates
> on purpose: integer minor units is the correct production choice, and flagging
> the trade-off is more valuable than copying the sample.

### Should quantities have their own type?

**Yes.** A `Quantity` value object puts the "positive integer" rule in exactly
one place, removes primitive obsession (`number` could be anything), and gives a
natural home for the merge operation (`addQuantity`). It is reused enough to earn
its keep.

> For contrast, the line item's `name` stays a plain `string` — wrapping it in a
> `CartItemName` VO would be ceremony with no invariant to protect. That line —
> "wrap it only when there's a rule to enforce" — is how the model avoids
> overengineering.

---

## Domain errors

Explicit, named errors raised by the domain (not generic `Error`):

- `InvalidQuantityError`
- `CurrencyMismatchError`
- `ItemNotFoundError`
- `EmptyCartError`
- `ProductNotFoundError` — raised when a requested `productId` is absent from the
  catalog. Lives at the domain boundary because the cart only admits products the
  catalog vouches for.

These let adapters map domain failures to HTTP status codes without leaking
framework concerns into the domain.

## Aggregate / relationship diagram

```mermaid
classDiagram
    class Cart {
        «Aggregate Root»
        +sessionId : string
        +createdAt : Date
        +updatedAt : Date
        +items : CartItem[]
    }
    class CartItem {
        «Value Object — keyed by productId»
        +productId : ProductId
        +name : string
        +unitPrice : Money
        +quantity : Quantity
    }
    class Money {
        «Value Object»
        +amountInMinorUnits : int
        +currency : string
    }
    class Quantity {
        «Value Object»
        +value : int
    }
    class CheckoutResult {
        «Value Object — snapshot»
        +lineItems
        +total : Money
        +itemCount : int
        +checkedOutAt : Date
    }
    class Product {
        «Catalog context — external»
    }

    Cart "1" *-- "0..*" CartItem : contains
    CartItem *-- "1" Money : unitPrice
    CartItem *-- "1" Quantity : quantity
    CartItem ..> Product : references by ProductId
    Cart ..> CheckoutResult : checkout() produces
```
