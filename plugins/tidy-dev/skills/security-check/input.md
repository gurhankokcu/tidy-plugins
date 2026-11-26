# Input

Depth for the input pass of the `security-check` skill. The standard, with the safe form of each sink, is in `input.md` of the `secure-code` skill.

## Method

Tracing the values of a change, in order:

1. List the edges the change adds or touches, and each value that comes in at them.
2. For each value, find its check: the line where the raw value becomes a checked one. Read what the check lets through, not what it is called.
3. Follow the value forward, hop by hop, to every sink: through calls, into objects, into the store and out again. Search for its name. Do not trust your memory of the code.
4. At each sink, ask two things. Is this the checked value or the raw one? Is the sink used in its safe form?
5. Then go backward. For each sink in the change, trace every part of it back to where it comes from. This finds the sinks that stored data feeds.
6. For each size the value has (length, count, depth, body, file, page), find the number that limits it.
7. For each check the change removes or loosens, find what it used to stop.

## Where the line is

1. A raw value at a sink: a row.
2. A checked value at a sink in its unsafe form, like a query built as a string: a row, by the standard. When the check makes it safe today, the problem says so and the row goes last.
3. A function with no check, called only with checked values: no row. Name the edge to yourself. If you cannot, the value is unchecked.
4. A value from the project's own database: its type is trusted. Its content is input again when a user wrote it and it now reaches a new sink.
5. A query builder or an ORM: its bound calls are safe. Its raw doors are sinks, like `raw`, `literal`, `whereRaw` or a template string given to `query`. A column, a table or a sort direction is never bound: it comes from a fixed map.
6. An argument list with no shell: safe from a second command, not from an option. A value that starts with `-` is read as an option, unless `--` comes before it.
7. The wrong type past the check: a query parameter sent twice is a list, and a JSON body can hold an object where text is meant. A row when it reaches a compare or a filter, like `{ "$ne": null }` as a token.
8. A check in the wrong order: checked, then decoded, normalized, lower-cased or joined. The value that is used is not the value that was checked. A row.
9. A check that lists what is bad: `<script>` stripped, `..` refused, a block list of hosts. A row, by the standard. Name a value that gets through when you can.
10. A regex as a check: not anchored at both ends, it checks a part of the value. With nested repeats on text that has no top length, it can hang the server. A row for either.
11. No size limit: a row when the value is stored, looped over or held in memory, and no limit of the framework applies. Name what grows.
12. An unknown field: a row only when it reaches a model, an update or a filter.
13. A lookup in a plain object with a key from input: `map[key]` also answers for `constructor` and `__proto__`. A row when the result is called, merged or trusted.
14. A number: a row when a caller gains from the odd one: a quantity below zero, a `limit` of a million, `NaN` past a compare.
15. A header taken as a fact, like `Host`, `X-Forwarded-For` or `Origin`: input, unless the project's proxy setting says which hop to trust. A row when it builds a link, keys a rate limit or decides access.
16. A URL from input that the server fetches: a row, unless the host is checked after the name is resolved, redirects are off, and private and local addresses are refused. A check of the string alone does not hold.
17. What a model, a tool or a fetched page gives back: input. A row when it reaches a shell, a query, a path, `eval` or a tool that changes something, with no check between. A prompt that holds user text is not a row by itself.
18. A value only the operator sets, in env, config or the command line: not an attacker's input. No row for it at a sink.
19. A check only in the browser: a row when the server has none for the same rule.
20. Input from an admin: still input. The caller of the row is "an admin, or whoever holds an admin's session".

## Examples

A stored value at a new sink. The change adds a nightly report. A team's name was checked as text of 1 to 80 characters when the team was made.

```js
const rows = await db.query(`SELECT id, total FROM orders WHERE team = '${team.name}'`);
```

Wrong:

```text
| 1 | security | report.js:12 | Potential SQL injection | Sanitize the input |
```

Right:

```text
| 1 | security | report.js:12 | Any user who can name a team runs SQL in the nightly report: `team.name` is stored text, and it goes into the query as a string | Bind it: `WHERE team = $1` with `[team.name]` |
```

A value that is checked at the edge and bound at the sink.

```js
const { email } = loginSchema.parse(req.body);
const user = await db.query("SELECT id, hash FROM users WHERE email = $1", [email]);
```

Wrong:

```text
| 2 | security | login.js:9 | User input is used in a SQL query | Sanitize `email` before the query |
```

Right: no row.

The wrong type past the check. The store takes a filter object, and the body is JSON.

```js
const reset = await resets.findOne({ token: req.body.token });
```

Right:

```text
| 1 | security | reset.js:7 | Anyone resets another user's password: a body with `{ "token": { "$ne": null } }` matches the first open reset | Parse `token` as a string at the edge |
```
