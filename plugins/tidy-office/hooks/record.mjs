import { mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { basename, join } from "node:path";
import { fileURLToPath } from "node:url";
import { agentFiles, cut, plugins, SETTING_MAX } from "../app/files.mjs";
import { record } from "./journal.mjs";

const DIR = process.env.CLAUDE_PLUGIN_DATA;
const DEFINED = new Set(["SessionStart", "SubagentStart"]);
const STATUSLINE = "statusline.mjs";
const SOURCE = fileURLToPath(new URL(`../${STATUSLINE}`, import.meta.url));

// Puts the status line script in the data folder, whose path stays the same across plugin versions.
function publish() {
  const file = join(DIR, STATUSLINE);
  const temp = `${file}.${process.pid}.tmp`;
  try {
    mkdirSync(DIR, { recursive: true, mode: 0o700 });
    writeFileSync(temp, readFileSync(SOURCE), { mode: 0o600 });
    renameSync(temp, file);
  } catch {
    rmSync(temp, { force: true });
  }
}

function describe(tool, input = {}) {
  switch (tool) {
    case "Read":
    case "Edit":
    case "Write":
      return `${tool} ${basename(input.file_path ?? "")}`;
    case "Bash":
      return input.description ?? tool;
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

function definitions(cwd) {
  const found = new Map();
  for (const [prefix, dir] of agentDirs(cwd)) {
    for (const [name, each] of agentFiles(dir, ["model", "effort"])) found.set(`${prefix}${name}`, each);
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

if (DIR && started) publish();

if (DIR && !hidden) {
  const agents = DEFINED.has(hook_event_name) ? definitions(folder) : new Map();
  const defined = agents.get(agent_type) ?? {};
  record(DIR, session_id, {
    event: hook_event_name,
    cwd: started ? folder : undefined,
    agentId: agent_id,
    agentType: agent_type,
    model: cut(model, SETTING_MAX) ?? defined.model,
    effort: defined.effort,
    agents: started ? Object.fromEntries(agents) : undefined,
    tool: tool_name,
    activity: hook_event_name === "PreToolUse" ? describe(tool_name, tool_input) : undefined,
    message: last_assistant_message,
  });
}
