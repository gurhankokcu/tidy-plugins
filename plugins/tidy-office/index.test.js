import assert from "node:assert/strict";
import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { after, describe, test } from "node:test";

// The plugin takes its data folder from the home folder when it loads, so the home folder is set first.
const HOME = mkdtempSync(join(tmpdir(), "tidy-office-"));
process.env.HOME = HOME;
process.env.USERPROFILE = HOME;
const { default: plugin, writeTeams } = await import("./index.js");

const DIR = join(HOME, ".local", "share", "tidy-office");
const MODEL = { id: "claude-opus", variant: "high" };
const SETTINGS = { model: "claude-opus", effort: "high" };
const LOCATION = { directory: "/work" };

// Loads a copy of the plugin with its own stream of the events.
async function load(events) {
  const hooks = new Map();
  const commands = new Map();
  let end;
  const ended = new Promise((resolve) => (end = resolve));
  const stop = await plugin.setup({
    agent: { list: async () => [] },
    tool: { hook: (name, callback) => hooks.set(name, callback) },
    command: { transform: (edit) => edit({ add: (command) => commands.set(command.name, command) }) },
    event: {
      async *subscribe() {
        try {
          yield* events;
        } finally {
          end();
        }
      },
    },
  });
  return { before: hooks.get("execute.before"), open: commands.get("tidy-office/open"), ended, stop };
}

// Runs the plugin over the events and returns its tool hook, once every event is recorded.
async function run(events) {
  const { before, ended, stop } = await load(events);
  await ended;
  stop();
  return before;
}

function file(session) {
  return join(DIR, `${session}.jsonl`);
}

function lines(session) {
  return readFileSync(file(session), "utf8")
    .trim()
    .split("\n")
    .map((line) => JSON.parse(line))
    .map(({ time, ...line }) => line);
}

function version(file) {
  return JSON.parse(readFileSync(new URL(file, import.meta.url), "utf8")).version;
}

describe("opencode plugin", () => {
  after(() => rmSync(HOME, { recursive: true }));

  test("records a main session under the names of the Claude Code hooks", async () => {
    await run([
      { type: "session.created", data: { sessionID: "main", agent: "build", model: MODEL, location: LOCATION } },
      { type: "session.execution.started", data: { sessionID: "main" } },
      { type: "session.text.ended", data: { sessionID: "main", text: "Done." } },
      { type: "session.execution.succeeded", data: { sessionID: "main" } },
      { type: "session.deleted", data: { sessionID: "main" } },
    ]);
    assert.deepEqual(lines("main"), [
      { event: "SessionStart", agentType: "build", ...SETTINGS, cwd: LOCATION.directory },
      { event: "UserPromptSubmit", agentType: "build", ...SETTINGS },
      { event: "Stop", agentType: "build", ...SETTINGS, message: "Done." },
      { event: "SessionEnd", agentType: "build", ...SETTINGS },
    ]);
  });

  test("records a change of agent with the team in its type", async () => {
    await run([
      { type: "session.created", data: { sessionID: "team", agent: "build", model: MODEL } },
      { type: "session.agent.selected", data: { sessionID: "team", agent: "tidy-dev/manager" } },
    ]);
    assert.deepEqual(lines("team"), [
      { event: "SessionStart", agentType: "build", ...SETTINGS },
      { event: "SessionStart", agentType: "tidy-dev:manager", ...SETTINGS },
    ]);
  });

  test("takes the agent and the model from a step when the session names none", async () => {
    const step = { sessionID: "defaults", agent: "build", model: MODEL };
    await run([
      { type: "session.created", data: { sessionID: "defaults" } },
      { type: "session.execution.started", data: { sessionID: "defaults" } },
      { type: "session.step.started", data: step },
      { type: "session.step.started", data: step },
      { type: "session.execution.succeeded", data: { sessionID: "defaults" } },
    ]);
    assert.deepEqual(lines("defaults"), [
      { event: "SessionStart" },
      { event: "UserPromptSubmit" },
      { event: "SessionStart", agentType: "build", ...SETTINGS },
      { event: "Stop", agentType: "build", ...SETTINGS },
    ]);
  });

  test("records a subagent in the file of the session that started it", async () => {
    const agent = { agentId: "child", agentType: "tidy-dev:reviewer", ...SETTINGS };
    await run([
      { type: "session.created", data: { sessionID: "root", agent: "tidy-dev/manager", model: MODEL } },
      { type: "session.created", data: { sessionID: "child", parentID: "root", agent: "tidy-dev/reviewer" } },
      { type: "session.execution.started", data: { sessionID: "child" } },
      { type: "session.text.ended", data: { sessionID: "child", text: "No findings." } },
      { type: "session.execution.failed", data: { sessionID: "child" } },
    ]);
    assert.deepEqual(lines("root"), [
      { event: "SessionStart", agentType: "tidy-dev:manager", ...SETTINGS },
      { event: "SubagentStart", ...agent },
      { event: "SubagentStop", ...agent, message: "No findings." },
    ]);
    assert.equal(existsSync(file("child")), false);
  });

  test("records an event once when two copies are loaded", async () => {
    const events = [{ type: "session.created", data: { sessionID: "copies" } }];
    const first = await load(events);
    const second = await load(events);
    await first.ended;
    assert.deepEqual(lines("copies"), [{ event: "SessionStart" }]);
    second.stop();
    first.stop();
  });

  test("listens through another copy when the listening one stops", async () => {
    const first = await load([]);
    const second = await load([{ type: "session.created", data: { sessionID: "handover" } }]);
    await first.ended;
    first.stop();
    await second.ended;
    second.stop();
    assert.deepEqual(lines("handover"), [{ event: "SessionStart" }]);
  });

  test("records a tool call with what it does", async () => {
    const before = await run([]);
    before({ sessionID: "tools", tool: "read", input: { path: "/work/src/app.js" } });
    before({ sessionID: "tools", tool: "shell", input: { command: "npm test" } });
    before({ sessionID: "tools", tool: "grep", input: { pattern: "TODO" } });
    before({ sessionID: "tools", tool: "subagent", input: { agent: "tidy-dev/tester" } });
    before({ sessionID: "tools", tool: "question" });
    assert.deepEqual(lines("tools"), [
      { event: "PreToolUse", tool: "read", activity: "read app.js" },
      { event: "PreToolUse", tool: "shell", activity: "shell" },
      { event: "PreToolUse", tool: "grep", activity: 'grep "TODO"' },
      { event: "PreToolUse", tool: "subagent", activity: "subagent tidy-dev/tester" },
      { event: "PreToolUse", tool: "question", activity: "question" },
    ]);
  });

  test("writes the teams from the agents with an ID of the form team/agent", () => {
    writeTeams([
      { id: "build" },
      { id: "tidy-dev/manager", color: "#9b59b6" },
      { id: "tidy-dev/tester" },
      { id: "tidy-dev/tester/extra", color: "#4f8fe8" },
    ]);
    assert.deepEqual(JSON.parse(readFileSync(join(DIR, "teams.json"), "utf8")), {
      "tidy-dev": { manager: { color: "#9b59b6" }, tester: {} },
    });
  });

  test("passes the typed port to the server", async () => {
    const { open, ended, stop } = await load([]);
    await ended;
    stop();
    await assert.rejects(open.execute({ sessionID: "open", prompt: { text: " 80 " } }), {
      message: "The port must be a whole number from 1024 to 65535.",
    });
  });
});

describe("manifests", () => {
  test("carry the same version", () => {
    assert.match(version("package.json"), /^\d+\.\d+\.\d+$/);
    assert.equal(version(".claude-plugin/plugin.json"), version("package.json"));
  });
});
