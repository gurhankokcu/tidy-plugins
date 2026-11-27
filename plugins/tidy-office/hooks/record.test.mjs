import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, utimesSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { after, describe, test } from "node:test";
import { fileURLToPath } from "node:url";

const RECORD = fileURLToPath(new URL("record.mjs", import.meta.url));
const ROOT = mkdtempSync(join(tmpdir(), "tidy-office-"));
const HOME = join(ROOT, "home");
const PROJECT = join(ROOT, "project");
const TEAM = join(ROOT, "team");
const PLUGINS = join(ROOT, "plugins");
const DIR = join(PLUGINS, "data", "tidy-office");
const DAY_MS = 24 * 60 * 60 * 1000;
const AGENTS = {
  "team:manager": { model: "opus", effort: "medium" },
  "team:tester": { model: "sonnet", effort: "high" },
  helper: { model: "haiku", effort: "low" },
  local: { model: "opus", effort: "high" },
};

function writeAgent(dir, name, { model, effort }) {
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, `${name}.md`), `---\nname: ${name}\nmodel: ${model}\neffort: ${effort}\n---\n`);
}

writeAgent(join(TEAM, "agents"), "manager", AGENTS["team:manager"]);
writeAgent(join(TEAM, "agents"), "tester", AGENTS["team:tester"]);
writeAgent(join(HOME, ".claude", "agents"), "helper", AGENTS.helper);
writeAgent(join(PROJECT, ".claude", "agents"), "local", AGENTS.local);
mkdirSync(DIR, { recursive: true });
writeFileSync(
  join(PLUGINS, "installed_plugins.json"),
  JSON.stringify({ plugins: { "team@market": [{ installPath: TEAM }] } }),
);

function run(input) {
  const env = { ...process.env, HOME, USERPROFILE: HOME, CLAUDE_PLUGIN_DATA: DIR };
  return spawnSync(process.execPath, [RECORD], { input: JSON.stringify(input), env, encoding: "utf8" });
}

function record(session, event, detail = {}) {
  return run({ session_id: session, hook_event_name: event, cwd: PROJECT, ...detail });
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

describe("Claude Code hook", () => {
  after(() => rmSync(ROOT, { recursive: true }));

  test("records each event of a session", () => {
    const agent = { agent_id: "a1", agent_type: "team:tester" };
    const input = { command: "npm test", description: "Run the tests" };
    record("events", "SessionStart", { model: "claude-opus-5-5", agent_type: "team:manager" });
    record("events", "UserPromptSubmit", { prompt: "plan a login page" });
    record("events", "PreToolUse", { tool_name: "Bash", tool_input: input });
    record("events", "SubagentStart", agent);
    record("events", "SubagentStop", { ...agent, last_assistant_message: "All checks pass." });
    record("events", "Stop", { last_assistant_message: "Done." });
    record("events", "SessionEnd");
    assert.deepEqual(lines("events"), [
      {
        event: "SessionStart",
        cwd: PROJECT,
        agentType: "team:manager",
        model: "claude-opus-5-5",
        effort: "medium",
        agents: AGENTS,
      },
      { event: "UserPromptSubmit" },
      { event: "PreToolUse", tool: "Bash", activity: "Run the tests" },
      { event: "SubagentStart", agentId: "a1", agentType: "team:tester", model: "sonnet", effort: "high" },
      { event: "SubagentStop", agentId: "a1", agentType: "team:tester", message: "All checks pass." },
      { event: "Stop", message: "Done." },
      { event: "SessionEnd" },
    ]);
  });

  test("leaves the text of a prompt out", () => {
    record("prompt", "UserPromptSubmit", { prompt: "plan a login page" });
    assert.doesNotMatch(readFileSync(file("prompt"), "utf8"), /login/);
  });

  test("records a tool call with what it does", () => {
    record("tools", "PreToolUse", { tool_name: "Read", tool_input: { file_path: "/work/src/app.js" } });
    record("tools", "PreToolUse", { tool_name: "Bash", tool_input: { command: "npm test" } });
    record("tools", "PreToolUse", { tool_name: "Grep", tool_input: { pattern: "TODO" } });
    record("tools", "PreToolUse", { tool_name: "Agent", tool_input: { subagent_type: "team:tester" } });
    record("tools", "PreToolUse", { tool_name: "WebFetch", tool_input: { url: "https://example.com" } });
    assert.deepEqual(lines("tools"), [
      { event: "PreToolUse", tool: "Read", activity: "Read app.js" },
      { event: "PreToolUse", tool: "Bash", activity: "npm test" },
      { event: "PreToolUse", tool: "Grep", activity: 'Grep "TODO"' },
      { event: "PreToolUse", tool: "Agent", activity: "Agent team:tester" },
      { event: "PreToolUse", tool: "WebFetch", activity: "WebFetch" },
    ]);
  });

  test("cuts a long activity and a long message", () => {
    record("cuts", "PreToolUse", { tool_name: "Bash", tool_input: { command: "x".repeat(200) } });
    record("cuts", "Stop", { last_assistant_message: "y".repeat(300) });
    assert.deepEqual(lines("cuts"), [
      { event: "PreToolUse", tool: "Bash", activity: `${"x".repeat(79)}…` },
      { event: "Stop", message: `${"y".repeat(279)}…` },
    ]);
  });

  test("skips an agent with no type", () => {
    record("hidden", "PreToolUse", { agent_id: "a2", tool_name: "Read" });
    assert.equal(existsSync(file("hidden")), false);
  });

  test("refuses a session ID that is not a plain word", () => {
    record("../escape", "SessionStart");
    assert.equal(existsSync(file("../escape")), false);
  });

  test("deletes the files older than a day when a session starts", () => {
    const old = new Date(Date.now() - 2 * DAY_MS);
    writeFileSync(file("old"), "");
    writeFileSync(file("fresh"), "");
    utimesSync(file("old"), old, old);
    record("prune", "SessionStart");
    assert.equal(existsSync(file("old")), false);
    assert.equal(existsSync(file("fresh")), true);
  });
});
