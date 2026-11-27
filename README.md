# tidy-plugins

Plugins for Claude Code. Each one installs on its own.

The idea behind all of them: the human stays in charge. Small steps, gates, blind review, read-only git.

## Plugins

| Plugin                                     | What it is                                                                                  |
| ------------------------------------------ | ------------------------------------------------------------------------------------------- |
| [`tidy-dev`](plugins/tidy-dev)             | A software development team: one manager the user talks to, and specialists who do the work |
| [`tidy-office`](plugins/tidy-office)       | A pixel office in the browser that shows each agent at its desk while it works              |
| [`tidy-git-guard`](plugins/tidy-git-guard) | A hook that blocks every git command that changes state                                     |

## Install

```sh
claude plugin marketplace add gurhankokcu/tidy-plugins     # once
claude plugin install tidy-dev@tidy-plugins
claude plugin install tidy-office@tidy-plugins
claude plugin install tidy-git-guard@tidy-plugins
```

| Action             | Command                                         |
| ------------------ | ----------------------------------------------- |
| Update             | `claude plugin update tidy-dev@tidy-plugins`    |
| Remove             | `claude plugin uninstall tidy-dev@tidy-plugins` |
| In `settings.json` | `"tidy-dev@tidy-plugins": true`                 |

## Use

| Action                       | Command                               |
| ---------------------------- | ------------------------------------- |
| Talk to the team             | `claude --agent tidy-dev:manager`     |
| Use one active skill by hand | `/tidy-dev:plan`, `/tidy-dev:test`, … |
| Open the office              | `/tidy-office:open`                   |

`tidy-git-guard` has nothing to type. It works from the moment it is installed.

## License

[MIT](LICENSE)
