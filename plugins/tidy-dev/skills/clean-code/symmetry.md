# Symmetry

Depth for the symmetry standard of the `clean-code` skill.

## Method

Finding the siblings of a change, in order:

1. Say the pattern you are about to change in one line: "every list handler reads the page from the query", "each plugin manifest has a name, a shown name and a description".
2. List the family. Look in this order: the same file, the same folder, the folders of the same shape next to it, a search for the name, the call or the key, and the other layers that carry the same thing.
3. Open every member. Do not assume it looks like the first one.
4. Make the change in every member, the same way: the same name, the same place, the same words.
5. Read two members side by side. The diff between them should show only what truly differs.
6. A member that cannot take the change is a real difference. Keep it different and name it in the report.

The other layers that carry the same thing:

1. A field: the schema or migration, the check at the edge, the type, the output shape, the form, the client, the fixtures, the tests, the docs.
2. A route or a command: the router, the access rule, the client call, the tests, the docs, the help text.
3. A config key: the config loader, the example env file, the deploy config, the README.
4. A status or an enum value: every `switch`, every map keyed by it, the database constraint, the translations.
5. A text the user sees: every language file.
6. A rename: every use, in code, tests, file names, config, messages and docs.

## Where the line is

1. The family already has an odd one out: leave it odd. Make your change in it too, if the change belongs there. Report the odd one in one line and do not fix it.
2. Two pieces of code look alike and do different jobs: they are not siblings. Do not make them match.
3. Matching would take a shared helper or a base class: do not add one. The same four lines in three places are fine.
4. The pattern around you is weak and harmless: follow it.
5. The pattern around you is a fault: do not copy it into new code, do not fix the old places, report it.
6. The family is too big for the step: do not change half of it. When you plan, give the family its own step. When you build, stop and return the question.
7. Half the family has moved to a newer pattern: follow the plan or the project's rules. If they do not say, match the nearest members and report it.
8. A generated file: change the source and regenerate with the project's own command. Never edit the output by hand to make it match.
9. A list with no rule you can see: put the new item next to its closest relative.
10. A formatter would rewrite lines you did not touch: do not run it. Shape your own lines by hand to match the file. A file the change created has no such lines: run the project's formatter over it.

## Examples

A change to one of three. The job says "return 404 when a user is not found", and three handlers share the lookup.

Wrong:

```js
export const getUser = (id) => users.find(id) ?? notFound("user");
export const getTeam = (id) => teams.find(id);
export const getRole = (id) => roles.find(id);
```

Right, with the two other handlers named in the report:

```js
export const getUser = (id) => users.find(id) ?? notFound("user");
export const getTeam = (id) => teams.find(id) ?? notFound("team");
export const getRole = (id) => roles.find(id) ?? notFound("role");
```

A new member of a family. The closest member is this one:

```yaml
name: reviewer
description: Reviews a code change and answers push backs.
model: opus
tools: Read, Grep, Glob, Bash
color: orange
```

Wrong:

```yaml
name: security
color: red
description: Security review agent
tools: Bash, Glob, Grep, Read
model: opus
```

Right:

```yaml
name: security
description: Reviews a code change for security and answers push backs.
model: opus
tools: Read, Grep, Glob, Bash
color: red
```

The same shape, not shared code.

Wrong:

```js
const find = (store, name, id, { withOwner = false } = {}) =>
  (withOwner ? store.findWithOwner(id) : store.find(id)) ?? notFound(name);

export const getUser = (id) => find(users, "user", id);
export const getTeam = (id) => find(teams, "team", id, { withOwner: true });
```

Right:

```js
export const getUser = (id) => users.find(id) ?? notFound("user");
export const getTeam = (id) => teams.findWithOwner(id) ?? notFound("team");
```
