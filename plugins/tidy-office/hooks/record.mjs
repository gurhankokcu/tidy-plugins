import { appendFileSync, mkdirSync, readFileSync, statSync, unlinkSync } from "node:fs";
import { homedir } from "node:os";
import { basename, join } from "node:path";
import { cut, entries, FILE, frontmatter, plugins, SETTING_MAX } from "../app/files.mjs";

const DIR = process.env.CLAUDE_PLUGIN_DATA;
const SESSION = /^[A-Za-z0-9-]+$/;
const DEFINED = new Set(["SessionStart", "SubagentStart"]);
const MAX_AGE_MS = 24 * 60 * 60 * 1000;
const ACTIVITY_MAX = 80;
const MESSAGE_MAX = 280;

function prune() {
  for (const name of entries(DIR)) {
    const file = join(DIR, name);
    try {
      if (Date.now() - statSync(file).mtimeMs > MAX_AGE_MS) unlinkSync(file);
    } catch {}
  }
}

function describe(tool, input = {}) {
  switch (tool) {
    case "Read":
    case "Edit":
    case "Write":
      return `${tool} ${basename(input.file_path ?? "")}`;
    case "Bash":
      return input.description ?? input.command;
    case "Grep":
    case "Glob":
      return `${tool} "${input.pattern ?? ""}"`;
    case "Agent":
      return `${tool} ${input.subagent_type ?? ""}`;
    default:
      return tool;
  }
}

function agentDirs(cwd) {
  return [
    ...Array.from(plugins(DIR), ([name, root]) => [`${name}:`, join(root, "agents")]),
    ["", join(homedir(), ".claude", "agents")],
    ...(cwd ? [["", join(cwd, ".claude", "agents")]] : []),
  ];
}

function settings(file) {
  const field = frontmatter(file);
  return field && { model: field("model"), effort: field("effort") };
}

function definitions(cwd) {
  const found = new Map();
  for (const [prefix, dir] of agentDirs(cwd)) {
    for (const file of entries(dir)) {
      const name = file.match(FILE)?.[1];
      const each = name && settings(join(dir, file));
      if (each) found.set(`${prefix}${name}`, each);
    }
  }
  return found;
}

const {
  session_id,
  hook_event_name,
  cwd,
  model,
  agent_id,
  agent_type,
  tool_name,
  tool_input,
  last_assistant_message,
} = JSON.parse(readFileSync(0, "utf8"));

const started = hook_event_name === "SessionStart";
const hidden = Boolean(agent_id) && !agent_type;
const folder = typeof cwd === "string" ? cwd : undefined;

if (DIR && SESSION.test(session_id ?? "") && !hidden) {
  mkdirSync(DIR, { recursive: true, mode: 0o700 });
  if (started) prune();
  const agents = DEFINED.has(hook_event_name) ? definitions(folder) : new Map();
  const defined = agents.get(agent_type) ?? {};
  const event = {
    time: Date.now(),
    event: hook_event_name,
    cwd: started ? folder : undefined,
    agentId: agent_id,
    agentType: agent_type,
    model: cut(model, SETTING_MAX) ?? defined.model,
    effort: defined.effort,
    agents: started ? Object.fromEntries(agents) : undefined,
    tool: tool_name,
    activity: hook_event_name === "PreToolUse" ? cut(describe(tool_name, tool_input), ACTIVITY_MAX) : undefined,
    message: cut(last_assistant_message, MESSAGE_MAX),
  };
  appendFileSync(join(DIR, `${session_id}.jsonl`), `${JSON.stringify(event)}\n`, { mode: 0o600 });
}
