# Correctness

Depth for the `bug` pass of the `review` skill.

## Method

Hunting bugs in a change, in order:

1. Say what each changed function must do, from the goal, before you read its body. Then read the body against that.
2. Walk the callers. For each thing whose contract changed (a signature, a return shape, an error, a default, a key, the order of effects), search for every user: code, tests, config, stored data, the client. Open each one.
3. Walk the removed lines. Each one did something. Find where that is done now.
4. Walk the edges of each rule: the last value that passes and the first that fails, the empty one, the missing one, the second one of a kind.
5. Walk each exit: every return, throw and early return. What does the caller get, and what does it do with it?
6. Walk a failure halfway: between two writes, between a write and a call out, after a timeout. What is left behind?
7. Walk a second run: the same request twice, two at the same time, a retry, a job that starts again.
8. Walk the data that is already there: old rows, old files, queued jobs, cached values, old clients. Does each still fit the new code?
9. Prove each suspect by reading: one exact input or state, traced line by line to the wrong result. That trace is the problem of the row.

## Where the line is

1. A bug has an input or a state, and a wrong result. Both are in the row. With one of them missing, trace further or drop it.
2. The input must be able to get there. Find who can send it. A value the edge already refuses, or the type rules out, is not a bug.
3. A type that lies is the fault itself: a cast, `any`, an edge with no check. The row goes on that line, not on every use of the value.
4. A case the goal does not settle: a `bug` row whose fix names the decision: what the code does now, and the other option.
5. A part of the goal that is missing: `bug`, on the line where it belongs.
6. Behavior nobody asked for: `simpler`.
7. An old bug the change did not touch: no row. An old bug the change now leans on, or makes reachable: `bug`.
8. A `catch` or a fallback value that hides a failure: `bug` when a caller then acts on the wrong value. `simpler` when it only adds noise.
9. A race: a finding only with both actors named: two requests, a retry, a double click, a second worker.
10. Async: a promise nobody awaits, an `await` inside `forEach`, an error thrown where nothing catches it. `bug`, with what the caller sees: the answer goes out before the write, or the failure is lost.
11. Time and money: a date with no zone, a day cut at the server's midnight, money as a float, rounding done twice. `bug` when you can name the value that comes out wrong.
12. Code that will not build: a call with the wrong arguments, a missing import, a name that is not there. `bug`, when reading shows it.
13. Speed: `design`, and only for plain waste, like a query for each item of a loop. Never ask for a cache, a batch or a pool for a problem nobody named.
14. A fault only the running app can show: no row. One line in the real thoughts, with what to try.

## Examples

A changed contract, and a caller that is not in the diff.

```diff
-export const findOrder = (id) => orders.find(id) ?? notFound("order");
+export const findOrder = (id) => orders.find(id) ?? null;
```

`cart.js:40` still reads:

```js
const total = findOrder(id).total;
```

Wrong:

```text
| 1 | bug | orders.js:12 | Possible null reference | Add a null check |
```

Right:

```text
| 1 | bug | cart.js:40 | `findOrder` now returns `null` for a missing order, and this line still reads `.total`: the cart throws for a deleted order | Answer 404 here when the order is missing |
```

A failure halfway, and a second run.

```js
await payments.charge(order.total, card);
await orders.markPaid(order.id);
```

Right:

```text
| 1 | bug | checkout.js:31 | When `markPaid` fails after the charge, the order stays unpaid, and the user's retry charges the card again | Pass `order.id` to `charge` as its idempotency key |
```

A guard asked for a case that cannot happen. `routes/checkout.js:8` parses `quantity` as a whole number from 1 to 99 before it calls this.

```js
export const lineTotal = (price, quantity) => price * quantity;
```

Wrong:

```text
| 2 | bug | cart.js:3 | `quantity` may be `undefined` or negative | Validate `quantity` at the top of `lineTotal` |
```

Right: no row. The edge checks the value, and the inside trusts the edge.
