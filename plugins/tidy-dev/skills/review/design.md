# Design

Depth for the approach step and the `design` kind of the `review` skill.

## Method

Judging the approach of a change, in order:

1. Before you read the diff closely, say how you would build the goal in this codebase, in two lines: where the code lives, and what it uses that is already there. The diff pulls you toward its own way. Have yours first.
2. Find the closest thing that is already built. It shows where such code lives and what shape it has.
3. Set the change next to both: the home of the code, its boundaries, the shape of its data, its flow. Note each difference.
4. For each difference, name what one way costs over the other: files, new parts, a second place to keep in sync, a dependency, a migration. With no cost to name, there is no finding.
5. Look hardest at what is costly to change once it ships: the schema, a public route or export, a config key, a stored format, a name others will see. Inner code can change later. These cannot.
6. Look for knowledge that now lives twice: the same rule, list or decision in two places that must change together from now on.
7. Decide: nothing, a `design` row, or `rethink`.

## Where the line is

1. `design` or `simpler`: another way to build it is `design`. The same way with less is `simpler`.
2. `design` or `symmetry`: a member of a family that does not match its siblings is `symmetry`. A part built a second time, next to one the codebase already has, is `design`.
3. A `design` row or `rethink`: `rethink` when the other approach replaces most of the diff. A row that moves or reshapes one piece is `ship after fixes`.
4. "I would have written it another way", with no cost to name: not a finding.
5. A weak pattern of the codebase, followed: not a finding.
6. A pattern by its name is never a reason: "use a repository", "this should be a service". Say what breaks, or what is saved.
7. The plan set the approach: the finding still stands, and its problem says the plan set it. The choice is the user's.
8. The change left the plan: a `design` row with what the plan says and what the change does. When the change's way is the better one, no row, and one line in the real thoughts.
9. A new dependency the plan does not name: a row whose fix names the decision and the built-in way. It is the user's. When the platform has the thing, the kind is `simpler`.
10. Knowledge that lives twice: a row. Name both places, and the one that should stay.
11. The schema: a row for a column whose type, null rule, default or uniqueness does not fit the job. `bug` when rows that are already there break it.
12. A public surface nobody asked for, like a route, an export, a flag or a config key: `simpler`.
13. Building for later: never ask for it. No interface, option, layer or hook "in case".
14. "It will not scale": only with a size from the goal. Plain waste is the exception: a query for each item of a loop, a whole table loaded to count it.

## Examples

A part built a second time. `jobs/queue.js:30` already retries a failed job with a backoff. The change adds `billing/retry.js`, with a loop of its own.

Wrong:

```text
| 1 | design | billing/retry.js:1 | Consider a more robust retry strategy with better separation of concerns | Refactor into a RetryService |
```

Right:

```text
| 1 | design | billing/retry.js:1 | A second retry loop next to the one in `jobs/queue.js:30`: two backoff rules to keep in sync | Enqueue the charge as a job and delete `retry.js` |
```

Taste. The change has a `for` loop where you would have used `map`. Nothing in the file or in the project's rules decides it.

Wrong:

```text
| 4 | design | report.js:22 | A `for` loop where `map` would be more idiomatic | Rewrite with `map` |
```

Right: no row.

Something costly to change later. The goal is "a user can have several addresses". The change adds the columns `address2` and `address3` to `users`.

Right:

```text
| 1 | design | migrations/0042_addresses.sql:3 | "Several" is fixed at three, in columns: a fourth address is a migration and a change to every query | An `addresses` table with a `user_id` |
```
