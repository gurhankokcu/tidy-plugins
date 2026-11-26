---
description: Find the cause of a bug and report it as numbered causes with suggested fixes, the Tidy Dev Team way. Changes no code. Use only when the user types it or a request names it.
argument-hint: <bug>
---

# Debug

Find the cause of a bug: make it happen, narrow it down, and name the line where it starts. The report is a numbered table of causes, each with a suggested fix, so that `tidy-dev:fix` can take the numbers. The table is the whole job.

## Input

The bug: $ARGUMENTS

1. When the line above is empty, the bug is in the request that named this skill.
2. A bug is what happens, and what should happen. A failing check is a bug too: its row and its output from a `tidy-dev:test` report are the input.
3. A cause that the input names is a guess. It is checked like any other.
4. The user's answer to a question you returned is input too. Go on with the search from where it stopped.
5. With no bug, stop and say so.

## Limits

1. Never change code, also for a moment: no fix to try, no log line, no test switched off. Never fix the bug.
2. Start the app, and run the end-to-end tests, only when the input asks for it.
3. Never install anything: no dependency, no tool, no browser.
4. Never stage, commit or stash, and never move the tree to another commit. Git is the user's.
5. When a decision is the user's, stop and return it as a question. Never guess it.

## Method

1. Say the bug in one line: what happens, what should happen, and for which input or state. What the input leaves open, find by reading and running.
2. Read the tree as it is now: `git status`, `git diff`, and the last commits with `git log`. Then read the path of the bug, from where the input comes in to where the wrong thing shows.
3. Make the bug happen. See Reproduce.
4. Read the failure whole: the first error, not the last one, and its trace.
5. Narrow it down to one line. See Narrow down.
6. Prove the cause. See Causes.
7. Search for the siblings of the cause: the same fault in other places.
8. Write the suggested fix of each cause.
9. Clean up. Stop every process you started, and delete the files you made outside the project. `git status` shows what it showed at the start.
10. Report.

## Rules

### Reproduce

1. Make it happen before you reason about it. A cause can be proven only for a bug you can see.
2. Take the cheapest way that shows it: the failing check of the input, run alone. An existing test, with the failing input. A one-off command that calls the code, like `node -e` or `python -c`. A request to the running app, when the input asks for the app.
3. A script too long for one line goes in a folder made with `mktemp -d`, never in the project.
4. Make it small: the smallest input that still fails, and the closest one that passes. The cause is in what differs between the two.
5. Run it twice. A bug that shows every time hangs on the input. A bug that shows sometimes hangs on something else: the time, the order, shared state, another run. Find out what: run it alone, in another order, twice at once.
6. Keep the exact command and what it printed. Both go in the report.
7. A check is run, and the app is started, tried and stopped, by the rules of `tidy-dev:test`: Running and App in `${CLAUDE_PLUGIN_ROOT}/skills/test/SKILL.md`, and the file of the stack next to it.
8. A bug that needs the running app, with no word to start it: do not start it. Go on by reading. When reading does not prove a cause, return the question.
9. A bug from a place you cannot reach is not reproduced here: one browser, production, one user's data. Say so, and look for what differs there: the version, the config, the shape of the data.
10. When the cheap ways do not show it, the answer is `no`, with what you tried. Go on by reading when the input gives a hold: an error text, a trace, a log line.

### Narrow down

1. Start from what is seen, not from what you suspect. Search the code for the exact text of the error. Open the line the trace names.
2. In a trace, the frame that counts is the nearest one in the project's own code. The library under it did what it was asked.
3. Follow the wrong value back: where it is read, where it was made, who passed it on. At each stop, look at the value itself, by running. What a name, a type or a comment says it holds is a claim.
4. On a long path, look in the middle. Right there, and the fault is after. Wrong there, and it is before.
5. One guess at a time. Before each look, say what you will see if the guess is right, and what if it is wrong. A look that cannot prove you wrong tells nothing.
6. A guess that fails is dropped whole. Never bend it to fit what you saw.
7. Look inside with what is there: a one-off command, the debugger, a louder log level, the app's own logs, a `SELECT` on the dev database. Never by changing a file.
8. When it worked before, read the history: `git log -p` on the file, `git log -S` on a word, `git blame` on the line, `git show <commit>:<path>` for an old version. Never `checkout`, `stash` or `bisect`: they move the tree.
9. The newest change is the first suspect, and only a suspect.
10. You are there when you can name the line where a right value turns wrong, or where a check should be and is not.

### Causes

1. A cause is a line you can point at, in code or in config, and what it does wrong. The name of a class of bugs is not a cause: "a race", "stale state", "a caching problem".
2. A cause passes three tests. It explains all that was seen, the exact error text included. It explains when the bug does not show: the input that passes, the browser that works. And the failing input can be followed from this line to what the user sees, step by step, with no "somehow".
3. The root, not the place where it shows. The line that throws is where it shows. The cause is where the wrong value was made, or where the edge let it in. Ask why until the answer is a line that should read differently, and stop there.
4. One fault, one row. The same fault in other places is the same row: the first place in `File:line`, the others in the cause.
5. A second row is a second fault that must be fixed too, or the cause of a second bug of the input. Most bugs have one row.
6. A fault you see on the way that does not make this bug is not a row: `tidy-dev:fix` would take its number. It is one line in the notes.
7. The cause is one line: what the line does wrong, for which input or state, and how that turns into what the user sees.
8. The suggested fix is one line: the smallest change at the root, with no code block. Never what hides the bug: a guard where it throws, a `catch`, a retry, a longer timeout, a `sleep`, a cleared cache.
9. When the fix turns on a decision that is the user's, like what should happen in a case nothing settles, the fix names the decision.
10. A cause outside the tree, like a dependency, a service or the data, gets the line of the project that meets it: the call, or the version in the manifest. The fix is what the project can do.
11. When the code does what the goal says and a failing test expects something else, the cause is the line of the test.
12. When the code does what it should and the bug report expects something else, there is no row. The one line says so, and names the line that shows it.
13. Not found means no row. Never fill the table with suspects. The one line says what is ruled out, and where to look next.

### Honesty

1. Report only what you would stand behind. The test: if someone pushed back, could you show the run or the trace? If not, look further or drop it.
2. "Likely", "probably" and "might" are not in the table. A cause is proven, or it is a suspect. Suspects are not rows.
3. Say what you did not do: not reproduced, the app not started, a path not followed.
4. Never say that a fix works. You tried none.

## Report

| #   | Part            | Holds                                                                                                                         |
| --- | --------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| 1   | **Bug:**        | One line: what happens, what should happen, and for which input or state                                                      |
| 2   | **Reproduced:** | `yes`, with the command or the steps and what they showed, in a code block. Or `no`, with what was tried, in one line         |
| 3   | **Causes:**     | A numbered table with the columns `#`, `File:line`, `Cause` and `Suggested fix`. The root first. One line when there are none |
| 4   | **Notes:**      | A numbered list: faults seen on the way, what was not done, data or a process left behind. Left out when empty                |
| 5   | **Question:**   | The decision that stopped the search. Left out when there is none                                                             |

Nothing else: no intro, no story of the search, no list of suspects, no commit message.

## Traps

What models get wrong most, and what to do instead.

1. Reasoning from the title: "fails on Safari", so reading up on Safari. The title is a guess. Make the bug happen first.
2. Naming the first line that looks wrong. Follow the failing input through it, to what the user sees.
3. Stopping where it shows: a null check at the line that throws. Ask where the null came from.
4. Trying a fix to see if it helps, "only for a moment". Never. You change no file.
5. Adding a log line to look inside. Use a one-off command, the debugger or a louder log level.
6. A list of five possible causes. The table holds causes, not suspects.
7. A cause that is a class of bugs: "a race condition", "stale cache", "a timing issue". Name the line, and for a race, the two actors.
8. A cause that does not say why it works elsewhere: in the other browser, for the other user, in the test.
9. Blaming the library, the framework or the browser. Open how the project calls it first.
10. Bending a failed guess to keep it, or holding three guesses at once. One guess, one look, then keep it or drop it.
11. `git stash`, `git checkout` or `git bisect` to compare with an older state. Read it with `git show`.
12. Reading only the newest change. It is the first suspect, not the verdict.
13. A suggested fix that hides the bug: a retry, a longer timeout, a `catch`, "clear the cache".
14. Trusting what a value should hold: a comment, a type, a name. Look at the value.
15. One run, and done. Run it twice: a bug that shows sometimes is another search.
16. The story of the search in the report. The command, the cause, the fix.
17. Writing "this fixes it". You tried nothing.
18. A second fault in the table because you saw it. A line in the notes.
19. Starting the app with no word for it, or leaving it running.
20. Taking the failing test's side without reading it. The test may be the line that is wrong.
