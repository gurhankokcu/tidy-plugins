# Access

Depth for the access pass of the `security-check` skill. The standard is in `access.md` of the `secure-code` skill.

## Method

Checking the doors of a change, in order:

1. List the doors the change adds, touches or removes: each route, action, job, socket message and resolver.
2. For each door, find where it is mounted, and read from the entry point down to it: every guard on the way, in the order it runs. Do not take a guard on trust because the siblings have one.
3. Write who may use the door in one line, from the plan or from the doors around it. If neither says, it is the user's decision, and a row.
4. Login: find the line that refuses a caller with no session.
5. Action: find the line that refuses the wrong role.
6. Object: list every id the request names, in the path, the query and the body. Find each one in a query, next to the caller or the tenant.
7. Output: read what goes back. Are the fields named?
8. List the other doors to the same data: the list, the search, the export, the count, the nested route, the bulk action, the job, the cache, the older version of the route. Open each one. Does it have the same check?
9. Ask what happens when a check breaks: an error, a timeout, a missing value. Follow that branch to its end.
10. Read the removed and the moved lines as doors of their own.

## Where the line is

1. A door with no login check, not marked public: a row. When the plan says it is public, no row for the login. It still needs its limits.
2. An id fetched alone and compared later: a row, by the standard. First in the table when one path skips the compare, last when every path has it.
3. A nested route that checks the parent and fetches the child by its own id alone, like `/teams/:teamId/docs/:docId`: a row. The child is fetched by id and parent.
4. An id in the body or the query is checked like one in the path. So is each id in a list, and the target of a move or a copy.
5. A long random id is not a check. The row stands.
6. Who the caller is, read from input: a user id, a role, a tenant or a "verified" flag from the body, a header or a hidden field. A row.
7. A guard that lists paths, and a new route that is not in the list: a row.
8. A guard that runs after the handler, or after a route that answers first: a row. The order is part of the guard.
9. A check that fails open: a `catch` that returns true, a missing user that goes on, a default role that can do things. A row.
10. A check in the page or the client only: a row when the action behind it has none. A resolver, a server action and an RPC method are doors of their own.
11. A token that is read and not verified, verified with the algorithm from its own header, or verified with no check of its expiry and audience: a row.
12. A change of role, tenant or password that leaves old sessions and tokens alive: a row.
13. A thing to use once that can be used twice: a reset link, an invite, a coupon, a balance. When the code reads, then writes, two requests at the same time both pass. A row. The fix is one write that also checks, and a count of the rows it changed.
14. A login, a reset or a code check with no rate limit by account and by address: a row. A plain data route with none: no row.
15. A different answer or a different time for "no such user" and "wrong password", or for the reset of an address that is not there: a row, low in the table.
16. A job, a script or a webhook that takes an id from its message and does not carry the user or the tenant it works for: a row.
17. A debug or an admin door with no role check: a row, wherever it is mounted and whoever knows the URL.
18. A test of a refusal that the change deletes or loosens: read the code under it for the door it leaves open.

## Examples

A nested route. `requireMember` checks that the caller is a member of `teamId`.

```js
router.get("/teams/:teamId/docs/:docId", requireMember, async (req, res) => {
  const doc = await docs.find(req.params.docId);
  res.json(doc);
});
```

Wrong:

```text
| 1 | security | docs.js:14 | Missing authorization, possible IDOR | Add proper access control |
```

Right:

```text
| 1 | security | docs.js:15 | A member of any team reads any team's doc: `requireMember` checks `teamId`, and the doc is fetched by `docId` alone | Fetch by id and team in one query, and answer 404 for none |
```

A guard that is not in the diff. The change adds `routes/admin/reports.js`, and its routes have no check of their own. `routes/admin/index.js` reads:

```js
router.use(requireRole("admin"));
router.use("/reports", reports);
```

Wrong:

```text
| 2 | security | routes/admin/reports.js:6 | `GET /reports` has no authentication | Add `requireRole("admin")` to the route |
```

Right: no row. The guard is on the router, above the line that mounts the new routes.

A thing to use once, used twice.

```js
const invite = await invites.find(code);
if (!invite || invite.used) return gone(res);
await teams.addMember(invite.teamId, req.user.id);
await invites.markUsed(invite.id);
```

Right:

```text
| 1 | security | invites.js:21 | One invite lets in many users: two requests at the same time both pass the `used` check before either one marks it | Mark it first, in one write that checks `used = false`, and go on only when a row changed |
```
