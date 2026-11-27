import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, test } from "node:test";
import plugin from "./index.js";

const AGENTS = ["developer", "manager", "planner", "reviewer", "security", "tester"];
const SKILLS = [
  "clean-code",
  "debug",
  "develop",
  "fix",
  "plan",
  "reply",
  "review",
  "secure-code",
  "security-check",
  "test",
];
const COMMANDS = ["debug", "develop", "fix", "plan", "reply", "review", "security-check", "test"];
const READ_ONLY = ["edit", "subagent", "question", "webfetch", "websearch"];
const DENIED = {
  developer: [],
  manager: ["edit"],
  planner: READ_ONLY,
  reviewer: READ_ONLY,
  security: READ_ONLY,
  tester: READ_ONLY,
};
const COLORS = {
  developer: "#4cb86a",
  manager: "#9b6bdf",
  planner: "#4f8fe8",
  reviewer: "#e8893c",
  security: "#e0524f",
  tester: "#3cc4c9",
};
const CLAUDE_ONLY =/tidy-dev:|CLAUDE_PLUGIN_ROOT|Skill tool|SendMessage|claude --|\$ARGUMENTS/;

async function setup() {
  const agents = new Map();
  const skills = new Map();
  const commands = new Map();
  const prompts = [];
  await plugin.setup({
    agent: {
      transform: (edit) =>
        edit({
          update: (id, change) => {
            const draft = { permissions: [] };
            change(draft);
            agents.set(id, draft);
          },
        }),
    },
    skill: { transform: (edit) => edit({ add: (skill) => skills.set(skill.id, skill) }) },
    command: { transform: (edit) => edit({ add: (command) => commands.set(command.name, command) }) },
    session: { prompt: (prompt) => prompts.push(prompt) },
  });
  return { agents, skills, commands, prompts };
}

function version(file) {
  return JSON.parse(readFileSync(new URL(file, import.meta.url), "utf8")).version;
}

describe("opencode plugin", async () => {
  const { agents, skills, commands, prompts } = await setup();

  test("adds each agent of the team", () => {
    assert.deepEqual([...agents.keys()].sort(), AGENTS.map((name) => `tidy-dev/${name}`));
  });

  test("makes the manager the only primary agent", () => {
    for (const name of AGENTS) {
      assert.equal(agents.get(`tidy-dev/${name}`).mode, name === "manager" ? "primary" : "subagent");
    }
  });

  test("gives each agent the color of its file as a hex value", () => {
    for (const name of AGENTS) {
      assert.equal(agents.get(`tidy-dev/${name}`).color, COLORS[name]);
    }
  });

  test("denies each agent the actions its tools leave out", () => {
    for (const name of AGENTS) {
      assert.deepEqual(
        agents.get(`tidy-dev/${name}`).permissions,
        DENIED[name].map((action) => ({ action, resource: "*", effect: "deny" })),
      );
    }
  });

  test("adds each skill of the team", () => {
    assert.deepEqual([...skills.keys()].sort(), SKILLS.map((name) => `tidy-dev-${name}`));
  });

  test("adds a command for each skill that takes input", () => {
    assert.deepEqual([...commands.keys()].sort(), COMMANDS.map((name) => `tidy-dev/${name}`));
  });

  test("leaves no Claude Code text", () => {
    for (const { description, system } of agents.values()) {
      assert.doesNotMatch(description, CLAUDE_ONLY);
      assert.doesNotMatch(system, CLAUDE_ONLY);
    }
    for (const { description, content } of skills.values()) {
      assert.doesNotMatch(description, CLAUDE_ONLY);
      assert.doesNotMatch(content, CLAUDE_ONLY);
    }
  });

  test("sends a command to the session as a request for its skill", () => {
    commands.get("tidy-dev/plan").execute({ sessionID: "s1", prompt: { text: " a login page " }, delivery: "queue" });
    assert.deepEqual(prompts.pop(), {
      sessionID: "s1",
      text: "Use the `tidy-dev-plan` skill.\n\nThe feature: a login page",
      delivery: "queue",
    });
  });

  test("sends a command of a forked skill as a request for its agent", () => {
    commands.get("tidy-dev/review").execute({ sessionID: "s1", prompt: { text: "all" }, delivery: "queue" });
    assert.deepEqual(prompts.pop(), {
      sessionID: "s1",
      text: [
        "Start the `tidy-dev/reviewer` agent with this request, word for word, and show its report as it is.",
        "Use the `tidy-dev-review` skill.",
        "The scope and the focus: all",
      ].join("\n\n"),
      delivery: "queue",
    });
  });
});

describe("manifests", () => {
  test("carry the same version", () => {
    assert.match(version("package.json"), /^\d+\.\d+\.\d+$/);
    assert.equal(version(".claude-plugin/plugin.json"), version("package.json"));
  });
});
