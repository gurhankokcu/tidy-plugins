import { spawn } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { basename, join } from "node:path";
import { fileURLToPath } from "node:url";
import { record } from "./hooks/journal.mjs";

const DIR = join(homedir(), ".local", "share", "tidy-office");
const SERVER = fileURLToPath(new URL("app/server.mjs", import.meta.url));
const COMMAND = "tidy-office/open";
const TYPES = [
  "session.created",
  "session.agent.selected",
  "session.model.selected",
  "session.execution.started",
  "session.step.started",
  "session.text.ended",
  "session.execution.succeeded",
  "session.execution.failed",
  "session.execution.interrupted",
  "session.deleted",
];

// Each session with its root: the session the user talks to. A subagent runs in a child session.
const sessions = new Map();

function known(id) {
  if (!sessions.has(id)) sessions.set(id, { root: id });
  return sessions.get(id);
}

// The office reads the team from an agent type of the form `team:agent`.
function agentType(agent) {
  return agent?.replace("/", ":");
}

function sameModel(one, other) {
  return one?.id === other?.id && one?.variant === other?.variant;
}

function describe(tool, input = {}) {
  switch (tool) {
    case "read":
    case "edit":
    case "write":
      return `${tool} ${basename(input.path ?? "")}`;
    case "grep":
    case "glob":
      return `${tool} "${input.pattern ?? ""}"`;
    case "subagent":
      return `${tool} ${input.agent ?? ""}`;
    default:
      return tool;
  }
}

function write(id, event, detail) {
  const session = known(id);
  const model = session.model ?? known(session.root).model;
  // A failed write must not fail the tool call or end the event stream that it comes from.
  try {
    record(DIR, session.root, {
      event,
      agentId: session.root === id ? undefined : id,
      agentType: agentType(session.agent),
      model: model?.id,
      effort: model?.variant,
      ...detail,
    });
  } catch {}
}

function apply({ type, data }) {
  const id = data.sessionID;
  const session = known(id);
  const main = session.root === id;

  switch (type) {
    case "session.created":
      session.root = data.parentID ? known(data.parentID).root : id;
      session.agent = data.agent;
      session.model = data.model;
      if (!data.parentID) write(id, "SessionStart", { cwd: data.location?.directory });
      break;
    case "session.agent.selected":
      session.agent = data.agent;
      if (main) write(id, "SessionStart");
      break;
    case "session.model.selected":
      session.model = data.model;
      if (main) write(id, "SessionStart");
      break;
    case "session.execution.started":
      write(id, main ? "UserPromptSubmit" : "SubagentStart");
      break;
    // A session on the default agent and model only names them in its steps.
    case "session.step.started":
      if (session.agent === data.agent && sameModel(session.model, data.model)) break;
      session.agent = data.agent;
      session.model = data.model;
      if (main) write(id, "SessionStart");
      break;
    case "session.text.ended":
      session.message = data.text;
      break;
    case "session.execution.succeeded":
    case "session.execution.failed":
    case "session.execution.interrupted":
      write(id, main ? "Stop" : "SubagentStop", { message: session.message });
      break;
    case "session.deleted":
      if (main) write(id, "SessionEnd");
      sessions.delete(id);
      break;
  }
}

// An error in the stream ends the recording. It must not reach opencode as an unhandled rejection.
async function listen(events) {
  try {
    for await (const event of events) apply(event);
  } catch {}
}

// opencode loads one copy of the plugin per folder and sends every event to each copy, so only one copy listens.
const copies = new Set();
let listening;

function follow() {
  listening?.stop.abort();
  const [ctx] = copies;
  listening = ctx && { ctx, stop: new AbortController() };
  if (listening) listen(ctx.event.subscribe({ types: TYPES, signal: listening.stop.signal }));
}

// Writes the teams for the server: the agents with an ID of the form `team/agent`, each with its color.
export function writeTeams(agents) {
  const teams = Object.create(null);
  for (const { id, color } of agents) {
    const [team, agent, ...rest] = id.split("/");
    if (agent && rest.length === 0) (teams[team] ??= Object.create(null))[agent] = { color };
  }
  mkdirSync(DIR, { recursive: true, mode: 0o700 });
  writeFileSync(join(DIR, "teams.json"), JSON.stringify(teams), { mode: 0o600 });
}

function open(id, port) {
  return new Promise((resolve, reject) => {
    const args = [SERVER, DIR, known(id).root, port, `/${COMMAND}`];
    const server = spawn("node", args, { stdio: ["ignore", "ignore", "pipe"] });
    let error = "";
    server.stderr.on("data", (chunk) => (error += chunk));
    server.on("error", reject);
    server.on("close", (code) => (code === 0 ? resolve() : reject(new Error(error.trim()))));
  });
}

export default {
  id: "tidy-office",
  async setup(ctx) {
    await ctx.tool.hook("execute.before", ({ sessionID, tool, input }) => {
      write(sessionID, "PreToolUse", { tool, activity: describe(tool, input) });
    });
    await ctx.command.transform((commands) => {
      commands.add({
        name: COMMAND,
        description: "Open the Tidy Agent Office, a pixel office in the browser that shows this session's agents live",
        execute: async ({ sessionID, prompt }) => {
          const agents = await ctx.agent.list();
          writeTeams(Array.isArray(agents) ? agents : agents.data);
          await open(sessionID, prompt.text.trim());
        },
      });
    });
    copies.add(ctx);
    if (!listening) follow();
    return () => {
      copies.delete(ctx);
      if (listening?.ctx === ctx) follow();
    };
  },
};
