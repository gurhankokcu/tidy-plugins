# Simple design

Depth for the simple design standard of the `clean-code` skill.

## Method

Choosing a design, in order:

1. Say the job in one line. What must be true when it is done? Everything else is not the job.
2. Find how the codebase already does this kind of thing, and do it that way.
3. If the codebase has no way, take the language's or the framework's own way.
4. If there is none, take the well-known standard and write it directly, in a few lines of your own.
5. Only then think of a dependency. It is the user's decision.
6. Write the direct version: no option, no layer, no hook. Add one only when this job needs it today.
7. Go through what you added: each function, parameter, type, branch and file. Ask what breaks if it goes. If nothing breaks, it goes.

## Where the line is

1. Two pieces of code look the same: leave them as two copies when they only happen to look alike today. Share them when a fix to one must always reach the other. Never share them through a function with a flag per caller.
2. A value that might change one day: a named constant in the file. Config or env only when the value differs per environment or per user today.
3. An interface or a base class with one implementation: use the concrete thing. The exceptions are a framework that demands it, and a seam for something you do not own, like the network or the clock.
4. An error: catch it only where you can do something with it: retry, clean up, answer the user, add a fact the caller lacks. Everywhere else, let it rise. Never return `null`, `false` or an empty list to mean "something failed".
5. A check inside: input is checked once, at the edge. Inside, trust the type. A value with no edge that checked it is a hole to report, not a reason to check everywhere.
6. Old callers: change them in the same step. Keep the old way alive only when the job says so, or when the callers are out of reach: a public API, stored data, another repo.
7. Speed: write the plain version. A cache, a batch or a pool comes only for a problem that was measured or named in the job. The exception is plain waste: a query for each item of a loop, a whole table loaded to count it.
8. Standard or simple: where the code meets the outside world, the standard wins: HTTP methods and status codes, ISO 8601 dates, UTF-8, the framework's folder layout, well-known file names. Inside, simple wins: no pattern for its own sake.
9. A dependency worth asking for: one where a mistake in your own version would be a security hole or a long tail of bugs, like crypto, password hashing, dates with time zones, or a parser for a big format. Not one for a few lines you can write, or for something the platform has, like `fetch`, `crypto.randomUUID`, `structuredClone`, `node:test` or `util.parseArgs`.
10. The question for a new dependency: its name, what it is for, the built-in way and why it falls short, and its latest version and release date, looked up.
11. A new file: only when the code has no home. A function with one user lives next to that user.
12. A type: as tight as the data. No generic with one use. No `any` and no cast to quiet the checker.
13. A rewrite: never as part of another job. Working code that the job does not need to change stays.
14. The simple way has a security hole: the safe way wins.
15. The approach you were given is more complex than the job needs: say so first, in one or two lines, with the simpler way. Then build what is decided.

## Examples

Building for later. There is one caller, and it passes no options.

Wrong:

```js
export function createMailer({ transport = "smtp", retries = 0, hooks = {} } = {}) {
  const send = transports[transport];
  return { send: (mail) => withRetries(retries, () => send(mail, hooks)) };
}
```

Right:

```js
export const sendMail = (mail) => smtp.send(mail);
```

Guarding against the impossible, and hiding a fault.

Wrong:

```js
async function loadOrder(id) {
  try {
    const order = await orders.find(id);
    return order ?? null;
  } catch (error) {
    console.error("loadOrder failed", error);
    return null;
  }
}
```

Right:

```js
const loadOrder = (id) => orders.find(id);
```

Keeping the old thing alive after a rename.

Wrong:

```js
export const removeMember = (id) => members.delete(id);
/** @deprecated use removeMember */
export const deleteMember = removeMember;
```

Right, with every caller updated in the same step:

```js
export const removeMember = (id) => members.delete(id);
```
