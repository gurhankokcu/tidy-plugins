# tidy-office

A pixel office in the browser. Each agent sits at its desk while it works and leaves when it is done.

It works for any team of agents, with no setup.

## Install

```sh
claude plugin marketplace add gurhankokcu/tidy-plugins     # once
claude plugin install tidy-office@tidy-plugins
```

It needs Node.js.

## Use

In a Claude Code session, type:

```
/tidy-office:open
```

It starts the server, or reuses it, and opens the page for this session.

The office comes from the main agent's name. `claude --agent tidy-dev:manager` opens the `tidy-dev` office, with a desk for each agent of that plugin. Plain `claude` opens a default office with an "Agent" desk and a "Guests" desk.

## How it works

| Part  | File                                   | Job                                                         |
| ----- | -------------------------------------- | ----------------------------------------------------------- |
| Skill | `skills/open/SKILL.md`                 | Starts the server, or reuses it, and opens the page         |
| Hooks | `hooks/hooks.json`, `hooks/record.mjs` | Writes each session, prompt, tool and agent event to a file |
| App   | `app/server.mjs`, `app/index.html`     | Serves the page and streams the events to it                |
| Files | `app/files.mjs`                        | Reads the installed plugins and their agent files           |

### What gets recorded

The hooks write one line per event to a file on your machine. Nothing leaves it.

| Recorded                                 | Detail                                                                                                                   |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| Events                                   | `SessionStart`, `UserPromptSubmit`, `PreToolUse`, `SubagentStart`, `SubagentStop`, `Stop`, `SessionEnd`                  |
| The session's folder                     | The full path, on session start                                                                                          |
| Each agent                               | Its ID, type, model and effort                                                                                           |
| Each tool call                           | The tool name and a summary of up to 80 characters: a file name, a search pattern, or a shell command or its description |
| Each agent's last message                | The first 280 characters                                                                                                 |
| The model and effort of every agent file | From `~/.claude/agents`, the project's `.claude/agents`, and installed plugins                                           |

The text of your prompts is not recorded. A shell command can hold a secret; its first 80 characters land in the file.

| Point    | Detail                                                            |
| -------- | ----------------------------------------------------------------- |
| Where    | `~/.claude/plugins/data/tidy-office-tidy-plugins/<session>.jsonl` |
| How long | Files older than a day are deleted when a session starts          |
| Speed    | The hooks run in the background, so they never slow Claude down   |

### The server

| Point    | Detail                                                           |
| -------- | ---------------------------------------------------------------- |
| Address  | `127.0.0.1:7341` only. Set `TIDY_OFFICE_PORT` to change the port |
| Requests | GET only, with a check of the `Host` header                      |
| Stops    | 30 seconds after its last tab closes                             |
| Code     | Node built-ins only                                              |

### Desks

| Rule               | Behavior                                                                                         |
| ------------------ | ------------------------------------------------------------------------------------------------ |
| Layout             | The main agent's desk on top, the rest below                                                     |
| Desks              | One per agent file of the team's plugin: the name as the title, the agent's `color` as the shirt |
| Guests             | Agents from outside the team sit at the guest desk, labelled with their type                     |
| Same agent at once | The desk grows to 3 seats. More show as a `+N` badge                                             |
| Name plate         | The seat name, and under it the model and effort                                                 |
| Bubble             | What the agent is doing while it works. Its last message when it stops                           |

A team plugin can add an `office.json` at its root to set titles and give each desk an item:

```json
{
  "title": "Software development",
  "guests": { "title": "Contractors" },
  "agents": {
    "manager": { "title": "Manager", "item": "phone" },
    "tester": { "title": "Tester", "item": "signal", "screen": "tests" }
  }
}
```

An agent takes `title`, `item`, `screen` and `shirt`, a color like `#4f8fe8`. The agents sit in the order of the file.

| Key      | Values                                                                                                                                                                             |
| -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `item`   | `phone`, `pinboard`, `coffee`, `clipboard`, `shield`, `safe`, `signal`, `books`, `magnifier`, `chart`, `megaphone`, `palette`, `camera`, `notebook`, `lamp`, `plant`. One per desk |
| `screen` | `tests` shows red and green lines while the agent works                                                                                                                            |

A desk with no `item` is empty, and so is one with a value the office does not know.

### The limits bar

The header can show your 5h and 7d usage limits. A plugin cannot read them; only a status line can. The bar stays hidden until a status line writes the data.

Add this to your own status line script. It reads the same JSON from stdin as the rest of the script:

```js
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

const DIR = join(homedir(), ".claude", "plugins", "data", "tidy-office-tidy-plugins");
const SESSION = /^[A-Za-z0-9-]+$/;

const { session_id, model, effort, rate_limits } = JSON.parse(readFileSync(0, "utf8"));

function limitWindow(window) {
  return window && { used_percentage: window.used_percentage, resets_at: window.resets_at };
}

mkdirSync(DIR, { recursive: true, mode: 0o700 });
if (rate_limits) {
  const limits = { five_hour: limitWindow(rate_limits.five_hour), seven_day: limitWindow(rate_limits.seven_day) };
  writeFileSync(join(DIR, "limits.json"), JSON.stringify(limits));
}
if (SESSION.test(session_id ?? "")) {
  writeFileSync(join(DIR, `${session_id}.status.json`), JSON.stringify({ model: model?.id, effort: effort?.level }));
}
```

`<session>.status.json` gives the page the session's model and effort for the name plates.

## Limits

| Limit                     | Detail                                                                                                                                   |
| ------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| A view, not a control     | The page only shows. It cannot stop or steer an agent                                                                                    |
| Agents it cannot find     | A plugin loaded with `--plugin-dir`, agents in a subfolder, and agents listed in a manifest's `agents` field. They sit at the guest desk |
| An agent stopped with Esc | It never reports that it stopped. It leaves when the next prompt is sent                                                                 |
| Limits                    | They only change while a Claude session runs its status line                                                                             |
| The data folder path      | Another plugins root (`CLAUDE_CODE_PLUGIN_CACHE_DIR`) moves it, and the status line snippet must follow                                  |
