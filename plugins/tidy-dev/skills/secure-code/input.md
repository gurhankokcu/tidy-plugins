# Input

Depth for the input standard of the `secure-code` skill.

## Method

At each edge the change adds or touches, in order:

1. List what comes in, by name: each field, parameter, header and file.
2. For each one, write down its type, its size limit, its allowed values or pattern, and whether it must be there.
3. Check with the tool the project already uses for this. With none, write the checks by hand with the language's own tools. A new library is the user's decision.
4. Check in this order: the size, then decode and parse once, then the parsed value. Never check before decoding and use after.
5. Refuse what fails, with the answer the project uses for bad input. Say which field broke which rule. Do not send the value back.
6. Pass the parsed value inward. The raw input goes no further.
7. At each sink the value reaches, use the safe form from the list below.
8. Test the refusals: too long, the wrong type, missing, an extra field, a value outside the list.

The safe form of each sink:

1. SQL or another query language: bound parameters. A column name, a table name or a sort direction comes from a fixed map, never from the input. Never pass an input object in as a filter.
2. A shell or a process: an argument list with no shell, and `--` before the arguments that came from input. Never a command string, `shell: true` or `shell=True`.
3. HTML: the template engine's escaping, or a text node. Never `innerHTML`, `dangerouslySetInnerHTML`, `v-html` or `|safe` on input. When HTML from users is the feature, a known sanitizer is the answer, and the user's decision.
4. A file path: resolve it against the root, then check that the result is still under the root. Better, use a name the server made. Never trust an uploaded name, extension or content type.
5. A URL the server fetches: `https`, a host from an allowlist, no private or local address after the name is resolved, and no followed redirects.
6. A redirect: a path on your own site, or a target from an allowlist. Never the raw `next` parameter.
7. A regex: input goes in as escaped text, never as the pattern. A pattern that checks input is anchored at both ends.
8. A parser: JSON, or the safe loader of the format. Never `eval`, `pickle`, `yaml.load` or a native object format on input.
9. A template or a format string: input is a value in it, never the template itself.
10. The keys of an object: refuse `__proto__`, `constructor` and `prototype`. Never deep-merge input into your own object.
11. A prompt to a model: input is data in it. What the model gives back is input again, and is checked before it reaches a tool or a sink.

## Where the line is

1. A function called only by your own code: no check. The edge did it. If you cannot point at that edge, the value is unchecked.
2. Data from your own database: trust its type. Do not trust its content when a user wrote it and it now goes to a new sink.
3. Another service of yours: an edge. Check the type and the size at least.
4. A webhook or a third party's answer: input. Check the signature first, on the raw body, before parsing.
5. Env and config: checked once, at start: present, the right type, in range. The app does not start on bad config.
6. Input from an admin: still input. Admin accounts get stolen.
7. A number: a whole number where one is meant, with a range. Refuse `NaN` and infinity. Money is never a float.
8. A text: always a top length. A name that is compared, like a user name or an e-mail, is normalized first, then checked, then stored.
9. A list or a nested object: a top count and a top depth. A query parameter sent twice becomes a list: check the type.
10. A file: a size limit before it is read into memory. Stored under a name the server made, outside the folder the web server serves.
11. Paging, sorting and filtering: `limit` has a top value, the sort field comes from a fixed map, each filter is named.
12. An unknown field: dropped or refused by the check, never passed on.
13. Cleaning input: not a check. Do not strip and hope. Refuse.
14. The same input checked in the browser and on the server: the server's check is the real one, and it never trusts that the browser's ran.

## Examples

Checking the input, then using the raw input.

Wrong:

```js
schema.parse(req.body);
await users.update(req.user.id, req.body);
```

Right:

```js
const { name, email } = schema.parse(req.body);
await users.update(req.user.id, { name, email });
```

A sort column from the input. A plain object as the map would also answer for `constructor`.

Wrong:

```js
const orders = await db.query(`SELECT id, total FROM orders ORDER BY ${req.query.sort}`);
```

Right:

```js
const SORTS = new Map([
  ["date", "created_at"],
  ["total", "total"],
]);

const column = SORTS.get(req.query.sort);
if (!column) return badRequest(res, "sort");
const orders = await db.query(`SELECT id, total FROM orders WHERE owner_id = $1 ORDER BY ${column}`, [req.user.id]);
```

A file path from the input.

Wrong:

```js
const file = path.join(ROOT, req.params.name);
```

Right:

```js
const file = path.resolve(ROOT, req.params.name);
if (!file.startsWith(ROOT + path.sep)) return badRequest(res, "name");
```
