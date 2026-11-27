import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, test } from "node:test";
import plugin from "./index.js";

const BLOCKED = { message: 'Git is read-only: "git add ." is blocked. Ask the user to run it.' };

async function hook() {
  const hooks = new Map();
  await plugin.setup({ tool: { hook: (name, callback) => hooks.set(name, callback) } });
  return hooks.get("execute.before");
}

function version(file) {
  return JSON.parse(readFileSync(new URL(file, import.meta.url), "utf8")).version;
}

describe("opencode hook", async () => {
  const run = await hook();

  test("blocks a git write in the shell tool", () => {
    assert.throws(() => run({ tool: "shell", input: { command: "git add ." } }), BLOCKED);
  });

  test("blocks a git write in the shell tool under its old name", () => {
    assert.throws(() => run({ tool: "bash", input: { command: "git add ." } }), BLOCKED);
  });

  test("allows a git read", () => {
    assert.doesNotThrow(() => run({ tool: "shell", input: { command: "git status" } }));
  });

  test("allows another tool", () => {
    assert.doesNotThrow(() => run({ tool: "read", input: { command: "git add ." } }));
  });

  test("allows a call with no command", () => {
    assert.doesNotThrow(() => run({ tool: "shell", input: {} }));
  });
});

describe("manifests", () => {
  test("carry the same version", () => {
    assert.match(version("package.json"), /^\d+\.\d+\.\d+$/);
    assert.equal(version(".claude-plugin/plugin.json"), version("package.json"));
  });
});
