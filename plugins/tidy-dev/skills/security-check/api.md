# API

Depth for the API pass of the `security-check` skill: the endpoints that programs call.

## Method

Checking the endpoints of a change, in order:

1. List the endpoints the change adds or touches, each with its method, what goes in and what comes out. Take the shapes from the code, not from the docs.
2. Read what goes in, field by field. Which fields does the handler take, and which could a caller add?
3. Read what comes out, field by field, for the good answer and for each error.
4. For each list: its top page size, the fields a caller can sort and filter by, and what a filter can reach.
5. For each action that costs something, like money, a mail, a text message, a model call or a heavy query: what stops a caller from running it a thousand times?
6. For each action that must happen once: what happens when the same request comes twice, or two come at the same time?
7. For each door that another machine calls, like a webhook, a callback or an internal endpoint: how does it know who is calling?
8. Find the older doors to the same thing: a `v1` next to the `v2`, a REST route next to the resolver. Do they have the checks of the new one?

## Where the line is

1. A write that passes the body on, with `update(req.body)`, a spread, a schema that lets unknown keys through, or a model with no field list: a row. Name a field the caller should not set, like `role`, `ownerId`, `price` or `verified`.
2. A filter or a sort built from the caller's own keys: a row. It reaches columns the caller should not ask about.
3. A list with no top page size: a row. One request reads the table.
4. A rate limit: a row only where a caller can guess, like a login, a code or a token, and where a call costs. Not for plain reads and writes.
5. An action that must happen once and can happen twice, like a payment, a credit or a redeem: a row.
6. An amount, a price or a currency read from the request: a row. The server works them out.
7. A webhook with no signature check, a check on the parsed body and not on the raw one, a plain compare, or no time window: a row.
8. An internal endpoint on the same server as the public ones, that knows it is internal by a header, an address or its path: a row.
9. A method the route does not need, like a state change that also answers to GET, or a route mounted for all methods: a row.
10. An older version of a door that stays open with the older check: a row.
11. A bulk endpoint: the check runs for each item, not once for the request. A row when one allowed id carries the others.
12. An id of another kind taken on trust, like an upload id, a payment id or a job id from the body: a row when nothing asks whose it is.
13. A resolver: each one is a door. A row for a field that returns an object with no object check, and for nested lists with no top depth or cost. A schema that can be read by anyone: no row.
14. An answer that tells "not found" from "not yours": a row, low in the table, when ids can be guessed.
15. An outbound call with no timeout, on a path a caller can start: a row, low in the table. Slow answers hold the server's workers.
16. The docs: a field marked read-only in an API description is not read-only until the code refuses it.

## Examples

A write that passes the body on.

```js
router.patch("/me", requireLogin, async (req, res) => {
  const user = await users.update(req.user.id, req.body);
  res.json({ id: user.id, name: user.name });
});
```

Wrong:

```text
| 1 | security | me.js:5 | The input is not validated | Add validation |
```

Right:

```text
| 1 | security | me.js:5 | Any logged-in user makes themselves an admin: `PATCH /me` passes the whole body to `update`, `role` included | Parse the body at the edge, and pass the named fields: `name`, `email` |
```

A rate limit asked for where nothing can be guessed. The change adds `GET /projects/:id`, with the login check and the object check.

Wrong:

```text
| 2 | security | projects.js:12 | The endpoint has no rate limit | Add a rate limiter |
```

Right: no row.

A bulk endpoint.

```js
const { ids } = archiveSchema.parse(req.body);
await requireOwner(req.user, ids[0]);
await docs.archiveMany(ids);
```

Right:

```text
| 1 | security | docs.js:31 | A user archives other users' docs: the owner check runs on the first id, and all of them are archived | Put the owner in the write: archive by ids and owner |
```
