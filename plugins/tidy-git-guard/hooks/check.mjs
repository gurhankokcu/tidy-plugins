import { readFileSync } from "node:fs";
import { basename } from "node:path";

const READS = new Set([
  "blame",
  "cat-file",
  "describe",
  "diff",
  "for-each-ref",
  "log",
  "ls-files",
  "ls-tree",
  "merge-base",
  "rev-list",
  "rev-parse",
  "shortlog",
  "show",
  "status",
  "version",
]);
const BRANCH_READS = new Set(["-a", "-r", "-v", "-vv", "--all", "--list", "--remotes", "--show-current", "--verbose"]);
const REMOTE_READS = new Set(["-v", "--verbose"]);
// `git grep -O` and `--open-files-in-pager` run a command. Short options bundle and long options shorten.
const GREP_PAGER = /^(-\w*O|--op)/;

// A config value can make a read run a command, and git takes config from these.
const CONFIG_OPTION = /^(-c|--config-env)/;
const CONFIG_VARIABLE = /^GIT_\w+=/;
const VALUED_OPTIONS = new Set(["-C", "--git-dir", "--namespace", "--work-tree"]);

const GIT_RUNNERS = {
  gh: ["pr checkout", "pr merge", "repo sync"],
  npm: ["version"],
  pnpm: ["version"],
  yarn: ["version"],
};
const WRAPPERS = new Set([
  "command",
  "doas",
  "env",
  "exec",
  "nice",
  "noglob",
  "nohup",
  "sudo",
  "time",
  "timeout",
  "xargs",
]);
const SHELLS = new Set(["bash", "dash", "fish", "ksh", "sh", "zsh"]);
const FIND_RUNS = new Set(["-exec", "-execdir", "-ok", "-okdir"]);
const KNOWN_COMMANDS = new Set(["eval", "find", "git", ...WRAPPERS, ...SHELLS, ...Object.keys(GIT_RUNNERS)]);

const KEYWORDS = new Set(["!", "{", "do", "elif", "else", "if", "then", "until", "while"]);
const SEPARATORS = new Set(["\n", "&", "(", ")", ";", "|"]);
const ASSIGNMENT = /^\w+=/;
const WRAPPER_ARGUMENT = /^(-|\d|\w+=)/;
const REDIRECT = /^[<>]+[&|]?/;
const DESCRIPTOR = /^\d+$/;
const BACKTICKS = /`([^`]*)`/g;
const HEREDOC = /(?<!<)<<-?[ \t]*(["']?)(\w+)\1(.*)\n([\s\S]*?)^[ \t]*\2[ \t]*$/gm;
const MENTIONS_GIT = /\bgit\b/i;

// ---------------------------------------------------------------------------------------------------------------------
// Reading shell text
// ---------------------------------------------------------------------------------------------------------------------

// Rewrites two forms into simpler ones that mean the same: backticks into `$(…)`, and a heredoc into a here-string.
// Bash runs the `$(…)` in a heredoc whose mark has no quotes. The body of each such heredoc is returned on the side.
function simplify(text) {
  const heredocs = [];
  const simple = text
    .replace(BACKTICKS, (_, inner) => `$(${inner})`)
    .replace(HEREDOC, (_, quote, word, rest, body) => {
      if (!quote) heredocs.push(body);
      return `<<< '${body.replaceAll("'", "'\\''")}'${rest}`;
    });
  return { simple, heredocs };
}

function closingParen(text, start) {
  let depth = 1;
  for (let i = start; i < text.length; i++) {
    if (text[i] === "(") depth++;
    if (text[i] === ")" && --depth === 0) return i;
  }
  return text.length;
}

// Lists the text inside each `$(…)` of a heredoc. In a heredoc, quotes and `#` are plain text.
function substitutionsIn(heredoc) {
  const substitutions = [];
  let i = heredoc.indexOf("$(");
  while (i !== -1) {
    const close = closingParen(heredoc, i + 2);
    substitutions.push(heredoc.slice(i + 2, close));
    i = heredoc.indexOf("$(", close);
  }
  return substitutions;
}

// Splits shell text into tokens: words, separators, and the targets of input and output redirects.
// Quotes and escapes are resolved, and comments are left out. The text inside each `$(…)` is returned on the side.
function tokenize(text) {
  const tokens = [];
  const substitutions = [];
  let word = null;
  let quote = null;
  let redirect = null;

  const add = (part) => {
    word = (word ?? "") + part;
  };
  const end = () => {
    if (word === null) return;
    tokens.push({ type: redirect ?? "word", value: word });
    word = null;
    redirect = null;
  };

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (quote === "'") {
      if (char === "'") quote = null;
      else add(char);
    } else if (char === "\\") {
      if (text[i + 1] !== "\n") add(text[i + 1] ?? "");
      i++;
    } else if (text.startsWith("$(", i)) {
      const close = closingParen(text, i + 2);
      substitutions.push(text.slice(i + 2, close));
      add("$");
      i = close;
    } else if (char === '"') {
      quote = quote ? null : char;
      add("");
    } else if (quote) {
      add(char);
    } else if (char === "'") {
      quote = char;
      add("");
    } else if (char === "#" && word === null) {
      const lineEnd = text.indexOf("\n", i);
      i = (lineEnd === -1 ? text.length : lineEnd) - 1;
    } else if (char === "<" || char === ">") {
      if (DESCRIPTOR.test(word ?? "")) word = null;
      end();
      redirect = char === "<" ? "input" : "output";
      i += REDIRECT.exec(text.slice(i))[0].length - 1;
    } else if (SEPARATORS.has(char)) {
      end();
      redirect = null;
      tokens.push({ type: "separator" });
    } else if (/\s/.test(char)) {
      end();
    } else {
      add(char);
    }
  }
  end();
  return { tokens, substitutions };
}

// Lists every command in shell text, including the ones inside substitutions.
// A command is its words, plus its inputs: the files and here-strings redirected into it.
function parse(text) {
  const { simple, heredocs } = simplify(text);
  const { tokens, substitutions } = tokenize(simple);
  const commands = [{ words: [], inputs: [] }];
  for (const { type, value } of tokens) {
    if (type === "separator") commands.push({ words: [], inputs: [] });
    if (type === "word") commands.at(-1).words.push(value);
    if (type === "input") commands.at(-1).inputs.push(value);
  }
  const inners = [...substitutions, ...heredocs.flatMap((heredoc) => substitutionsIn(heredoc))];
  return [...commands, ...inners.flatMap((inner) => parse(inner))];
}

function commandName(word) {
  return basename(word ?? "").toLowerCase();
}

// A wrapper's own arguments are options, numbers, assignments, and the value after an option.
function isWrapperArgument(words, i) {
  if (KNOWN_COMMANDS.has(commandName(words[i]))) return false;
  return WRAPPER_ARGUMENT.test(words[i]) || words[i - 1].startsWith("-");
}

// Finds the command itself, past shell keywords, variable assignments, and wrappers with their arguments.
function commandIndex(words) {
  let i = 0;
  while (i < words.length) {
    if (words[i] === "function") i += 2;
    else if (KEYWORDS.has(words[i]) || ASSIGNMENT.test(words[i])) i++;
    else break;
  }
  while (WRAPPERS.has(commandName(words[i]))) {
    i++;
    while (i < words.length && isWrapperArgument(words, i)) i++;
  }
  return i;
}

// ---------------------------------------------------------------------------------------------------------------------
// Judging commands
//
// Every check returns the text to report as blocked, or null when the command may run.
// ---------------------------------------------------------------------------------------------------------------------

function firstBlocked(items, check) {
  for (const item of items) {
    const blocked = check(item);
    if (blocked) return blocked;
  }
  return null;
}

function isRead(subcommand, args) {
  if (subcommand === undefined) return true;
  if (READS.has(subcommand)) return true;
  if (subcommand === "branch") return args.every((arg) => BRANCH_READS.has(arg));
  if (subcommand === "grep") return !args.some((arg) => GREP_PAGER.test(arg));
  if (subcommand === "remote") return args.every((arg) => REMOTE_READS.has(arg));
  return false;
}

// `prefix` is what stands before `git`. When `fed` is set, more arguments arrive at run time,
// so only a subcommand that reads with any arguments may pass.
function checkGit(args, prefix, fed, script) {
  if (prefix.some((word) => CONFIG_VARIABLE.test(word))) return script.trim();

  let i = 0;
  while (i < args.length && args[i].startsWith("-")) {
    if (CONFIG_OPTION.test(args[i])) return script.trim();
    i += VALUED_OPTIONS.has(args[i]) ? 2 : 1;
  }
  const [subcommand, ...rest] = args.slice(i);
  const read = fed ? READS.has(subcommand) : isRead(subcommand, rest);
  return read ? null : `git ${[subcommand, ...rest].join(" ")}`.trim();
}

function checkRunner(name, args) {
  const line = args.join(" ");
  const runsGit = GIT_RUNNERS[name].some((sub) => line === sub || line.startsWith(`${sub} `));
  return runsGit ? `${name} ${line}` : null;
}

function checkExport(args, script) {
  return args.some((arg) => CONFIG_VARIABLE.test(arg)) ? script.trim() : null;
}

// A shell runs its arguments and its inputs as scripts. With neither, it runs whatever a pipe feeds it,
// which cannot be read here.
function checkShell(args, inputs, script) {
  const scripts = [...args.filter((arg) => !arg.startsWith("-")), ...inputs];
  if (scripts.length === 0) return MENTIONS_GIT.test(script) ? script.trim() : null;
  return firstBlocked(scripts, checkScript);
}

function checkFind(args, script) {
  const runs = args.flatMap((arg, i) => (FIND_RUNS.has(arg) ? [args.slice(i + 1)] : []));
  return firstBlocked(runs, (words) => checkCommand({ words, inputs: [] }, script, true));
}

function checkCommand({ words, inputs }, script, fed = false) {
  const start = commandIndex(words);
  const prefix = words.slice(0, start);
  const [word = "", ...args] = words.slice(start);
  const name = commandName(word);
  const viaXargs = prefix.some((each) => commandName(each) === "xargs");

  if (word.startsWith("$")) return MENTIONS_GIT.test(script) ? script.trim() : null;
  if (name === "git") return checkGit(args, prefix, fed || viaXargs, script);
  if (name === "eval") return checkScript(args.join(" "));
  if (name === "export") return checkExport(args, script);
  if (name === "find") return checkFind(args, script);
  if (SHELLS.has(name)) return checkShell(args, inputs, script);
  if (Object.hasOwn(GIT_RUNNERS, name)) return checkRunner(name, args);
  return null;
}

function checkScript(script) {
  return firstBlocked(parse(script), (command) => checkCommand(command, script));
}

// ---------------------------------------------------------------------------------------------------------------------
// The hook
// ---------------------------------------------------------------------------------------------------------------------

const { tool_input } = JSON.parse(readFileSync(0, "utf8"));
const blocked = checkScript(tool_input?.command ?? "");

if (blocked) {
  process.stderr.write(`Git is read-only: "${blocked}" is blocked. Ask the user to run it.\n`);
  process.exitCode = 2;
}
