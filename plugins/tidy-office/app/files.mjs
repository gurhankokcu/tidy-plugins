import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

export const WORD = "[A-Za-z0-9_-][A-Za-z0-9._-]*";
export const FILE = new RegExp(`^(${WORD})\\.md$`);
export const SETTING_MAX = 40;
const PLUGIN = new RegExp(`^(${WORD})@`);

export function entries(dir) {
  try {
    return readdirSync(dir);
  } catch {
    return [];
  }
}

export function load(file) {
  try {
    return JSON.parse(readFileSync(file, "utf8"));
  } catch {
    return null;
  }
}

export function cut(text, max) {
  if (typeof text !== "string") return undefined;
  const chars = Array.from(text.replace(/\s+/g, " ").trim());
  return chars.length > max ? `${chars.slice(0, max - 1).join("")}…` : chars.join("");
}

// The installed plugins, each name with its root folder. The plugins root is two folders above a plugin's data folder.
export function plugins(dataDir) {
  const found = new Map();
  const installed = load(join(dataDir, "..", "..", "installed_plugins.json"))?.plugins;
  for (const [id, installs] of Object.entries(installed ?? {})) {
    const name = id.match(PLUGIN)?.[1];
    const root = Array.isArray(installs) ? installs[0]?.installPath : undefined;
    if (name && typeof root === "string" && !found.has(name)) found.set(name, root);
  }
  return found;
}

// Returns a reader of the frontmatter fields of an agent file, or null when the file cannot be read.
export function frontmatter(file) {
  let text;
  try {
    text = readFileSync(file, "utf8");
  } catch {
    return null;
  }
  const front = text.match(/^---\r?\n([\s\S]*?)\r?\n---/)?.[1] ?? "";
  return (key) => cut(front.match(new RegExp(`^${key}:\\s*(.+)$`, "m"))?.[1].replace(/^["']|["']$/g, ""), SETTING_MAX);
}
