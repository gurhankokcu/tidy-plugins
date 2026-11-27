# tidy-git-guard

A hook for Claude Code that blocks every git command that changes state. Claude may read git. Staging, committing and the rest stay yours.

It covers the main session and every agent.

## Install

```sh
claude plugin marketplace add gurhankokcu/tidy-plugins     # once
claude plugin install tidy-git-guard@tidy-plugins
```

It needs Node.js. Without it the hook cannot run, and nothing is blocked.

## Use

Nothing to type. The hook runs before every Bash and PowerShell command from the moment the plugin is installed.

A blocked command never runs. Claude gets this message and asks you to run it:

```
Git is read-only: "git add ." is blocked. Ask the user to run it.
```

## How it works

| Part        | File                   | Job                                                                 |
| ----------- | ---------------------- | ------------------------------------------------------------------- |
| Hook config | `hooks/hooks.json`     | One `PreToolUse` entry, matcher `Bash\|PowerShell`                  |
| Check       | `hooks/check.mjs`      | Decides if a command may run                                        |
| Tests       | `hooks/check.test.mjs` | The commands the check must allow and block. Run with `node --test` |

### What it lets through

| Command                                                                                 | Detail                                                                                |
| --------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| `blame`, `describe`, `diff`, `log`, `ls-files`, `shortlog`, `show`, `status`            | With any arguments                                                                    |
| `cat-file`, `for-each-ref`, `ls-tree`, `merge-base`, `rev-list`, `rev-parse`, `version` | With any arguments                                                                    |
| `git branch`                                                                            | List forms only: no arguments, `-a`, `-r`, `-v`, `-vv`, `--list`, `--show-current`, … |
| `git remote`                                                                            | No arguments, `-v` or `--verbose`                                                     |
| `git grep`                                                                              | Except `-O` and `--open-files-in-pager`, which run a command                          |
| Every command that is not git                                                           | The hook only looks for git                                                           |

### What it blocks

| Blocked                    | Examples                                                                                                                                      |
| -------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| Every other git command    | `git add`, `git commit`, `git stash`, `git checkout`, `git reset`, `git push`, `git pull`                                                     |
| Tools that run git         | `gh pr checkout`, `gh pr merge`, `gh repo sync`, and `version` of `npm`, `pnpm` and `yarn`                                                    |
| Git config on the git line | `git -c …`, `git --config-env …`, `GIT_PAGER=cat git log`, `export GIT_…`. A config value can make a read run a command. Use `git --no-pager` |

It looks through the usual ways to hide a command:

| Form                         | Examples                                                                                            |
| ---------------------------- | --------------------------------------------------------------------------------------------------- |
| Git by path, global options  | `/usr/bin/git add .`, `git -C dir commit`                                                           |
| Chains, blocks, new lines    | `ls && git add .`, `( git add . )`, `if …; then git add .; fi`                                      |
| Quotes and redirects         | `"git" add .`, `git add . > out.txt`                                                                |
| Wrappers                     | `sudo`, `doas`, `env`, `exec`, `command`, `nice`, `nohup`, `time`, `timeout`, `xargs`, `find -exec` |
| Shell scripts                | `bash -c "git add ."`, `bash <<< "git add ."`, a heredoc into a shell                               |
| `eval`, `$(…)` and backticks | `eval "git add ."`, `echo $(git stash)`                                                             |
| A shell that reads a pipe    | `echo … \| sh`, blocked when the command mentions git                                               |

## Limits

It is a guard rail, not a sandbox. It guards against an agent that runs git by habit, or tries the usual ways around a block. It does not stop someone working to get past it.

| Not caught                                                        |
| ----------------------------------------------------------------- |
| A script file, or another language, that runs git                 |
| `GIT_*` set on another line, or with `declare`, `typeset` or `+=` |
| `git grep` options built by shell expansion                       |
| Quoting tricks around a redirect                                  |
| A command inside a wrapper's argument, like `env -S "git add ."`  |
| A wrapper it does not know, like `caffeinate git add .`           |
| Git under another name, like `git.exe` or an alias                |
| A global option it does not know that takes a value               |
| A `#` that bash does not read as a comment, like `x=(a)#`         |
| A comment that holds a heredoc mark, like `# see <<EOF`           |
| PowerShell forms that bash does not have, like `iex "git add ."`  |

It ships no permission rules. A plugin can carry a hook, not a deny list. For a second layer, add your own `deny` rules to `settings.json`, like `Bash(git commit:*)`.
