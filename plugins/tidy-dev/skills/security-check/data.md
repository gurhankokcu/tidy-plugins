# Data

Depth for the data pass of the `security-check` skill: what the app keeps about people, and where it goes.

## Method

Following the data of a change, in order:

1. List the data about people the change adds or touches: each field, and where it is stored.
2. For each field, say what the job needs it for. A field with no use in the job is a finding by itself.
3. Follow each field out of the store, to every place it leaves: a response, a list, an export, a log, an error, a mail, a cache, a search index, a queue, an outside service, a model.
4. At each place, ask who can read it there, and whether the job needs it there.
5. For each response the change adds or touches, read what is sent, field by field, nested objects included. Not what the page shows: what the wire carries.
6. For each cache, read its key. Is the caller or the tenant in it?
7. For each delete, find every place the data lives: the store, the cache, the index, the files, the outside services.
8. For each migration, ask what the new column holds for the rows that are already there, and who can read it from the first minute.

## Where the line is

1. A response with a whole record, like `res.json(user)`, a serializer with no field list or an `include` that pulls a relation: a row when a field in it is not for this caller. Name the field.
2. A field the page hides and the response still carries: a row. Callers read the wire.
3. A list or a search that returns people the caller may not see: a row.
4. A cache key with no caller or tenant in it, for an answer that depends on the caller: a row. One user gets another user's answer.
5. A private answer that a shared cache may keep, behind a CDN or a proxy the repo sets up: a row. The fix is `Cache-Control: private` or `no-store`.
6. Personal data in a log, an error, a URL, an analytics event or a metric label: a row. The id is enough.
7. Personal data sent to an outside service or a model: no row when that is the job and only the needed fields go. A row for each field that goes along.
8. Data kept with no use in the job, or with no end: a row, low in the table. Name the field.
9. A delete that leaves copies: a row when the app promises the delete, like an account removal. Name where the copy stays.
10. A count, a uniqueness error or an "already exists" answer that crosses users or tenants: a row when it tells a caller something about someone else.
11. An id that counts up: no row by itself. With the object check in place, it shows nothing.
12. A door with no login that takes an id and answers with a name, an e-mail or a picture: a row. Anyone can walk the ids.
13. A field stored in clear whose siblings are encrypted: a row. Whether a new kind of data needs encryption at rest is the user's decision, and a row that names it.
14. A dump, a seed or a fixture with real people in it: a row. Fakes look fake.
15. A new field on an old response: every old client and cache gets it too. A row when it is not for all of them.
16. An export of many people's data: it has the access check of the list, and a top size. A row for either one missing.

## Examples

A whole record in a response.

```js
const members = await users.findAll({ where: { teamId: req.user.teamId } });
res.json(members);
```

Wrong:

```text
| 1 | security | members.js:9 | Possible sensitive data exposure | Review the returned fields |
```

Right:

```text
| 1 | security | members.js:9 | Every member of a team gets the others' `passwordHash`, `resetToken` and `email`: the handler sends whole user rows | Send named fields: `id`, `name`, `avatarUrl` |
```

A cache key with no caller in it.

```js
const key = `dashboard:${req.query.range}`;
const cached = await cache.get(key);
if (cached) return res.json(cached);
```

Right:

```text
| 1 | security | dashboard.js:6 | A user gets another user's dashboard: the cache key holds the range and not the caller | Put the caller's id in the key |
```

Data that goes out because that is the job. The goal is "mail the receipt". The change gives the mail service the user's address and the order's total.

Wrong:

```text
| 2 | security | receipt.js:11 | Personal data is shared with a third party | Avoid sending the e-mail address |
```

Right: no row.
