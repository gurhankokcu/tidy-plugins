# Access

Depth for the access standard of the `secure-code` skill.

## Method

For each door the change adds or touches (a route, an action, a job, a socket message, a resolver), in order:

1. Write who may use it in one line: "the owner of the order", "any member of the team", "anyone". If the plan does not say and the doors around it do not show it, it is the user's decision.
2. Find how the doors around it check, and use the same guard.
3. Login: the request proves who is calling before anything else runs.
4. Action: the caller's role allows this action.
5. Object: each id the request names, in the path, the query or the body, belongs to the caller. The query itself says so.
6. Output: only the fields this caller may see. Name them.
7. Find the other doors to the same data: the list, the search, the export, the count, the nested route, the bulk action, the job, the cache. Each has the same check.
8. Test the refusals: no login, the wrong role, another user's object.

## Where the line is

1. "Not found" or "not yours": the same answer for both, when an id can be guessed or the fact that a thing exists is itself a leak. One query by id and owner gives this for free.
2. A public door: marked public in code, the project's way. Never public by leaving the check out. It still has input limits, and a rate limit when a call costs money or can be used to guess.
3. A guard that lists paths: a new route is easy to miss. Guard the whole router and let the public doors opt out.
4. A change of state: never on GET. With cookie sessions, the framework's CSRF protection stays on.
5. "Me": from the session. An id in the URL is checked against the session. A long random id changes nothing.
6. A token the code checks: verify the signature with a fixed algorithm, and the expiry, the issuer and the audience, with the library. Never read a token without verifying it. Never take the algorithm from the token.
7. A role, a tenant or a password changes, or the user logs out: old sessions and tokens stop working. A token that carries the role is trusted only for its short life.
8. A login answer: the same message and the same time for "no such user" and "wrong password". The same for "reset mail sent", whether the address exists or not.
9. A reset link, an invite or a login code: made by the secure random source, used once, short-lived, stored as a hash, tied to one user.
10. A session: a new id at login. The cookie is `HttpOnly`, `Secure` and `SameSite=Lax` or stricter.
11. A rate limit: on whatever can be guessed, like a password, a code or a token, and on whatever costs money. By account and by address.
12. A webhook: the signature is checked on the raw body, in constant time, with a time window against replays.
13. A background job: it carries the user or the tenant it works for and puts it in its queries. A job is not an admin.
14. An admin or a debug door: the same three checks, plus the role. Nothing is safe because nobody knows the URL.
15. A file or a download: the object check covers the file too: a handler that checks the owner, or a signed link with a short life. Not a public folder with names that are hard to guess.
16. More than one tenant: the tenant comes from the session and is in every query, joins and uniqueness checks included.
17. A resolver, a server action, an RPC method: each one is a door of its own. A check on the page does not guard the action behind it.
18. A socket: login at connect, and the object check on each message.
19. The front end: it hides what the user may not do. It never decides.

## Examples

The login is checked, the object is not.

Wrong:

```js
const order = await orders.find(req.params.id);
res.json(order);
```

Right:

```js
const order = await orders.findOne({ id: parseId(req.params.id), ownerId: req.user.id });
if (!order) return notFound(res);
res.json({ id: order.id, status: order.status, total: order.total });
```

Who the caller is, taken from the input.

Wrong:

```js
await notes.create({ ownerId: req.body.userId, text });
```

Right:

```js
await notes.create({ ownerId: req.user.id, text });
```

A check that fails open.

Wrong:

```js
async function mayEdit(user, doc) {
  try {
    return (await roles.of(user, doc)) === "editor";
  } catch {
    return true;
  }
}
```

Right:

```js
const mayEdit = async (user, doc) => (await roles.of(user, doc)) === "editor";
```
