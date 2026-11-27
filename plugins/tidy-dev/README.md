# tidy-dev

A software development team for Claude Code and opencode: one manager you talk to, and specialists who do the work.

You stay in charge. The team works in small steps, stops at every gate, reviews its own work blind, and never touches git.

## Install

The agents and skills are written once, and both tools use the same files. Tested in Claude Code 2.1.332 and opencode 2.3.1. In opencode the manager's build and review flow has not had a full run.

### Claude Code

```sh
claude plugin marketplace add gurhankokcu/tidy-plugins     # once
claude plugin install tidy-dev@tidy-plugins
```

### opencode

```sh
opencode plugin add 'github:gurhankokcu/tidy-plugins#main::path:plugins/tidy-dev'
```

It needs opencode V2. The plugin follows the plugin API of opencode 2.3.1. It adds the agents, the skills and a command for each skill when opencode starts, and writes no files.

## Use

Start the manager and talk to it:

| Tool        | Start                                                                                              |
| ----------- | -------------------------------------------------------------------------------------------------- |
| Claude Code | `claude --agent tidy-dev:manager`                                                                  |
| opencode    | Pick the `tidy-dev/manager` agent, or set `"default_agent": "tidy-dev/manager"` in `opencode.json` |

| You say                                        | The manager does                                                                                                   |
| ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| "plan a login page"                            | Sends the `planner`, shows the plan, waits for go or changes                                                       |
| "go", or "next"                                | Sends the `developer` for the plan or the named steps. Passes on any question                                      |
| "review", "review full", "review only the API" | Sends the `reviewer` and `security` at the same time, plus the `tester` if asked. Runs the debate. Shows the table |
| "fix 1 and 3"                                  | Resumes the `developer` with the numbers, then runs the `tester`                                                   |
| "test"                                         | Sends the `tester`                                                                                                 |
| "debug: login fails on Safari"                 | Sends the `tester` to find the cause                                                                               |
| "debug check 2"                                | Sends the `tester` to find the cause of a failing check                                                            |
| A pasted outside review                        | Resumes or starts the `developer` to answer each point                                                             |

| Work           | Flow                                           |
| -------------- | ---------------------------------------------- |
| Feature        | plan → develop → develop → review → fix → test |
| Bug            | debug → fix → test                             |
| Outside review | reply → fix → test                             |

Review words:

| You say         | Meaning                         |
| --------------- | ------------------------------- |
| Nothing more    | Staged changes only, checks off |
| "all"           | Adds unstaged changes           |
| "full"          | Turns the checks on             |
| "e2e"           | Adds the end-to-end tests       |
| Any other words | The focus                       |

After a build, the manager reviews staged and unstaged changes with the checks on.

### Gates

The manager stops at every gate and waits for you.

| Gate                  | You get                                               | You answer                           |
| --------------------- | ----------------------------------------------------- | ------------------------------------ |
| Plan ready            | Goal, steps, questions                                | go, or changes                       |
| Developer blocked     | Its question                                          | The answer                           |
| Review done           | Verdict, real thoughts, checks, findings with results | Numbers to fix, or a check to debug  |
| Fixes done            | What changed, the tester's checks                     | re-review, a check to debug, or done |
| Outside review pasted | The developer's verdict on each point                 | Numbers to fix                       |
| Bug diagnosed         | The numbered causes with suggested fixes              | Numbers to fix                       |
| Check failed          | The tester's table, with the failing output           | A check to debug, or done            |

### Hands-on skills

Without the manager, start a plain session and type one skill at a time. Each skill holds the whole job, so your session does the work the agent would do.

| Claude Code                              | opencode                                 | Does                                                                  |
| ---------------------------------------- | ---------------------------------------- | --------------------------------------------------------------------- |
| `/tidy-dev:plan <feature>`               | `/tidy-dev/plan <feature>`               | Splits the feature into small numbered steps. Changes no code         |
| `/tidy-dev:develop [steps] [notes]`      | `/tidy-dev/develop [steps] [notes]`      | Builds the given step with its tests, or the next step not built      |
| `/tidy-dev:review [all] [focus]`         | `/tidy-dev/review [all] [focus]`         | Reviews the change in a fresh `reviewer` agent, so it stays blind     |
| `/tidy-dev:security-check [all] [focus]` | `/tidy-dev/security-check [all] [focus]` | Reviews the change for security in a fresh `security` agent           |
| `/tidy-dev:reply <pasted review>`        | `/tidy-dev/reply <pasted review>`        | Answers each point of a review with a verdict. Changes no code        |
| `/tidy-dev:fix <numbers>`                | `/tidy-dev/fix <numbers>`                | Fixes the picked numbers and touches nothing else                     |
| `/tidy-dev:test [e2e] [app] [focus]`     | `/tidy-dev/test [e2e] [app] [focus]`     | Runs lint, type checks and tests. `app` also starts the app           |
| `/tidy-dev:debug <bug>`                  | `/tidy-dev/debug <bug>`                  | Finds the cause of a bug and reports numbered causes. Changes no code |

| Tool        | How the fresh agent of a review starts    |
| ----------- | ----------------------------------------- |
| Claude Code | The command runs in it                    |
| opencode    | The command asks your session to start it |

The full debate is the manager's job. By hand it is one round at a time.

## How it works

### The team

| Agent       | Job                                                                                  | Edits code |
| ----------- | ------------------------------------------------------------------------------------ | ---------- |
| `manager`   | The one you talk to. Runs the others, stops at every gate                            | No         |
| `planner`   | Reads the code, judges the approach, splits a feature into small steps               | No         |
| `developer` | Builds steps with their tests, answers reviews, fixes picked points                  | Yes        |
| `reviewer`  | The general review: correctness, design, quality. Blind to the developer's reasoning | No         |
| `security`  | Reviews the same change for security only. Blind too                                 | No         |
| `tester`    | Runs the checks, tries the app when asked, finds the cause of bugs                   | No         |

| Tool        | Model                                                                    |
| ----------- | ------------------------------------------------------------------------ |
| Claude Code | All six run on `opus`. The manager uses `medium` effort, the rest `high` |
| opencode    | All six run on the model of the session                                  |

This costs tokens: a review runs the reviewer, security and the developer over up to three rounds, plus the tester when the checks are on. In Claude Code, each agent file sets its own model. To run the five agents the manager starts on another one, set both `CLAUDE_CODE_SUBAGENT_MODEL` and `CLAUDE_CODE_SUBAGENT_MODEL_FORCE=1`. That needs Claude Code v2.1.257 or later.

`office.json` gives the team its desks in the `tidy-office` plugin. It does nothing without that plugin, and the office does not read it in opencode.

### The skills

The agent files are thin. The work lives in ten skills.

| Skill            | Used by                             | Holds                                                                                |
| ---------------- | ----------------------------------- | ------------------------------------------------------------------------------------ |
| `clean-code`     | `planner`, `developer`, `reviewer`  | The code standards: symmetry, naming, comments, simple design, good tests            |
| `secure-code`    | `planner`, `developer`, `security`  | The security standards: input checks, access checks, secrets, safe defaults          |
| `plan`           | `planner`                           | Read the code, judge the approach, split into small steps                            |
| `develop`        | `developer`                         | Build only the given step, with its tests                                            |
| `fix`            | `developer`                         | Fix only the picked numbers                                                          |
| `reply`          | `developer`, `reviewer`, `security` | Answer a review point or a push back with a verdict and a one-line reason            |
| `review`         | `reviewer`                          | The review method, the kinds of problems to hunt, the verdict and the findings table |
| `security-check` | `security`                          | The security method, one reference file per area, the findings table                 |
| `test`           | `tester`                            | Run the checks for any stack. When asked, start the app and try the change           |
| `debug`          | `tester`                            | Reproduce the bug, narrow it down, find the cause                                    |

`clean-code` and `secure-code` are standards, not jobs. They have no `/` command.

In opencode a skill's name starts with `tidy-dev-`, like `tidy-dev-plan`.

### The review debate

The reviewer and security get the plan and the diff, never the developer's reasoning.

1. The reviewer gives a verdict (`ship`, `ship after fixes`, `rethink`), real thoughts, and findings. Security gives its findings.
2. The developer answers each finding: `agree`, `nit` or `push back`.
3. The reviewer and security answer each push back: `accept` or `hold`.
4. The developer answers each held point: `accept` or `hold`.

| Result     | Meaning                                         |
| ---------- | ----------------------------------------------- |
| `agreed`   | The developer agreed, or accepted after a hold  |
| `nit`      | The developer called it a nit                   |
| `dropped`  | The reviewer or security accepted the push back |
| `disputed` | Both held. One line of reason from each side    |

You decide the disputed ones.

## Limits

### Git is yours

The team never stages, commits or stashes. This is a feature.

| Rule                                                                    | Detail                                              |
| ----------------------------------------------------------------------- | --------------------------------------------------- |
| The team's promise                                                      | A change ready for you to commit                    |
| The developer ends each report with a lowercase one-line commit message | You commit                                          |
| It is in the agents' own rules                                          | It holds with or without `tidy-git-guard` installed |

Why: a commit is your approval. Staged means "seen", unstaged means "new work", and an agent that stages breaks that meaning. Git is the undo.

The cost: you are the slow part, and a long run without you gives one large diff.

### Scope

The team's work ends at the working tree.

| Covered                                    | Not covered                 |
| ------------------------------------------ | --------------------------- |
| Plan, build, review, security review, test | Release, deploy, production |
| Finding the cause of a bug                 | Interface design            |
| Answering a review from somewhere else     | Work in parallel            |
| Docs, when a plan step says so             | Git writes                  |
