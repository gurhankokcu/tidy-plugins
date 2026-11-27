# tidy-office

A pixel office in the browser for Claude Code and opencode. Each agent sits at its desk while it works and leaves when it is done.

It works for any team of agents, with no setup.

## Install

It needs Node.js. Tested in Claude Code 2.1.332 and opencode 2.3.1.

### Claude Code

```sh
claude plugin marketplace add gurhankokcu/tidy-plugins     # once
claude plugin install tidy-office@tidy-plugins
```

### opencode

```sh
opencode plugin add 'github:gurhankokcu/tidy-plugins#main::path:plugins/tidy-office'
```

It needs opencode V2. The plugin follows the plugin API of opencode 2.3.1.

## Use

In a session, type:

| Tool        | Command             |
| ----------- | ------------------- |
| Claude Code | `/tidy-office:open` |
| opencode    | `/tidy-office/open` |

It starts the server, or reuses it, and opens the page for this session.

The office comes from the main agent's name:

| Main agent         | Claude Code                       | opencode                     | Office                                                        |
| ------------------ | --------------------------------- | ---------------------------- | ------------------------------------------------------------- |
| An agent of a team | `claude --agent tidy-dev:manager` | The `tidy-dev/manager` agent | The `tidy-dev` office, with a desk for each agent of the team |
| Any other agent    | Plain `claude`                    | The `build` agent            | A default office with an "Agent" desk and a "Guests" desk     |

## How it works

| Part             | File                                                           | Job                                                                                          |
| ---------------- | -------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| Recorder         | `hooks/journal.mjs`                                            | Writes one line per event to the file of its session                                         |
| Claude Code side | `skills/open/SKILL.md`, `hooks/hooks.json`, `hooks/record.mjs` | The `/tidy-office:open` skill, and seven hooks that feed the recorder                        |
| opencode side    | `index.js`, `package.json`                                     | The `/tidy-office/open` command, and the session events and tool hook that feed the recorder |
| App              | `app/server.mjs`, `app/index.html`                             | Serves the page and streams the events to it                                                 |
| Files            | `app/files.mjs`                                                | Reads the installed Claude Code plugins and their agent files                                |
| Status line      | `statusline.mjs`                                               | The status line. Copied to the data folder when a session starts                             |

### What gets recorded

One line per event goes to a file on your machine. Nothing leaves it.

| Recorded                  | Detail                                                                                                                   |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| Events                    | `SessionStart`, `UserPromptSubmit`, `PreToolUse`, `SubagentStart`, `SubagentStop`, `Stop`, `SessionEnd`                  |
| The session's folder      | The full path, on session start                                                                                          |
| Each agent                | Its ID, type, model and effort                                                                                           |
| Each tool call            | The tool name and a summary of up to 80 characters: a file name, a search pattern, or a shell command or its description |
| Each agent's last message | The first 280 characters                                                                                                 |

The text of your prompts is not recorded. A shell command can hold a secret; its first 80 characters land in the file.

| Point       | Claude Code                                                                                                              | opencode                                                                               |
| ----------- | ------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------- |
| Source      | Seven hooks, one per event                                                                                               | Session events and a hook before each tool call, written under the same seven names    |
| Subagents   | Their own start and stop hooks                                                                                           | Each runs in a child session. Its events go to the file of the session that started it |
| Agent files | The model and effort of every agent file, from `~/.claude/agents`, the project's `.claude/agents`, and installed plugins | Not read. The model and its variant come with the events                               |
| Where       | `~/.claude/plugins/data/tidy-office-tidy-plugins/<session>.jsonl`                                                        | `~/.local/share/tidy-office/<session>.jsonl`                                           |
| Speed       | The hooks run in the background, so they never slow a session down                                                       | One small write per event, inside opencode                                             |

Files older than a day are deleted when a session starts.

### The server

| Point    | Detail                                                                                                                                           |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| Address  | `127.0.0.1` only, on port 7341 for Claude Code and 7342 for opencode, so both offices can run at once. Set `TIDY_OFFICE_PORT` to change the port |
| Requests | GET only, with a check of the `Host` header                                                                                                      |
| Stops    | 30 seconds after its last tab closes                                                                                                             |
| Code     | Node built-ins only                                                                                                                              |

### Desks

| Rule               | Behavior                                                                           |
| ------------------ | ---------------------------------------------------------------------------------- |
| Layout             | The main agent's desk on top, the rest below                                       |
| Desks              | One per agent of the team: the name as the title, the agent's `color` as the shirt |
| Guests             | Agents from outside the team sit at the guest desk, labelled with their type       |
| Same agent at once | The desk grows to 3 seats. More show as a `+N` badge                               |
| Name plate         | The seat name, and under it the model and effort                                   |
| Bubble             | What the agent is doing while it works. Its last message when it stops             |

| Point         | Claude Code                                     | opencode                                                                |
| ------------- | ----------------------------------------------- | ----------------------------------------------------------------------- |
| A team        | An installed plugin with agent files            | The agents with an ID of the form `team/agent`                          |
| Shirt         | The `color` name of the agent file, like `blue` | The agent's `color`, when it is a hex value like `#4f8fe8`              |
| `office.json` | Read from the root of the team's plugin         | Not read, so the titles are the agent names and the desks have no items |

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

In Claude Code, the header can show your 5h and 7d usage limits. A plugin cannot read them; only a status line can. The bar stays hidden until a status line writes the data. In opencode it stays hidden.

The plugin ships a status line, `statusline.mjs`. A plugin cannot turn a status line on, so add it to `~/.claude/settings.json` yourself:

```json
{
  "statusLine": {
    "type": "command",
    "command": "node ~/.claude/plugins/data/tidy-office-tidy-plugins/statusline.mjs"
  }
}
```

The script is copied to the data folder each time a session starts, so the path stays the same across plugin updates. Start one session with the plugin before you add the line.

Remove the line when you uninstall or disable the plugin. An uninstall deletes the script, so the status line goes blank. A disabled plugin leaves the last copy running.

| Shown   | Detail                                                       |
| ------- | ------------------------------------------------------------ |
| Project | The project folder and the git branch                        |
| Model   | The model, the effort, and whether thinking and fast are on  |
| Session | The context size, the model time, the session time, the cost |
| Limits  | The 5h and 7d limits, each with the time left                |

It also writes `limits.json` for the bar, and `<session>.status.json`, which gives the page the session's model and effort for the name plates.

## Limits

| Limit                     | Tool        | Detail                                                                                                                                   |
| ------------------------- | ----------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| A view, not a control     | Both        | The page only shows. It cannot stop or steer an agent                                                                                    |
| Agents it cannot find     | Claude Code | A plugin loaded with `--plugin-dir`, agents in a subfolder, and agents listed in a manifest's `agents` field. They sit at the guest desk |
| Agents it cannot find     | opencode    | An agent whose ID is not of the form `team/agent`. It sits at the guest desk                                                             |
| An agent stopped with Esc | Claude Code | It never reports that it stopped. It leaves when the next prompt is sent                                                                 |
| A run with `claude -p`    | Claude Code | It exits before the hook of its last `Stop` is done, so that `Stop` is not recorded                                                      |
| The limits bar            | Claude Code | It only changes while a session runs its status line                                                                                     |
| The data folder path      | Claude Code | Another plugins root (`CLAUDE_CODE_PLUGIN_CACHE_DIR`) moves it, and the status line command must follow                                  |
