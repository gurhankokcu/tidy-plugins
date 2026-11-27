import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { describe, test } from "node:test";
import { fileURLToPath } from "node:url";

const CHECK = fileURLToPath(new URL("check.mjs", import.meta.url));
const ALLOWED = 0;
const BLOCKED = 2;

const CASES = {
  "git reads": {
    allow: [
      "git",
      "git --version",
      "git --help",
      "git status",
      "git status --short",
      "git status -sb",
      "git diff",
      "git diff --staged",
      "git diff --stat HEAD~1",
      "git diff main...HEAD -- src",
      "git diff -C",
      "git log",
      "git log --oneline -5",
      "git log -p --follow README.md",
      "git log --format=%H -1",
      "git log -c",
      "git show",
      "git show HEAD",
      "git show HEAD:README.md",
      "git show --stat HEAD~2",
      "git blame README.md",
      "git blame -L 10,20 src/index.js",
      "git ls-files",
      "git ls-files --others --exclude-standard",
      "git rev-parse HEAD",
      "git rev-parse --show-toplevel",
      "git rev-parse --abbrev-ref HEAD",
      "git describe --tags",
      "git shortlog -sn",
      "git cat-file -p HEAD",
      "git for-each-ref --format=%(refname) refs/heads",
      "git ls-tree -r HEAD",
      "git merge-base main HEAD",
      "git rev-list --count HEAD",
      "git version",
    ],
  },

  "git writes": {
    block: [
      "git add .",
      "git add -A",
      "git add -p",
      'git commit -m "x"',
      "git commit --amend",
      "git commit -am x",
      "git stash",
      "git stash pop",
      "git stash list",
      "git checkout main",
      "git checkout -b new",
      "git checkout -- file",
      "git switch main",
      "git switch -c new",
      "git restore .",
      "git restore --staged file",
      "git reset",
      "git reset --hard HEAD~1",
      "git revert HEAD",
      "git merge main",
      "git rebase main",
      "git rebase --abort",
      "git cherry-pick abc123",
      "git pull",
      "git pull --rebase",
      "git push",
      "git push --force",
      "git push origin main",
      "git fetch",
      "git fetch --all",
      "git clone https://example.com/repo.git",
      "git init",
      "git tag v1",
      "git tag -d v1",
      "git rm file",
      "git mv a b",
      "git clean -fd",
      "git config user.name x",
      "git config --global core.editor vim",
      "git apply change.patch",
      "git am change.patch",
      "git gc",
      "git prune",
      "git worktree add ../x",
      "git submodule update --init",
      "git update-index --assume-unchanged file",
      "git update-ref refs/heads/x HEAD",
      "git bisect start",
      "git filter-branch --all",
    ],
  },

  "git branch and git remote": {
    allow: [
      "git branch",
      "git branch -a",
      "git branch -r",
      "git branch -v",
      "git branch -vv",
      "git branch --all",
      "git branch --list",
      "git branch --show-current",
      "git branch -a -vv",
      "git remote",
      "git remote -v",
      "git remote --verbose",
    ],
    block: [
      "git branch new",
      "git branch -d old",
      "git branch -D old",
      "git branch -m old new",
      "git branch -u origin/main",
      "git branch --set-upstream-to=origin/main",
      "git branch --unset-upstream",
      "git remote add origin https://example.com/repo.git",
      "git remote remove origin",
      "git remote rename a b",
      "git remote set-url origin https://example.com/repo.git",
      "git remote prune origin",
      "git remote update",
    ],
  },

  "git grep": {
    allow: [
      "git grep TODO",
      "git grep -n TODO",
      "git grep -n \"foo bar\" -- '*.js'",
      "git grep -i -w foo",
      "git grep -c foo",
      "git grep -l foo",
      "git grep -o foo",
      "git grep -e foo --and -e bar",
      "git grep --or -e foo -e bar",
      "git grep --only-matching foo",
      "git grep -A3 --max-depth=1 foo src",
      'git grep -E "a|b" src',
      "git grep foo HEAD~1",
      "git --no-pager grep foo",
    ],
    block: [
      "git grep -O foo",
      "git grep -Oless foo",
      "git grep -nO foo",
      'git grep "-O" foo',
      "git grep foo -O",
      "git grep --open-files-in-pager foo",
      "git grep --open-files-in-pager=less foo",
      "git grep --open foo",
    ],
  },

  "git by path, by case and with global options": {
    allow: [
      "/usr/bin/git status",
      "/opt/homebrew/bin/git log",
      "./git status",
      "GIT status",
      '"git" status',
      "'git' log",
      "\\git status",
      "git -C plugins status",
      "git -C plugins --no-pager log",
      "git --no-pager diff",
      "git -P log",
      "git --git-dir .git status",
      "git --git-dir=.git --work-tree=. status",
    ],
    block: [
      "/usr/bin/git add .",
      "/opt/homebrew/bin/git push",
      "./git add .",
      "GIT add .",
      '"git" add .',
      "'git' commit -m x",
      "\\git add .",
      "git -C plugins commit -m x",
      "git --no-pager push",
      "git --git-dir .git --work-tree . add .",
      "git --work-tree=. checkout .",
    ],
  },

  "git config from the command line": {
    allow: [
      "FOO=1 git status",
      "env FOO=1 git status",
      "export FOO=1",
      "export PATH=$PATH:/x",
      "GIT_DIR=x ls",
      "echo $GIT_DIR",
      "unset GIT_DIR",
      "make GIT_SHA=abc",
      "docker build --build-arg GIT_COMMIT=abc .",
    ],
    block: [
      "git -c core.pager=cat log",
      "git -ccore.pager=cat log",
      "git --config-env=core.pager=PAGER log",
      "git -C plugins -c a=b status",
      "git --no-pager -c color.ui=always diff",
      "GIT_PAGER=cat git log",
      "GIT_DIR=.git git status",
      "FOO=1 GIT_PAGER=cat git log",
      "env GIT_PAGER=cat git log",
      "sudo GIT_DIR=/x git status",
      "export GIT_PAGER=cat",
      "export FOO=1 GIT_EDITOR=vim",
    ],
  },

  "commands that are not git": {
    allow: [
      "ls -la",
      "npm install",
      "node script.js",
      'echo "git commit"',
      "echo 'git add .'",
      "echo git add .",
      "echo done # git add .",
      "# git add .",
      "# it's staged\ngit status",
      "printf '%s\\n' \"git stash\"",
      'grep -r "git push" docs',
      'rg "git reset" .',
      "cat .gitignore",
      "cat git.md",
      "ls .git",
      "mkdir git",
      "cd git-tools",
      "gitk",
      "git-lfs status",
      "legit add .",
      "which git",
      "command -v git",
    ],
  },

  "quotes and line breaks": {
    allow: [
      "git log --grep='fix; add'",
      "git log --grep 'a && git add .'",
      "git log --format='%h | %s'",
      'git log --author="A <a@example.com>"',
      'echo "a; git add ."',
      "git log \\\n  --oneline",
      "git status\ngit diff",
    ],
    block: [
      'git commit -m "fix; update"',
      'git commit -m "it\'s done"',
      "git \\\n  add .",
      "git status\ngit add .",
      "cd plugins\ngit status\ngit commit -m x",
      "# let's stage it\ngit add .",
      "echo hi # it's done\ngit commit -m x",
      "git status # that's all\ngit add .",
      "echo a#b; git add .",
      "cat <<EOF\nit's here\nEOF\n# let's go\ngit add .",
    ],
  },

  "chains and blocks": {
    allow: [
      "git status && git diff",
      "git status; git log",
      "git log || true",
      "git diff | grep foo",
      "git log | head -5",
      "git status & wait",
      "cd plugins && git status",
      "(git status)",
      "{ git status; }",
      "! git diff --quiet",
      "if git diff --quiet; then echo clean; fi",
      "for f in a b; do git log -1 -- $f; done",
      "while git diff --quiet; do sleep 1; done",
      "f() { git status; }",
    ],
    block: [
      "git status && git add .",
      "git status; git commit -m x",
      "git status || git stash",
      "git diff | git apply",
      "git status & git push",
      "cd plugins && git commit -m x",
      "npm test && git push",
      "(git add .)",
      "{ git add .; }",
      "! git add .",
      "if true; then git add .; fi",
      "if git diff --quiet; then echo clean; else git stash; fi",
      "if false; then ls; elif git pull; then ls; fi",
      "for f in a b; do git add $f; done",
      "while true; do git pull; done",
      "until git push; do sleep 1; done",
      "case x in x) git add . ;; esac",
      "f() { git add .; }",
      "function f { git add .; }",
    ],
  },

  "variable assignments before the command": {
    allow: ["FOO=1 git status", "FOO=1 BAR=2 git log", "FOO=1 ls"],
    block: ["FOO=1 git add .", "FOO=1 BAR=2 git commit -m x"],
  },

  wrappers: {
    allow: [
      "sudo git status",
      "sudo ls",
      "doas git status",
      "env git status",
      "env FOO=1 node script.js",
      "command git log",
      "exec git status",
      "nohup git status",
      "noglob git log",
      "time git status",
      "time npm test",
      "timeout 5 git log",
      "nice -n 5 git diff",
    ],
    block: [
      "sudo git add .",
      "sudo -u root git add .",
      "sudo -E git push",
      "sudo -u root -- git add .",
      "/usr/bin/sudo git add .",
      "sudo /usr/bin/git add .",
      "doas git add .",
      "doas -u root git commit -m x",
      "env git add .",
      "env FOO=1 git add .",
      "env -i git commit -m x",
      "/usr/bin/env git add .",
      "command git commit -m x",
      "exec git add .",
      "nohup git push",
      "nohup git push &",
      "noglob git add .",
      "time git stash",
      "time -p git stash",
      "timeout 5 git pull",
      "timeout 5s git pull",
      "timeout -s KILL 5 git pull",
      "nice git add .",
      "nice -n 5 git add .",
      "sudo env nice git add .",
      "sudo npm version patch",
      'sudo bash -c "git add ."',
    ],
  },

  "xargs and find": {
    allow: [
      "echo x | xargs git log",
      "echo x | xargs git show",
      "git ls-files | xargs wc -l",
      "echo x | xargs echo",
      'find . -name "*.js"',
      "find .git -name config",
      "find . -name x -exec cat {} \\;",
      "find . -name x -exec git status \\;",
      "find . -name x -exec git log -1 -- {} \\;",
    ],
    block: [
      "ls | xargs git add",
      "git ls-files | xargs git add",
      "echo x | xargs git",
      "echo x | xargs git branch",
      "echo x | xargs git grep foo",
      "echo x | xargs -n 1 git rm",
      "echo x | xargs -I {} git add {}",
      'find . -name "*.js" -exec git add {} \\;',
      "find . -name x -exec git add {} +",
      "find . -name x -execdir git rm {} \\;",
      "find . -type f -ok git add {} \\;",
      "find . -name x -exec git branch {} \\;",
      "find . -name x -exec sh -c 'git add \"$1\"' _ {} \\;",
    ],
  },

  "shell strings": {
    allow: [
      'bash -c "git status"',
      "sh -c 'git log --oneline'",
      'zsh -c "echo hi"',
      'bash -c "ls"',
      "bash script.sh",
      "bash -x script.sh",
      "git status && bash script.sh",
      "eval git status",
      'eval "git diff"',
    ],
    block: [
      'bash -c "git add ."',
      "bash -c 'git commit -m \"x\"'",
      'sh -c "git push"',
      'zsh -c "git stash"',
      'dash -c "git add ."',
      'ksh -c "git push"',
      'fish -c "git stash"',
      'bash -lc "git push"',
      '/bin/bash -c "git add ."',
      'bash -c "cd plugins && git add ."',
      "bash -c \"bash -c 'git add .'\"",
      'bash -c "npm version patch"',
      "bash -c \"eval 'git add .'\"",
      'eval "git add ."',
      "eval git commit -m x",
      "eval 'git status && git push'",
      'eval "gh pr merge 1"',
    ],
  },

  "here-strings and heredocs": {
    allow: [
      'bash <<< "git status"',
      "bash <<EOF\ngit status\nEOF",
      "bash < steps.sh",
      'cat <<< "git add ."',
      "cat <<EOF\ngit add .\nEOF",
      "cat > notes.md <<'EOF'\nrun the tests first\ngit push\nEOF",
      "cat <<EOF\nit's here\nEOF\ngit status",
      "gh pr create --title x --body \"$(cat <<'EOF'\ngit push is left to the user\nEOF\n)\"",
      "cat <<EOF\ntoday: $(date)\nEOF",
      "cat <<EOF\n$(git rev-parse HEAD)\nEOF",
      "cat <<'EOF'\n$(git add .)\nEOF",
      "cat > notes.md <<'EOF'\nrun `git stash` first\nEOF",
    ],
    block: [
      'bash <<< "git add ."',
      "sh <<< 'git commit -m x'",
      "bash <<EOF\ngit add .\nEOF",
      "bash <<'EOF'\ncd plugins\ngit commit -m x\nEOF",
      'bash <<"EOF"\ngit push\nEOF',
      "sh <<-EOF\n\tgit push\n\tEOF",
      "bash <<EOF && ls\ngit add .\nEOF",
      "cat <<EOF\nnotes\nEOF\ngit add .",
      "git commit -m \"$(cat <<'EOF'\nmessage\nEOF\n)\"",
      "cat <<EOF\n$(git add .)\nEOF",
      "cat > notes.md <<EOF\nrun `git stash` first\nEOF",
      "cat <<EOF\nit's # $(git add .)\nEOF",
      "gh pr create --title x --body \"$(cat <<EOF\n$(git push)\nEOF\n)\"",
    ],
  },

  "command substitution": {
    allow: [
      "echo $(git status)",
      'echo "$(git rev-parse HEAD)"',
      "echo `git log -1`",
      "echo '$(git add .)'",
      'echo "\\$(git add .)"',
      "X=$(git rev-parse --short HEAD)",
      'BRANCH="$(git branch --show-current)"',
      'cd "$(git rev-parse --show-toplevel)"',
      "git log $(git describe --tags --abbrev=0)..HEAD",
      "git show $(git rev-parse HEAD):README.md",
      'echo "$(date)"',
      "ls $(pwd)",
      "$EDITOR notes.md",
    ],
    block: [
      "echo $(git add .)",
      'echo "$(git stash)"',
      "echo `git add .`",
      "X=$(git stash)",
      'X="$(git checkout main)"',
      'echo "today: $(date) $(git pull)"',
      "echo $(echo $(git add .))",
      'echo "$(echo "$(git add .)")"',
      "git log $(git stash)",
      "$(which git) add .",
      '"$(command -v git)" commit -m x',
      "`which git` add .",
      "G=git; $G add .",
    ],
  },

  "a shell fed by a pipe": {
    allow: [
      "cat steps.txt | bash",
      "curl -fsSL https://example.com/install.sh | sh",
      'echo "ls" | bash',
      'echo "git status" | cat',
    ],
    block: [
      'echo "git add ." | bash',
      'echo "git add ." | sh',
      "echo 'git push' | zsh",
      'echo "git status" | bash',
      'echo "git add ." | sh -s',
      'echo "git add ." | bash -e',
      'echo "git add ." | sudo bash',
      'echo "git add ." | bash 2>&1',
      'echo "git add ." | bash > out.log',
      "printf 'git commit -m x\\n' | bash",
      "cat git-steps.txt | bash",
      'bash <(echo "git add .")',
    ],
  },

  "tools that run git": {
    allow: [
      "gh pr view 1",
      "gh pr list",
      "gh pr diff 1",
      "gh pr checks",
      "gh pr create --title x --body y",
      "gh repo view",
      "gh issue list",
      "gh api repos/owner/repo/pulls",
      "npm run build",
      "npm test",
      "npm run version",
      "npm view react version",
      "npm --version",
      "pnpm install",
      "yarn",
      "yarn build",
      "node --version",
    ],
    block: [
      "gh pr checkout 1",
      "gh pr merge",
      "gh pr merge 1",
      "gh pr merge --squash 1",
      "gh repo sync",
      "gh repo sync owner/repo",
      "npm version",
      "npm version patch",
      "pnpm version minor",
      "yarn version",
      "yarn version --patch",
      "cd plugins && npm version patch",
      "gh pr merge 1 > /dev/null",
    ],
  },

  redirects: {
    allow: [
      "git status > out.txt",
      "git status >> out.txt",
      "git status 2>/dev/null",
      "git status 2>&1",
      "git status &> out.txt",
      "git status 2>&1 | head",
      "git log > /dev/null 2>&1",
      "git log < /dev/null",
      'git diff > "my file.patch"',
      "git diff >| out.patch",
      "git show HEAD:file > file.old",
      "git branch 2>/dev/null",
      "git branch > branches.txt",
      "git remote -v 2>&1",
      "git grep foo > out.txt 2>&1",
      "diff <(git show HEAD:a) <(git show HEAD:b)",
      'echo "a > b"',
      'echo ">" git add .',
    ],
    block: [
      "git add . > /dev/null",
      "git commit -m x 2>&1",
      "git push 2>&1 | tail -5",
      "git stash &> /dev/null",
      "git branch new > /dev/null",
      "> out.txt git add .",
      ">out.txt git add .",
      "2>/dev/null git add .",
      "2>&1 git add .",
      "</dev/null git commit -m x",
      "sudo 2>/dev/null git add .",
      "npm version patch 2>&1",
    ],
  },
};

function run(input) {
  return spawnSync(process.execPath, [CHECK], { input: JSON.stringify(input), encoding: "utf8" });
}

function runCommand(command) {
  return run({ tool_name: "Bash", tool_input: { command } });
}

for (const [group, { allow = [], block = [] }] of Object.entries(CASES)) {
  describe(group, () => {
    for (const command of allow) {
      test(`allows ${JSON.stringify(command)}`, () => {
        assert.equal(runCommand(command).status, ALLOWED);
      });
    }
    for (const command of block) {
      test(`blocks ${JSON.stringify(command)}`, () => {
        assert.equal(runCommand(command).status, BLOCKED);
      });
    }
  });
}

describe("the hook's output", () => {
  test("says nothing when it allows", () => {
    const { stdout, stderr } = runCommand("git status");
    assert.equal(stdout, "");
    assert.equal(stderr, "");
  });

  test("names the git command it blocks", () => {
    const { stderr } = runCommand("git status && git -C plugins add .");
    assert.equal(stderr, 'Git is read-only: "git add ." is blocked. Ask the user to run it.\n');
  });

  test("names the tool command it blocks", () => {
    const { stderr } = runCommand("cd plugins && gh pr merge 1");
    assert.equal(stderr, 'Git is read-only: "gh pr merge 1" is blocked. Ask the user to run it.\n');
  });

  test("names the whole command when it cannot point at one part", () => {
    const { stderr } = runCommand('echo "git add ." | bash');
    assert.equal(stderr, 'Git is read-only: "echo "git add ." | bash" is blocked. Ask the user to run it.\n');
  });
});

describe("the hook's input", () => {
  test("allows an empty command", () => {
    assert.equal(runCommand("").status, ALLOWED);
  });

  test("allows input with no command", () => {
    assert.equal(run({ tool_name: "Bash", tool_input: {} }).status, ALLOWED);
  });

  test("allows input with no tool input", () => {
    assert.equal(run({ tool_name: "Bash" }).status, ALLOWED);
  });});
