# Comments

Depth for the comments standard of the `clean-code` skill.

## Method

The comment pass on a finished change, in order:

1. List every comment and every log line the change adds or edits.
2. Put each comment to the test: would you write it if you wrote this code fresh, with no memory of how it used to be and no idea of what comes next?
3. Delete each comment that fails. If it held something the user must know, that goes in the report, not in another comment.
4. Check each comment that passes once more: could a better name say it? Then fix the name and delete the comment.
5. Put each log line to its own test: who reads it at run time, and what do they do with it? No answer, no log.
6. Read the old comments next to the lines you changed. One that your change made false is part of your change: correct it or delete it.

## Where the line is

1. `// fixed the off-by-one`, `// changed from 30 to 60`, `// now uses the cache`, `// moved from utils`, `// added for the export`: delete. It is about a change.
2. Code that is commented out: delete. Git keeps it.
3. `// no retry here`, `// cache left out on purpose`, `// paging not needed`: delete. It is about something that is not there.
4. `// TODO: add a rate limit`, `// for now`, `// temporary`, `// phase 2`: delete. It is about the future. If the work must happen, it goes in the report.
5. `// loop over the users`, `// constructor`, a banner that repeats the name of the function under it: delete. The code says it.
6. `// Safari fires blur before click, so the menu closes on mousedown`: keep. A browser quirk explains a present thing.
7. `// RFC 6265: a cookie value holds no comma`: keep. A spec.
8. `// Runs before the session middleware: it needs the raw body`: keep. An ordering constraint.
9. `// Orders above 10 000 need a second approval`: keep. A rule from outside the code.
10. `// Not a Set, because the order matters`: turn it around. Say why the present thing is there: `// The order is the priority`.
11. A line above a hard function that says what the function does: keep, when it would be true on any day. Follow the form the file uses.
12. A doc comment on a public function: follow the project. If the siblings have one, write one in the same form. If they do not, do not start.
13. `eslint-disable`, `@ts-expect-error`, `# noqa`: only with the outside reason next to it. One that hides your own fault is a fault.
14. A license header, a shebang, the marker of a generated file, a directive a tool reads: keep. Something outside needs it.
15. An old comment that breaks these rules, on a line you do not change: leave it.
16. `console.log("here")`, a printed value, `debugger`, `dbg!`, a dumped object: delete.
17. A log at start with the port, a warning when a call is retried, an error with what failed and the id to find it: keep, with the project's logger and levels.
18. A log line for each item of a loop, or one that holds a whole request, a token or a person's data: delete.
19. A README or a doc changed in the step: it says what is. No "new", "now", "no longer" or "previously".

## Examples

Comments and logs that fail the test.

Wrong:

```js
// Updated: totals are rounded per line now (was rounded once at the end)
export function invoiceTotal(lines) {
  // TODO: support discounts later
  const total = lines.reduce((sum, line) => sum + roundCents(line.amount), 0); // new helper
  console.log("total", total);
  // No tax here on purpose
  return total;
}
```

Right:

```js
export function invoiceTotal(lines) {
  return lines.reduce((sum, line) => sum + roundCents(line.amount), 0);
}
```

A comment that passes. It says why a present thing must be there, and the reason is in git, not in the code.

```js
// `git grep -O` runs a command. Short options bundle and long options shorten.
const GREP_PAGER = /^(-\w*O|--op)/;
```

A comment about absence, turned around.

Wrong:

```js
// Not a Set, because the order matters
const handlers = [];
```

Right:

```js
// The order is the priority.
const handlers = [];
```
