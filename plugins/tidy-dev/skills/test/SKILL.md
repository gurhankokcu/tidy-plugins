---
description: Run the project's lint, type checks and tests and report each result, the Tidy Dev Team way. Starts the app only when asked. Changes no code. Use only when the user types it or a request names it.
argument-hint: [e2e] [app] [focus]
---

# Test

Run the project's checks and report what each one said: lint, type checks and tests, for any stack. When asked, also run the end-to-end tests, or start the app and try a change. The report holds what ran and what came out, and no opinion on it. The table is the whole job.

## Input

What to run: $ARGUMENTS

1. When the line above is empty, the input is in the request that named this skill.
2. With no words, run the checks: lint, type checks and tests. See Checks.
3. The word `e2e` adds the end-to-end tests.
4. The word `app` adds the app: start it, try the change, stop it. A request to start the app, to try a change or to try a finding means the same. See App.
5. Any other words are the focus: the part of the project whose checks run, and with `app`, what to try.
6. A second run is a new run. Run every check again, the ones that passed too.

## Limits

1. Never change code. Never fix a failure, however small, and never say what caused it. The cause is the job of `tidy-dev:debug`.
2. Start the app, and run the end-to-end tests, only when the input asks for it.
3. Never install anything: no dependency, no tool, no browser.
4. Never stage, commit or stash. Git is the user's.
5. When a decision is the user's, stop and return it as a question. Never guess it.

## Method

1. Read the input: what to run, and the focus.
2. Read the tree as it is now: `git status`. It is what you compare with at the end.
3. Find the project's stacks, and open the reference file of each. See Reference files.
4. Find the project's checks. See Checks.
5. List the checks you will run, in this order: lint, type checks, tests, and the end-to-end tests when asked.
6. Run each check on its own, to its end. A failing check does not stop the next one. See Running.
7. Give each check its result, from its exit code and its whole output. See Results.
8. With `app`: start the app, try, and stop it. See App.
9. Clean up. Stop every process you started. Read `git status` again: a file that a check changed is a line in the notes.
10. Report.

## Rules

### Checks

A check is a command the project already has. Look for it in this order:

| #   | Where                                                                                        | Tells                                                        |
| --- | -------------------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| 1   | The project's rules and docs: `CLAUDE.md`, `AGENTS.md`, `CONTRIBUTING.md`, `README.md`       | The commands a person is told to run                         |
| 2   | The CI config: `.github/workflows/`, `.gitlab-ci.yml` and the like                           | What must pass before a merge, with its exact flags          |
| 3   | The task runner: `Makefile`, `justfile`, `Taskfile.yml`, the scripts of the stack's own file | The project's own names for its checks                       |
| 4   | The config file of a tool: a linter, a type checker, a test runner                           | A check with no script. Its command is in the reference file |

1. Read what a command runs before you run it: open the script or the target. A name says little. `test` may only print a line, `lint` may fix, `check` may deploy.
2. Run the project's command as it is written, with its flags. Never add a flag that makes it stricter or looser.
3. A command that changes files is not run as it is: `--fix`, `--write`, an update of snapshots, a code generator. Run the tool behind it in the form that only checks, and write that command in the row. With no such form, the check is `not run`.
4. A script that joins checks, like `check` or `ci`, often stops at its first failure. Run its parts, one row each.
5. Lint counts the format check too. A build is a check only where it is the stack's type check.
6. A kind the project has no check for gets no row. The notes say it: "No type check found." Never run a tool the project does not have.
7. A check runs on the whole project, never only on the changed files. With a focus, it runs on the whole of that part.
8. In a project with several packages, the root command that covers all of them is the check.
9. End-to-end tests are the ones that drive the whole app: a browser, a simulator, a real server, containers. They run only with `e2e`. A command that runs them with the other tests and cannot be split is `not run` without `e2e`.
10. A hook is not a check: `pre-commit`, `husky`, `lint-staged`. It fixes and it stages.
11. A stack with no reference file is checked from rows 1 to 3 of the table.

### Running

1. One check at a time. Two runs at once fight over ports, caches and databases.
2. Keep the whole output and the exit code. Send the output to a file in a folder made with `mktemp -d`, print the code, then read the file:

   ```sh
   CI=true NO_COLOR=1 npm run lint > "$logs/lint.txt" 2>&1; echo "exit $?"
   ```

3. Never pipe a check into `tail`, `head` or `grep`. The pipe cuts the output, and the exit code you get is the pipe's.
4. `CI=true` goes on every check. In most tools it turns off watch mode, questions and the writing of new snapshots. `NO_COLOR=1` keeps color codes out of the output.
5. Give each check a time limit that fits it. A check that is not done by then is stopped: it watches files, waits for a key, or hangs.
6. Run from the folder the docs and the CI config run from.
7. Tests that need a service which is not up are `not run`: a database, a queue, a container. Do not start it.
8. Tests run on a test database only. When the test config points at the app's own database, they are `not run`: many suites wipe the database they run on.
9. Secret files like `.env` stay closed. A check that needs a secret you do not have is `not run`.

### Results

| Result    | Means                                                                                                       |
| --------- | ----------------------------------------------------------------------------------------------------------- |
| `pass`    | It ran to its end with exit code 0, and its output shows that it did its work                               |
| `fail`    | It ran, and it ended with another code, reported a failure in its output, or was stopped at the time limit  |
| `not run` | It could not run, or must not: a missing tool or dependency, a service that is not up, a rule of this skill |

1. The exit code and the output decide together. Code 0 with a failure in the output is `fail`. The reference file names the tools that do this.
2. A run that checked nothing is `not run`: no tests found, no files matched.
3. A warning is not a failure. A check that ends with code 0 is `pass`, warnings and all.
4. Run each check once. A check that failed is `fail`, also when a second run would pass.
5. Every failure is a `fail`. Do not sort failures into old and new, or into the change's and someone else's.
6. The output of a `fail` goes in the report as it came, in a code block. Not summed up, not retyped.
7. From an output of more than 200 lines, the lines that report no failure may go: passing tests, progress, downloads. Each cut is marked with a line like `[120 lines cut]`. Every line of a failure stays.
8. A `not run` gets its reason in one line, and the command that would make it run when there is one, like the install command.

### App

1. The start command comes from the project: its docs, its task runner, a `Procfile`, a compose file. The reference file says where the stack keeps it. When you cannot find it, say so and stop. Never guess one, and never try several.
2. Start the app the way a developer does on their own machine: the dev command, the dev config. Never a production config, and never against a service that is not local.
3. What the app needs must be there already: its dependencies, its database, its env file, its other services. Do not make them: no migration, no seed, no key, no container. What is missing is a question.
4. Start it in the background, with its output in a file outside the project. Keep its process id.
5. Wait until it is up: its output says so, and its port answers. Ask the port once a second, for a minute, or for as long as a first build takes. Never a blind `sleep`.
6. Read the port from the output. A dev server whose port is taken often moves to the next one.
7. A port that is taken belongs to someone else. Never stop a process you did not start, and never try the app on it: it may run other code. Start on a free port when the app has a setting for it. Otherwise stop and say so.
8. Before each try, write what should happen: what the goal, the plan or the finding says the app does. Then do the smallest real thing that shows it: a request with `curl -i`, a command, a page in a browser tool when the session has one.
9. With nothing given to try, try what the change lets a user do: read `git status` and `git diff`. Try the way that should work, and one that should be refused. A few tries, not a test plan.
10. A try is a row in the table. Its check is `Try:` and what should happen. Its command is the request or the steps. It is `pass` when what a user would see is right: the status, and the body or the page.
11. A finding to try is written as what the app should do, like "a stranger gets 401 from `GET /orders/7`". `fail` means that the hole is open.
12. Try only the app you started, from this tree, on this machine. Never a deployed app, a staging one included.
13. A try that reaches outside is `not run`: a real email, a payment, a message, a call to a service that is not local.
14. Log in as a user the project made for it, from its seed data or its docs. Never as a real person. With no such user, it is a question.
15. Use made-up data that looks made up. Never change or delete data that was there. What you made and could not remove through the app is a line in the notes.
16. What you could not see, the row says: a page tried by its requests only, with no browser tool.
17. An app that does not come up is one row: `fail`, with its output.
18. Stop the app when the tries are done, also after a failed one: the process you started, and its children. Then ask the port once more. It must refuse.

## Report

| #   | Part          | Holds                                                                                                                                                             |
| --- | ------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | **Checks:**   | A numbered table with the columns `#`, `Check`, `Command` and `Result`. In the order they ran, the tries on the app last. One line when the project has no checks |
| 2   | **Output:**   | For each `fail`, its number and its output in a code block. For each `not run`, its number and the reason in one line. Left out when every row is `pass`          |
| 3   | **Notes:**    | A numbered list: a kind with no check, a file that a check changed, data or a process left behind. Left out when empty                                            |
| 4   | **Question:** | The decision that stopped the run. Left out when there is none                                                                                                    |

Nothing else: no intro, no summary, no cause, no advice, no commit message.

## Traps

What models get wrong most, and what to do instead.

1. Reporting from the last lines of the output: "the tests pass", read off a tail. The exit code and the whole output decide.
2. A pipe that eats the exit code: `npm test | tail` ends with the code of `tail`. Send the output to a file.
3. A check that never ends: a watch mode, a question, a server. Set `CI=true`, and stop it at the time limit.
4. Running the form that fixes: `--fix`, `--write`, `-u`, a `format` script. Run the form that only checks.
5. A check the project does not have: a type checker with no config, a linter fetched for the run. No row.
6. Installing to get a check to run. It is `not run`, with the install command.
7. Only the tests near the change, or a stop at the first failure. Every check, whole.
8. Running a failed check again until it passes, or calling it flaky. Once, and `fail`.
9. Sorting the failures: "not from this change", "failed before too". Or stashing the change to find out. Every failure is a `fail`.
10. Explaining a failure, or adding how to fix it. Print the output.
11. Fixing a small thing to get further: an import, a typo, a config value. Never.
12. Retelling the output: "3 tests fail in auth". Print it as it came.
13. `pass` for a run that checked nothing: no tests found, no files matched. It is `not run`.
14. Starting the app or the end-to-end tests to be sure. Only when asked.
15. Trying start commands until one works. Find the written one, or stop.
16. Stopping whatever holds the port. It is not yours.
17. A blind `sleep` before the first try, or a try on a server that is not up yet. Wait for the port.
18. A try with nothing to compare with: "the page loads", "returns 200". Write what should happen first.
19. Leaving the app running, or one of its children. Ask the port after the stop.
20. Putting a file back with git after a check changed it. Say it in the notes.

## Reference files

Each stack has a file: where its checks are, the command of each tool in the form that only checks, how to start its app, and its traps. The files are in `${CLAUDE_PLUGIN_ROOT}/skills/test/`. Open a file before you run a check of its stack. A project with several stacks gets each one's file.

| File            | Open it when the project has                            |
| --------------- | ------------------------------------------------------- |
| `javascript.md` | A `package.json` or a `deno.json`                       |
| `python.md`     | A `pyproject.toml`, a `requirements.txt` or `.py` files |
| `go.md`         | A `go.mod`                                              |
| `rust.md`       | A `Cargo.toml`                                          |
| `jvm.md`        | A `pom.xml`, a `build.gradle` or a `build.gradle.kts`   |
| `dotnet.md`     | A `.sln`, a `.csproj` or a `.fsproj` file               |
| `ruby.md`       | A `Gemfile`                                             |
| `php.md`        | A `composer.json`                                       |
