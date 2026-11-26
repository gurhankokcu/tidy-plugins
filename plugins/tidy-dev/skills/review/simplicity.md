# Simplicity

Depth for the `simpler` pass of the `review` skill. The standard is in `design.md` of the `clean-code` skill.

## Method

Hunting what a change has too much of, in order:

1. List what the change adds: each file, function, parameter, option, type, branch, export, config key and dependency.
2. For each one, search for its users, and count them. Ask what breaks if it goes. If nothing breaks, it is a finding.
3. For each guard and each branch, find the edge that decides whether its case can happen.
4. For each `catch`, fallback and default, say what it hides.
5. For each piece of new code, search for the thing that already does it: in the codebase, the framework, the platform.
6. Set the size of the diff against the size of the goal. When a small goal has a large diff, find where the rest went.
7. Say the simpler version in one line: what goes, and what stays. That line is the suggested fix. If you cannot say it, there is no finding.

## Where the line is

1. `simpler` holds only when the behavior stays the same, for every case the goal has. A shorter version that drops a case is a bug you would be adding.
2. Shorter is not simpler. Simpler is fewer parts to keep in your head. Never ask for a dense one-liner, a clever chain or a nested ternary.
3. Never ask for a shared helper to make look-alike code one. The same four lines in three places are fine. Ask only when a fix to one must always reach the others.
4. A thing with no user: a parameter nobody passes, an export nobody imports, an option always given the same value, a file nothing loads. A row. The fix deletes it.
5. A layer with one user, like a wrapper, a base class, an interface or a factory: a row, unless the framework demands it or it is a seam for something the project does not own.
6. A guard for a case that cannot happen: a row that names the edge or the type that rules the case out.
7. A config value that is the same everywhere: a row. The fix is a named constant.
8. Code for what the platform or the codebase already has: a row that names the thing and where it is.
9. An old thing kept alive next to the new one, like an alias, a re-export or a wrapper marked deprecated, with its callers in reach: a row. The fix deletes it and updates the callers.
10. A refactor, a rename or a cleanup that came along with the job: a row. The fix takes it out of this change.
11. Old code that is complex, on lines the change did not touch: no row.
12. A fix that adds one part to take two away is fine. A fix that adds an abstraction to remove a repeat is not.

## Examples

Options with no user. The one caller is `routes/export.js:14`, and it passes no options.

```js
export function toCsv(orders, { delimiter = ",", headers = true, quote = '"' } = {}) {
```

Wrong:

```text
| 3 | simpler | export.js:5 | This function is quite complex and could be simplified | Consider refactoring |
```

Right:

```text
| 3 | simpler | export.js:5 | `delimiter`, `headers` and `quote` are never passed: the one caller is `routes/export.js:14` | Take the options out and write the three values in place |
```

A guard for a case that cannot happen. `router.js:9` puts `requireLogin` in front of every route of this file.

```js
if (!req.user) return res.status(401).end();
```

Right:

```text
| 5 | simpler | routes/notes.js:22 | `req.user` is always set here: `requireLogin` at `router.js:9` refuses the request first | Take the check out |
```

Shorter is not simpler. The change has a plain loop that builds a map.

Wrong:

```text
| 6 | simpler | totals.js:8 | The loop can be one line | Use `reduce` with a spread |
```

Right: no row.
