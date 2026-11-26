---
description: Fix the picked numbers of a review or debug table and touch nothing else, the Tidy Dev Team way. Use only when the user types it or a request names it.
argument-hint: <numbers>
---

# Fix

Fix the points the user picked from a numbered table, and nothing more. The result is a change ready for the user to commit.

The standards are the team's skills `tidy-dev:clean-code` and `tidy-dev:secure-code`. An agent of the team has its own loaded at start. When neither is loaded, load both with the Skill tool first.

## Input

The numbers: $ARGUMENTS

1. When the line above is empty, the numbers are in the request that named this skill.
2. The numbers point into the last numbered table: the findings of a review, the verdicts of a reply, or the causes of a debug.
3. The user's answer to a question you returned is input too. Go on with the point from where it stopped.
4. With no table or no numbers, stop and say so.

## Limits

1. Change only the files the picked points need, in the working tree.
2. Never run lint, type checks, tests or the app.
3. Never stage, commit or stash, a new file included. Git is the user's.
4. When a decision is the user's, stop and return it as a question. Never guess it.

## Method

1. Find each picked point in the table: its kind, its file:line, its problem, its suggested fix, and what the debate said about it.
2. Read the tree as it is now: `git status`, `git diff`, then each file a point names, whole. Line numbers in the table may be old. Find the point by what it says.
3. Search for the siblings of each fault. See Scope.
4. List what each point needs before you write: the change, the files, the test. Look for the user's decisions now, not halfway. See Decisions.
5. Fix one point at a time, in the order of the numbers, by the standards.
6. Write the tests of the fixes. See Tests.
7. Read your own change, `git diff` and the new files, once per standard. Every changed line belongs to a picked number. Take out what does not, by hand, never with git.
8. Report.

## Rules

### Scope

1. Only the picked numbers. A point that was not picked stays as it is, also when you agreed with it, also when it is one line.
2. A picked point is decided. Fix it also when you pushed back on it. No second debate, and no half fix as a middle way.
3. A fix is the smallest change that closes the point. The code around it stays: no rewrite, no rename, no reorder.
4. The same fault in the point's siblings is the same point. Fix it in all of them, and name them in the report.
5. A different fault you see on the way is one line in the report. It is not fixed.
6. The point's problem is what gets fixed. The suggested fix is the way to do it, unless it breaks a standard or does not fit the code. Then fix it another way, and say how in the report.
7. A point the code no longer has is not fixed again. The report says it is gone.

### Tests

1. A fixed bug comes with a test that fails without the fix. That holds for a `bug` finding, a security finding and a cause from a debug.
2. A point of another kind gets a test only when its fix changes behavior.
3. What makes a test good is the Tests standard of `tidy-dev:clean-code`.
4. An old test the fix makes wrong is updated with the fix, and the report says so. A test is never changed only to make it pass.
5. You write the tests and do not run them. Never report that a point works, passes or was tested.

### Decisions

1. The user's decisions: a fix that changes behavior beyond its point, a new dependency, a protection that would have to be switched off, a point that cannot be fixed without touching what was not picked, two picked points that cannot both be done.
2. What the table, the code, the project's rules, if any, or the standards answer is not a question. Read instead of asking.
3. Stop means stop, for that point. No guess marked as an assumption, no "for now", no both ways behind a flag.
4. A question on one point does not stop the others. Fix the rest, and return the question with the report.
5. A question is one line: the number, the decision, the options, and the one you would pick.

## Report

| #   | Part          | Holds                                                                                                                                      |
| --- | ------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| 1   | **Fixed:**    | A table that keeps the numbers of the input table, with the columns `#` and `Changed`. What changed in a few words, or why it is not fixed |
| 2   | **Notes:**    | A numbered list: siblings fixed with a point, old tests updated, faults seen on the way, a fix done another way. Left out when empty       |
| 3   | **Question:** | The decision that stopped a point. Left out when there is none                                                                             |
| 4   | **Commit:**   | A lowercase one-line commit message for the work of this report: what the change does, no period. Left out when nothing was fixed          |

Nothing else: no intro, no summary, no walk through the code.

## Traps

What models get wrong most, and what to do instead.

1. Fixing a point that was not picked, because it is small or because you agreed with it. Leave it.
2. Arguing a picked point again, or fixing half of it. The user decided. Fix it whole.
3. Rewriting the code around the fix. Change the lines the point needs.
4. Fixing the line the table names and missing the same fault in its siblings. Search before you write.
5. Fixing where it shows and not where it starts: a guard at the line that crashed. Remove the cause the point names.
6. Trusting an old line number. Find the point by what it says, in the code as it is now.
7. A fixed bug with no test, or with a test that passes without the fix. Name the line of the fix that would turn the test red.
8. Getting to green by changing the test. The point is in the code.
9. A comment that says what was fixed: "fixed", "now checks", "was missing". Delete it. The diff shows it.
10. New numbers in the report. Keep the table's numbers, gaps included.
11. Writing "works", "verified", "all tests pass". You ran nothing. Say what changed.
12. Staging a new file so it shows in the diff. Never. `git status` lists it.
13. A commit message with capitals, a period, a body or a list of the numbers. One line, lowercase, what the change does.
