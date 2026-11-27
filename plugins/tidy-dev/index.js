import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const PLUGIN = "tidy-dev";
const ROOT = import.meta.dirname;

const AGENTS = readdirSync(join(ROOT, "agents"))
  .filter((file) => file.endsWith(".md"))
  .map((file) => file.slice(0, -".md".length));
const SKILLS = readdirSync(join(ROOT, "skills"), { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name);
const PRIMARY_AGENT = "manager";

const ACTIONS = ["read", "glob", "grep", "edit", "shell", "skill", "subagent", "question", "webfetch", "websearch"];
const TOOL_ACTIONS = {
  Bash: "shell",
  Edit: "edit",
  Glob: "glob",
  Grep: "grep",
  NotebookEdit: "edit",
  Read: "read",
  Skill: "skill",
  Write: "edit",
};
const COLORS = {
  red: "#e0524f",
  blue: "#4f8fe8",
  green: "#4cb86a",
  yellow: "#e3c23f",
  purple: "#9b6bdf",
  orange: "#e8893c",
  pink: "#e87fb4",
  cyan: "#3cc4c9",
};

const REPLACEMENTS = [
  [/`\$\{CLAUDE_PLUGIN_ROOT\}\/skills\/([\w-]+)\/SKILL\.md`/g, (_, name) => `the \`${skillId(name)}\` skill`],
  [/`\$\{CLAUDE_PLUGIN_ROOT\}\/skills\/([\w-]+)\/`/g, (_, name) => `the folder of the \`${skillId(name)}\` skill`],
  [new RegExp(`/${PLUGIN}:([\\w-]+)`, "g"), (_, name) => `/${commandId(name)}`],
  [new RegExp(`${PLUGIN}:([\\w-]+)`, "g"), (_, name) => teamId(name)],
  ["the Skill tool", "the skill tool"],
  [
    ", unless the table says it is loaded at start.",
    ". Before your first job, also load the ones the table says are loaded at start.",
  ],
  ["with SendMessage", "with its session ID"],
  ["Keep the agent IDs", "Keep the session IDs"],
  [/ Start it with `claude --agent [^`]+`\./g, ""],
];
const CLAUDE_ONLY = new RegExp(`${PLUGIN}:|CLAUDE_PLUGIN_ROOT|Skill tool|SendMessage|claude --`);

const ARGUMENTS = /^(.*: \$ARGUMENTS)\n\n/m;
const NO_ARGUMENTS = "When the line above is empty, the ";

function agentId(name) {
  return `${PLUGIN}/${name}`;
}

function commandId(name) {
  return `${PLUGIN}/${name}`;
}

function skillId(name) {
  return `${PLUGIN}-${name}`;
}

function teamId(name) {
  if (AGENTS.includes(name)) return agentId(name);
  if (SKILLS.includes(name)) return skillId(name);
  throw new Error(`${PLUGIN}:${name} is not an agent or a skill`);
}

// Rewrites text written for Claude Code into text for opencode.
function convert(text) {
  const result = REPLACEMENTS.reduce((each, [pattern, replacement]) => each.replaceAll(pattern, replacement), text);
  const [found] = result.match(CLAUDE_ONLY) ?? [];
  if (found) throw new Error(`Claude Code text is left: ${found}`);
  return result;
}

function read(path) {
  const [, head, body] = readFileSync(path, "utf8").match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  const fields = {};
  for (const line of head.split("\n")) {
    const [, key, value] = line.match(/^([\w-]+): *(.*)$/) ?? [];
    if (key) fields[key] = value;
  }
  return { fields, body };
}

function toolActions(tools) {
  return new Set(
    tools.split(", ").map((tool) => {
      if (!Object.hasOwn(TOOL_ACTIONS, tool)) throw new Error(`${tool} has no opencode action`);
      return TOOL_ACTIONS[tool];
    }),
  );
}

function deniedActions({ tools, disallowedTools }) {
  if (tools) return ACTIONS.filter((action) => !toolActions(tools).has(action));
  if (disallowedTools) return ACTIONS.filter((action) => toolActions(disallowedTools).has(action));
  return [];
}

function color(name) {
  if (!Object.hasOwn(COLORS, name)) throw new Error(`${name} has no opencode color`);
  return COLORS[name];
}

function agent(name) {
  const { fields, body } = read(join(ROOT, "agents", `${name}.md`));
  return {
    id: agentId(name),
    description: convert(fields.description),
    mode: name === PRIMARY_AGENT ? "primary" : "subagent",
    color: color(fields.color),
    system: convert(body).trim(),
    permissions: deniedActions(fields).map((action) => ({ action, resource: "*", effect: "deny" })),
  };
}

// A skill takes its input from `$ARGUMENTS` in Claude Code. In opencode only a command has it, so the line moves there.
function skill(name) {
  const path = join(ROOT, "skills", name, "SKILL.md");
  const { fields, body } = read(path);
  const text = convert(body);
  const [block, input] = text.match(ARGUMENTS) ?? [];
  return {
    id: skillId(name),
    description: convert(fields.description),
    path,
    content: (block ? text.replace(block, "").replace(NO_ARGUMENTS, "The ") : text).trim(),
    command: commandId(name),
    input,
    agent: fields.context === "fork" ? convert(fields.agent) : undefined,
  };
}

function request({ id, input, agent }, typed) {
  const text = `Use the \`${id}\` skill.\n\n${input.replace("$ARGUMENTS", () => typed.trim())}`;
  if (!agent) return text;
  return `Start the \`${agent}\` agent with this request, word for word, and show its report as it is.\n\n${text}`;
}

export default {
  id: PLUGIN,
  async setup(ctx) {
    const agents = AGENTS.map(agent);
    const skills = SKILLS.map(skill);

    await ctx.agent.transform((editor) => {
      for (const { id, permissions, ...settings } of agents) {
        editor.update(id, (draft) => {
          Object.assign(draft, settings);
          draft.permissions.push(...permissions);
        });
      }
    });
    await ctx.skill.transform((editor) => {
      for (const { id, description, path, content } of skills) editor.add({ id, name: id, description, path, content });
    });
    await ctx.command.transform((editor) => {
      for (const each of skills.filter(({ input }) => input)) {
        editor.add({
          name: each.command,
          description: each.description,
          execute: ({ sessionID, prompt, delivery }) =>
            ctx.session.prompt({ ...prompt, sessionID, text: request(each, prompt.text), delivery }),
        });
      }
    });
  },
};
