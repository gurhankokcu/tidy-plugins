import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { copyFileSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { after, describe, test } from "node:test";
import { fileURLToPath } from "node:url";

const STATUSLINE = fileURLToPath(new URL("statusline.mjs", import.meta.url));
const ROOT = mkdtempSync(join(tmpdir(), "tidy-office-"));
const PROJECT = join(ROOT, "project");
const DIR = join(ROOT, "data");
// The script writes next to itself, so the tests run a copy in the data folder.
const SCRIPT = join(DIR, "statusline.mjs");
const LIMITS_FILE = join(DIR, "limits.json");
const RESET = Math.floor(Date.now() / 1000) + 3600;
const INPUT = {
  workspace: { project_dir: PROJECT },
  model: { id: "claude-opus-5-5", display_name: "Opus 5.5" },
  effort: { level: "high" },
  thinking: { enabled: true },
  fast_mode: true,
  context_window: { current_usage: { input_tokens: 2000, cache_read_input_tokens: 10_000 } },
  cost: { total_api_duration_ms: 65_000, total_duration_ms: 3_725_000, total_cost_usd: 1.5 },
};

mkdirSync(PROJECT);
mkdirSync(DIR);
copyFileSync(STATUSLINE, SCRIPT);

function run(input) {
  return spawnSync(process.execPath, [SCRIPT], { input: JSON.stringify(input), encoding: "utf8" }).stdout;
}

function statusLine(session, detail = {}) {
  return run({ session_id: session, ...INPUT, ...detail });
}

function file(session) {
  return join(DIR, `${session}.status.json`);
}

function load(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}

function fiveHour(used_percentage, resets_at) {
  return { five_hour: { used_percentage, resets_at } };
}

// The limits file after a session with the given limits runs over the saved ones.
function merged(saved, limits) {
  writeFileSync(LIMITS_FILE, JSON.stringify(saved));
  statusLine("limits", { rate_limits: limits });
  return load(LIMITS_FILE);
}

describe("status line", () => {
  after(() => rmSync(ROOT, { recursive: true }));

  test("shows the project, the model and the session", () => {
    assert.equal(
      statusLine("shown"),
      "project │ Opus 5.5 · high · thinking · fast │ 12k ctx · 0:01:05 model · 1:02:05 session · $1.50",
    );
  });

  test("shows a limit with the time left", () => {
    const line = statusLine("shown", { rate_limits: fiveHour(40.4, RESET) });
    assert.match(line, / │ 5h 40% · 0:59:\d\d left$/);
  });

  test("saves the model and effort of a session", () => {
    statusLine("main");
    assert.deepEqual(load(file("main")), { model: "claude-opus-5-5", effort: "high" });
  });

  test("refuses a session ID that is not a plain word", () => {
    statusLine("../escape");
    assert.equal(existsSync(file("../escape")), false);
  });

  test("saves only the limit fields the page reads", () => {
    const limits = {
      five_hour: { used_percentage: 40, resets_at: RESET },
      spend_limit: { used_usd: 5, limit_usd: 100 },
    };
    assert.deepEqual(merged({}, limits), fiveHour(40, RESET));
  });

  test("keeps the higher usage of a limit window", () => {
    assert.deepEqual(merged(fiveHour(60, RESET), fiveHour(20, RESET)), fiveHour(60, RESET));
    assert.deepEqual(merged(fiveHour(20, RESET), fiveHour(60, RESET)), fiveHour(60, RESET));
  });

  test("keeps the limit window that resets later", () => {
    assert.deepEqual(merged(fiveHour(5, RESET + 60), fiveHour(90, RESET)), fiveHour(5, RESET + 60));
    assert.deepEqual(merged(fiveHour(90, RESET), fiveHour(5, RESET + 60)), fiveHour(5, RESET + 60));
  });

  test("keeps a saved limit window that the session does not have", () => {
    assert.deepEqual(merged(fiveHour(60, RESET), {}), fiveHour(60, RESET));
  });

  test("drops a saved limit window that has reset", () => {
    assert.deepEqual(merged(fiveHour(90, 1), fiveHour(20, RESET)), fiveHour(20, RESET));
    assert.deepEqual(merged(fiveHour(90, 1), {}), {});
  });
});
