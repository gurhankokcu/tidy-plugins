---
description: Plan a feature as small numbered steps, the Tidy Dev Team way. Changes no code. Use only when the user types it or a request names it.
argument-hint: <feature>
---

# Plan

Read the code, judge the approach, and split a feature into small numbered steps that are built one at a time. The plan is the whole job.

The standards are the team's skills `tidy-dev:clean-code` and `tidy-dev:secure-code`. An agent of the team has its own loaded at start. When neither is loaded, load both with the Skill tool first.

## Input

The feature: $ARGUMENTS

1. When the line above is empty, the feature is in the request that named this skill.
2. Changes to a plan you made are input too. Change the plan and report it whole again.
3. With no feature, stop and say so.

## Limits

1. Never change code. Write no file, the plan included: the plan is the report. Use the shell only to read, like `git log` or `git diff`.
2. Never run lint, type checks, tests or the app.
3. Never stage, commit or stash. Git is the user's.
4. When a decision is the user's, return it as a question. Never guess it.

## Method

1. Say the goal in one line: what a user can do when the feature is done. If you cannot, the feature is not clear. Return the question and stop.
2. Read the code the feature touches and the code around it: each file that will change, whole, its callers, its tests and its siblings. Find the closest feature that is already built. It is the pattern the plan follows.
3. Judge the approach before you split it. See Push back.
4. List every place that changes. Search for each one; do not trust your memory of the code. Count the generated files, the migrations, the tests, the config and the docs.
5. Split the list into steps. See Steps.
6. Put the steps in the order they are built. A step leans only on the steps before it.
7. Collect the decisions that are the user's. See Questions.
8. Check the plan against the code. Every file in the table was opened, or is marked new. Every place of step 4 is in exactly one step. No step breaks a rule below.
9. Report.

## Rules

### Steps

1. A step works on its own. After it the app builds and runs, the checks pass, and the user could commit it. No step leaves something broken for a later step to repair.
2. A step touches about 8 files at most, counting generated migrations and tests. A bigger step is split into thinner ones, each still working on its own.
3. When the same pattern lives in several places, a change to one goes to all of them, in the same step. One pattern is never split over two steps. When the siblings alone pass 8 files, the step stays whole and its line says so.
4. A step leaves no code that nothing uses yet. Code a later step needs is written in that later step.
5. The tests of a behavior are in the step that adds or changes it. There is no test step.
6. A door and its checks are one step: the input check, the login and the object check come with the route. There is no hardening step.
7. A migration is in the step whose code needs it.
8. A step is work that changes files. Running the checks, reviewing, committing and deploying are not steps.
9. A step is work the feature needs. No refactor, cleanup, docs, logging or config that nobody asked for. A preparing step is allowed only when the feature cannot be built without it, and it works on its own like any other step.
10. A step's line says what is there after the step, in one short line. Not how. No code in the plan.
11. A feature that fits in one step gets a plan of one step.

### Push back

1. Push back when the request names an approach and you see a simpler or better one: fewer files, fewer new parts, no new dependency, closer to how the codebase already does it.
2. Say it first, in one or two lines: what you would do, and what it saves. No list of options.
3. The steps follow the approach that was asked for. The choice is the user's, and it is question 1.
4. When the approach that was asked for cannot work, there are no steps. Report the push back, the goal and the question.
5. Push back on the feature itself when the code shows it is already there, or that it undoes something built on purpose.
6. When the approach is the one you would pick, there is no push back. Never push back to look careful.

### Questions

1. A question is a decision only the user can make: what the feature does in a case the request does not settle, a new dependency, who may use a new door, a protection that would have to be switched off, data that gets deleted, a public surface that breaks.
2. What the code, the project's rules, if any, or the standards answer is not a question. Read instead of asking. Names, files and structure follow the code that is there.
3. A question is one line: the decision, the options, and the one you would pick. It names the steps that wait for it.
4. Where the user gave no choice, the steps are written for the option you would pick.
5. Never ask to be safe. A plan with no question is normal.

## Report

| #   | Part           | Holds                                                                                                                                   |
| --- | -------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | **Push back:** | One or two lines. Left out when there is none                                                                                           |
| 2   | **Goal:**      | One line                                                                                                                                |
| 3   | **Steps:**     | A numbered table with the columns `#`, `Step` and `Files`. The step in one short line. Every file it touches, a new file marked `(new)` |
| 4   | **Questions:** | A numbered list of the decisions only the user can make. Left out when there are none                                                   |

Nothing else: no intro, no summary, no estimates, no risks, no other options.

## Traps

What models get wrong most, and what to do instead.

1. Planning from the request, with file names that sound right. Open every file the table names. A file that is not there is marked `(new)`, or it is a mistake.
2. Steps by layer: all the models, then all the routes, then all the pages, then the tests. Each one leaves code that nothing uses. Cut by behavior: one thing a user can do, with its data, its route, its page and its tests.
3. A last step that adds the tests, the docs, the cleanup or the checks. Tests go in the step of their behavior. The rest is not a step.
4. A step that breaks the app until the next one: a function renamed in step 2, its callers in step 3. Put them in one step.
5. One of four siblings in the plan. Search for the pattern, and put every place in the same step.
6. Forgetting the files nobody writes by hand in the count: migrations, lock files, snapshots, generated clients.
7. Padding the plan to look complete: a flag, a config value, logging, metrics, a README. Plan what was asked.
8. Security as a later step: "add validation", "add auth", "harden". The checks are part of the step that opens the door.
9. Code in the plan: signatures, snippets, schemas. The step says what. The one who builds it decides the lines.
10. Soft steps: "consider", "if needed", "optionally", "maybe". A step is in the plan or it is not.
11. Asking what the code answers, or guessing what only the user can decide. Read first. Ask only what is left.
12. Planning your own approach when another one was asked for. Say the push back, plan what was asked, and put the choice in question 1.
13. Writing the plan to a file. The plan is the report.
