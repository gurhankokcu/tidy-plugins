---
description: Code standards of the Tidy Dev Team for symmetry, naming, comments, simple design and tests. Load only when an agent or a skill of the team calls for it.
user-invocable: false
---

# Clean code

The code standards of the Tidy Dev Team. They hold whenever you plan, write or review code. Tests are code.

1. The project's rules, if any, win where they differ from this file.
2. The standards cover the code a change adds or touches. Old code that breaks them stays as it is, unless the job is to change it.
3. Working is not enough. Code that works and breaks a standard is not done.

## Order

1. Read the project's rules, if any: `CLAUDE.md`, `AGENTS.md`, `CONTRIBUTING.md`, and the linter and formatter config.
2. Read the whole of each file the change touches, and its siblings: the files that do the same job for another thing.
3. Plan, write or judge the change by the standards below.
4. Before you report, go through the change once per standard, in the order below. One pass for all five misses things.

## Standards

### Symmetry

The same job looks the same everywhere.

1. When the same pattern lives in several places, a change to one goes to all of them, in the same step. Siblings are part of the change, not extra scope. Search for them; do not trust your memory of the code.
2. New code matches the names, order and shape of the code around it. Follow a pattern you would not have picked. Two patterns for one job are worse than one weak pattern.
3. A new member of a family copies the closest member: the same parts, in the same order, with the same names. Then only what truly differs changes.
4. A list keeps its order: fields, arguments, cases, imports, routes, rows. Find the rule of the list and put the new item where the rule says, not at the end by default.
5. Symmetry is the same shape, not shared code. Do not merge siblings into one helper to make them match, and do not force two different jobs into one shape.
6. A fault is not a pattern. Do not copy a history comment, a debug log, dead code or a missing check because the code around has one.
7. Lines the job does not need stay exactly as they are. No reformatting, no reordering, no renaming on the way. A formatter runs only when the job says so, or over a file the change created. It is the project's own formatter.

### Naming

One thing has one name, and the name is true.

1. One name per thing, everywhere: code, files, routes, tables, config keys, tests, messages and docs. Search for the word the code already uses before you pick one. `user` here and `account` there reads as two things.
2. The shortest name that is still clear. Cut the words the place already says: `user.userEmail` becomes `user.email`. Stop cutting when a reader would have to open the code to know what the name holds.
3. The name is true to the job, not bigger and not smaller. `getUser` does not create a user. When the job of a thing changes, its name changes with it, everywhere.
4. A name can be read one way only. Stay away from a word that already means something else in this codebase or this field.
5. Pairs match: `open` and `close`, `add` and `remove`, `start` and `stop`. A thing and the thing that works on it share a root: `review` and `reviewer`.
6. A name is timeless. No `new`, `old`, `v2`, `temp`, `fixed` or `improved`. The name says what the thing is, not when it came.
7. A wrong name in old code is reported, not renamed, unless the job changed what the thing does.

### Comments

A comment is timeless. The test: would you write it if you wrote this code fresh, with no memory of how it used to be and no idea of what comes next? If not, delete it.

1. No comment about a change: what changed, what was there before, why it changed, what was fixed. Code that is commented out is the same thing. All of it belongs in the commit message.
2. No comment about what is not in the code: a missing field, case, parameter or branch, or anything "left out on purpose". Absence has no end. The shape of the code says what it is.
3. No comment about the future: `TODO`, "for now", "temporary", "will be added when". Work that is needed goes in the step or in the report.
4. No comment that says what the line under it says. Let the name say it.
5. A comment may say why a present thing must be there, when the reason is outside the code: a spec, a protocol, a browser quirk, an ordering constraint. It may say what a hard piece of code does. Both pass the test.
6. No debug logs. A log stays only when it is useful at run time, to someone who runs the app.
7. Docs and messages written in a step pass the same test. They say what is, not what changed.

### Simple design

Simple, pragmatic, close to industry standards.

1. Do it the way the codebase already does it. If the codebase has no way, use the language's or the framework's own way. If there is none, use the well-known standard. Invent last.
2. Build what the job needs today. No option, flag, hook, parameter or config value for a need nobody named. No wrapper, base class, interface or factory with one user.
3. The smallest change that does the job. Edit, do not rewrite.
4. The fewest dependencies. The standard library and the platform's built-ins come first. A new dependency is the user's decision: return it as a question, with the reason and the built-in way you ruled out. Use its latest version, looked up, never from memory.
5. Nothing is left over. No unused code, parameter, import, export or file. No alias or wrapper kept "for compatibility", unless the job says so.
6. Check at the edges, trust inside. No check for a case that cannot happen. No `catch` that only hides, logs or rewraps an error. No fallback value that hides a fault.
7. When the approach you were given is more complex than the job needs, say so first, in one or two lines.

### Tests

A change to behavior comes with its tests, and every test can fail.

1. Tests are part of the step that changes the behavior: new behavior, changed behavior, and each fixed bug, with a test that fails without the fix. A rename, a move, config or text needs none.
2. A test can fail. Break the behavior it names and it goes red. A test that still passes with the code under it removed is noise.
3. A test checks behavior through the public surface: what goes in and what comes out. Not private parts, not the order of inner calls. A refactor that keeps the behavior breaks no test.
4. The expected value comes from the job, written by hand. Never from running the code and copying what it gave.
5. Fake only what you do not own or cannot run: the network, the clock, randomness, a paid service. Never fake the thing under test.
6. Use the project's test setup: the same runner, folder, file names and shape as the closest test file. With no setup, use the language's built-in runner. With no built-in runner, it is the user's decision.
7. Cases that differ only in data go in one table: one test body, a list of inputs and expected results. Cover the edge of each rule and the cases that must be refused, not only the happy path.
8. A failing test is a signal. Never weaken, skip or delete a test, or change its expected value, to get to green. When the job changed the behavior, update the test and say so in the report.

## Traps

What models get wrong most, and what to do instead.

1. Changing one place and not its siblings. Search for the pattern before you report: the name, the call, the key, the same file in other folders.
2. Bringing a better pattern into a file that already has one. Follow the file. If its pattern does harm, say so in the report and do not mix the two.
3. Leaving a note about the work: "fixed", "now uses", "removed", "changed to", "previously". Delete it. The diff shows it.
4. Explaining what is missing: "not needed here", "left out on purpose", "no cache for now". Delete it.
5. Narrating the code: "loop over the users", "return the result". Delete it.
6. Building for later: an options object with one option, an interface with one implementation, a config value that never changes. Write the direct version.
7. Guarding against the impossible: a null check on a value that cannot be null, a `catch` that logs and goes on, a default that hides a missing value. Let it fail loudly.
8. Keeping the old thing alive: an alias, a re-export, a wrapper, a "deprecated" note, an unused parameter renamed with `_`. Delete the old thing and update its callers in the same step.
9. Tidying on the way: reformatting, sorting imports, renaming, fixing typos in lines the job does not need. Leave them. A real fault you saw goes in the report as one line.
10. A new `utils`, `helpers` or `common` file. Put the function next to its one user. Name a shared file by what it holds.
11. A test that cannot fail: it asserts that a mock got what the test gave it, or only that a value "is defined", or its expected value was copied from the output. Write the expected value by hand, and name the line of code that would turn the test red.
12. Getting to green by changing the test. First find out which one is wrong, the code or the test.
13. Quieting a tool instead of fixing the code: `any`, a cast, `@ts-ignore`, `eslint-disable`, `# noqa`, `# type: ignore`. Fix the code.
14. A package name or a package version written from memory. Look it up.

## Reference files

Each standard has a file with its method, where the line is, and examples. The files are in `${CLAUDE_PLUGIN_ROOT}/skills/clean-code/`. Open a file when the change leans on its topic, or when you are not sure where the line is.

| File          | Open it when                                              |
| ------------- | --------------------------------------------------------- |
| `symmetry.md` | The change touches a pattern that lives in several places |
| `naming.md`   | The change adds or renames something others will see      |
| `comments.md` | The change adds or edits a comment or a log line          |
| `design.md`   | The change adds a layer, an option or a dependency        |
| `tests.md`    | The change adds or edits a test                           |
