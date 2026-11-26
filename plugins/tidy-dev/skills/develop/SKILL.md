---
description: Build the given step of a plan with its tests, the Tidy Dev Team way. Use only when the user types it or a request names it.
argument-hint: [steps] [notes]
---

# Develop

Build the given step of the plan, with its tests, and nothing more. The result is a change ready for the user to commit.

The standards are the team's skills `tidy-dev:clean-code` and `tidy-dev:secure-code`. An agent of the team has its own loaded at start. When neither is loaded, load both with the Skill tool first.

## Input

The steps and notes: $ARGUMENTS

1. When the line above is empty, the steps are in the request that named this skill.
2. Build the steps the input names. When it names the whole plan, build every step, in order. When it names none, build the first step that is not built yet.
3. The user's answer to a question you returned is input too. Go on with the step from where it stopped.
4. With no plan, stop and say so.

## Limits

1. Change only the files the step needs, in the working tree.
2. Never run lint, type checks, tests or the app.
3. Never stage, commit or stash, a new file included. Git is the user's.
4. When a decision is the user's, stop and return it as a question. Never guess it.

## Method

1. Find the step in the plan: its line, its files, and the user's answers that touch it.
2. Read the tree as it is now: `git status`, `git diff`, then each file the step names, whole, and its siblings. What the user changed since the last step is deliberate. Build on it.
3. List what the step needs before you write: the behavior, the files, the tests. Look for the user's decisions now, not halfway. See Decisions.
4. Write the code, by the standards.
5. Write the tests of the step. See Tests.
6. Read your own change, `git diff` and the new files, once per standard. Every changed line belongs to the step. Take out what does not, by hand, never with git.
7. Report.

## Rules

### Scope

1. Only the given step. Not the next step, not a part of it, not an improvement on the way.
2. A file the plan did not name is part of the step when the step cannot work or stay symmetric without it: a sibling, a caller, a test, a generated file. Name it in the report. Any other file is not part of the step.
3. A step is finished whole. No stub, no `TODO`, no placeholder data, no part left for later. A step that cannot be finished is stopped with a question.
4. The plan says what. You decide how, by the standards. A different what is not yours to pick: other behavior, another approach, a step much bigger than its line.
5. A fault you see outside the step is one line in the report. It is not fixed.
6. The user's own changes stay. Never undo or rewrite them because the plan says something else. When they block the step, return the question.

### Tests

1. Tests are part of the step. A step that changes behavior is not done without them.
2. What needs a test, and what makes a test good, is the Tests standard of `tidy-dev:clean-code`.
3. An old test the step makes wrong is updated in the step, and the report says so.
4. You write the tests and do not run them. Never report that something works, passes or was tested.

### Decisions

1. The user's decisions: behavior the plan does not settle, a new dependency, who may use a new door, a protection that would have to be switched off, data that gets deleted, a public surface that breaks, a step that cannot be built as written.
2. What the plan, the code, the project's rules, if any, or the standards answer is not a question. Read instead of asking.
3. Stop means stop. No guess marked as an assumption, no "for now", no both ways behind a flag.
4. Stop before you write when you can. When you are stopped halfway, leave the tree as it is and report what is done.
5. A question is one line: the decision, the options, and the one you would pick.

## Report

| #   | Part          | Holds                                                                                                                                         |
| --- | ------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | **Changed:**  | A numbered list. What changed in a few words, and the file                                                                                    |
| 2   | **Notes:**    | A numbered list: files the plan did not name, old tests updated, faults seen outside the step, the cost of a safe choice. Left out when empty |
| 3   | **Question:** | The decision that stopped the step. Left out when there is none                                                                               |
| 4   | **Next:**     | The number of the step that comes next, or `done`                                                                                             |
| 5   | **Commit:**   | A lowercase one-line commit message for the work of this report: what the change does, no period. Left out when a step is not finished        |

Nothing else: no intro, no summary, no walk through the code.

## Traps

What models get wrong most, and what to do instead.

1. Building the next step too, or a small improvement on the way. Stop at the end of the given step.
2. Editing a file from memory after the user changed it. Read the file again before each edit.
3. Putting the user's changes back to what the plan said. They are deliberate. Build on them or ask.
4. Guessing a decision and calling it an assumption. Return the question.
5. Building another approach than the plan's because it looked better. Say it in one line and return the question.
6. Leaving the tests for later, or for the one who runs them. They are part of the step.
7. A stub that makes the step look done: `TODO`, "not implemented", made-up data, a fake in the real code. Finish the step or stop with a question.
8. Running the checks to be sure. Not your job here.
9. Writing "works", "verified", "all tests pass". You ran nothing. Say what changed.
10. A new file nobody asked for: a README, a changelog, a notes file, an example. Write only what the step needs.
11. Staging a new file so it shows in the diff. Never. `git status` lists it.
12. A report that retells the code. A few words per line.
13. A commit message with capitals, a period, a body or two jobs joined by "and". One line, lowercase, one job.
