import { execFile, spawn } from "node:child_process";
import { closeSync, openSync, readFileSync, readSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { join } from "node:path";
import { StringDecoder } from "node:string_decoder";
import { setTimeout as sleep } from "node:timers/promises";
import { fileURLToPath } from "node:url";
import { cut, entries, FILE, frontmatter, load, plugins, SETTING_MAX, WORD } from "./files.mjs";

const HOST = "127.0.0.1";
const PORT = Number(process.env.TIDY_OFFICE_PORT ?? 7341);
const ORIGIN = `http://${HOST}:${PORT}`;
const HOSTS = new Set([`${HOST}:${PORT}`, `localhost:${PORT}`]);
const [DIR, TARGET] = process.argv.slice(2);
// A server on the port is this office only when it serves the same data folder.
const HEALTH = `tidy-office ${DIR}`;
const SESSION = /^[A-Za-z0-9_-]+$/;
const KEY = new RegExp(`^${WORD}$`);
const SHIRT = /^#[0-9a-fA-F]{6}$/;
const SHIRTS = new Map([
  ["red", "#e0524f"],
  ["blue", "#4f8fe8"],
  ["green", "#4cb86a"],
  ["yellow", "#e3c23f"],
  ["purple", "#9b6bdf"],
  ["orange", "#e8893c"],
  ["pink", "#e87fb4"],
  ["cyan", "#3cc4c9"],
]);
const AGENT = { shirt: "#e8e2d6" };
const GUESTS = { title: "Guests", shirt: "#8a8f98" };
const OPENERS = { darwin: ["open"], win32: ["cmd", "/c", "start", ""] };
const IDLE_MS = 30_000;
const POLL_MS = 300;
const SELF = fileURLToPath(import.meta.url);

function fail(message) {
  console.error(message);
  process.exit(1);
}

async function healthy() {
  try {
    const response = await fetch(`${ORIGIN}/health`, { signal: AbortSignal.timeout(500) });
    return (await response.text()) === HEALTH;
  } catch {
    return false;
  }
}

async function waitUntilHealthy() {
  for (let attempt = 0; attempt < 20; attempt++) {
    if (await healthy()) return true;
    await sleep(150);
  }
  return false;
}

function open(url) {
  const [command, ...args] = OPENERS[process.platform] ?? ["xdg-open"];
  execFile(command, [...args, url], () => {});
}

async function launch(session) {
  if (!DIR || !SESSION.test(session ?? "")) fail("Usage: node server.mjs <data-dir> <session-id>");
  if (!(await healthy())) {
    spawn(process.execPath, [SELF, DIR, "--serve"], { detached: true, stdio: "ignore", windowsHide: true }).unref();
    if (!(await waitUntilHealthy())) fail(`Tidy Agent Office could not start on port ${PORT}.`);
  }
  const url = `${ORIGIN}/?session=${session}`;
  open(url);
  console.log(url);
}

function send(response, status, type, body) {
  response.writeHead(status, { "Content-Type": type, "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" });
  response.end(body);
}

function parse(line) {
  try {
    return JSON.parse(line);
  } catch {
    return null;
  }
}

function matching(pattern, text, fallback) {
  return typeof text === "string" && pattern.test(text) ? text : fallback;
}

function capitalize(text) {
  return text[0].toUpperCase() + text.slice(1);
}

function settings(file) {
  const field = frontmatter(file);
  return field && { color: field("color") };
}

function desk(defaults, custom) {
  return {
    title: cut(custom?.title, SETTING_MAX) || defaults.title,
    item: matching(KEY, custom?.item, undefined),
    screen: matching(KEY, custom?.screen, undefined),
    shirt: matching(SHIRT, custom?.shirt, defaults.shirt),
  };
}

// The agents of a Claude Code plugin, each name with its settings.
function pluginAgents(root) {
  const dir = join(root, "agents");
  const found = new Map();
  for (const file of entries(dir).sort()) {
    const agent = file.match(FILE)?.[1];
    const each = agent && settings(join(dir, file));
    if (each) found.set(agent, each);
  }
  return found;
}

// The agents of an opencode team, each name with its settings, as the opencode plugin lists them in `teams.json`.
function listedAgents(team) {
  const found = Object.entries(team ?? {}).filter(([agent]) => KEY.test(agent));
  return new Map(found.sort(([a], [b]) => a.localeCompare(b)));
}

function office(name, team, custom) {
  const agents = new Map();
  for (const [agent, each] of team) {
    const shirt = SHIRTS.get(each?.color) ?? matching(SHIRT, each?.color, AGENT.shirt);
    agents.set(agent, desk({ title: capitalize(agent), shirt }, custom?.agents?.[agent]));
  }
  if (agents.size === 0) return null;
  const listed = Object.keys(custom?.agents ?? {}).filter((agent) => agents.has(agent));
  const order = new Set([...listed, ...agents.keys()]);
  return {
    title: cut(custom?.title, SETTING_MAX) || name,
    guests: desk(GUESTS, custom?.guests),
    agents: Object.fromEntries(Array.from(order, (agent) => [agent, agents.get(agent)])),
  };
}

// The teams, each name with its agents and its office file.
// A Claude Code team is an installed plugin. An opencode team is a group of agents in `teams.json`.
function teams() {
  const listed = Object.entries(load(join(DIR, "teams.json")) ?? {}).filter(([name]) => KEY.test(name));
  return [
    ...Array.from(plugins(DIR), ([name, root]) => [name, pluginAgents(root), load(join(root, "office.json"))]),
    ...listed.map(([name, team]) => [name, listedAgents(team), null]),
  ];
}

function offices() {
  const found = new Map();
  for (const [name, team, custom] of teams()) {
    const each = office(name, team, custom);
    if (each) found.set(name, each);
  }
  return Object.fromEntries(found);
}

function folder(lines) {
  for (const line of lines) {
    const cwd = parse(line)?.cwd;
    if (typeof cwd === "string") return cwd;
  }
  return null;
}

function sessions() {
  const list = [];
  for (const name of entries(DIR)) {
    const id = name.endsWith(".jsonl") ? name.slice(0, -6) : "";
    if (!SESSION.test(id)) continue;
    const file = join(DIR, name);
    try {
      const lines = readFileSync(file, "utf8").split("\n").filter(Boolean);
      list.push({
        id,
        cwd: folder(lines),
        updated: statSync(file).mtimeMs,
        ended: parse(lines.at(-1))?.event === "SessionEnd",
      });
    } catch {}
  }
  return list.sort((a, b) => b.updated - a.updated);
}

function serve() {
  const page = readFileSync(join(SELF, "..", "index.html"));
  const clients = new Set();
  let idle;

  function armIdle() {
    clearTimeout(idle);
    if (clients.size === 0) idle = setTimeout(() => process.exit(0), IDLE_MS);
  }

  function stream(request, response, session) {
    const file = join(DIR, `${session}.jsonl`);
    let offset = 0;
    let rest = "";
    let decoder = new StringDecoder("utf8");

    function pump() {
      let size;
      try {
        size = statSync(file).size;
      } catch {
        return;
      }
      if (size < offset) {
        offset = 0;
        rest = "";
        decoder = new StringDecoder("utf8");
      }
      if (size <= offset) return;
      const buffer = Buffer.alloc(size - offset);
      const fd = openSync(file, "r");
      try {
        readSync(fd, buffer, 0, buffer.length, offset);
      } finally {
        closeSync(fd);
      }
      offset = size;
      const lines = (rest + decoder.write(buffer)).split("\n");
      rest = lines.pop();
      for (const line of lines) if (line) response.write(`data: ${line}\n\n`);
    }

    response.writeHead(200, { "Content-Type": "text/event-stream", "Cache-Control": "no-store", Connection: "keep-alive" });
    pump();
    const timer = setInterval(pump, POLL_MS);
    clients.add(response);
    armIdle();

    request.on("close", () => {
      clearInterval(timer);
      clients.delete(response);
      armIdle();
    });
  }

  function sendFile(response, name) {
    let body;
    try {
      body = readFileSync(join(DIR, name));
    } catch {
      return send(response, 404, "text/plain", "Not found");
    }
    send(response, 200, "application/json; charset=utf-8", body);
  }

  createServer((request, response) => {
    if (!HOSTS.has(request.headers.host)) return send(response, 403, "text/plain", "Forbidden");
    if (request.method !== "GET") return send(response, 405, "text/plain", "Method not allowed");

    const url = new URL(request.url, ORIGIN);
    if (url.pathname === "/") return send(response, 200, "text/html; charset=utf-8", page);
    if (url.pathname === "/offices.json") {
      return send(response, 200, "application/json; charset=utf-8", JSON.stringify(offices()));
    }
    if (url.pathname === "/limits.json") return sendFile(response, "limits.json");
    if (url.pathname === "/sessions.json") {
      armIdle();
      return send(response, 200, "application/json; charset=utf-8", JSON.stringify(sessions()));
    }
    if (url.pathname === "/health") return send(response, 200, "text/plain", HEALTH);
    if (url.pathname === "/status.json") {
      const session = url.searchParams.get("session") ?? "";
      if (!SESSION.test(session)) return send(response, 400, "text/plain", "Bad session");
      return sendFile(response, `${session}.status.json`);
    }
    if (url.pathname === "/events") {
      const session = url.searchParams.get("session") ?? "";
      if (!SESSION.test(session)) return send(response, 400, "text/plain", "Bad session");
      return stream(request, response, session);
    }
    send(response, 404, "text/plain", "Not found");
  }).listen(PORT, HOST);

  armIdle();
}

if (TARGET === "--serve") serve();
else await launch(TARGET);
