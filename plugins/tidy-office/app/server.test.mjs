import assert from "node:assert/strict";
import { spawn, spawnSync } from "node:child_process";
import { once } from "node:events";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { createServer, request as httpRequest } from "node:http";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { after, before, describe, test } from "node:test";
import { setTimeout as sleep } from "node:timers/promises";
import { fileURLToPath } from "node:url";

const SERVER = fileURLToPath(new URL("server.mjs", import.meta.url));
const HOST = "127.0.0.1";
const ROOT = mkdtempSync(join(tmpdir(), "tidy-office-"));
const TEAM = join(ROOT, "team");
const PLAIN = join(ROOT, "plain");
const PLUGINS = join(ROOT, "plugins");
const DIR = join(PLUGINS, "data", "tidy-office");
const GUESTS = { title: "Guests", shirt: "#8a8f98" };
const START = { time: 1, event: "SessionStart", cwd: "/work/project", agentType: "team:manager" };
const STOP = { time: 2, event: "Stop", message: "Done." };
const LIMITS = { five_hour: { used_percentage: 40, resets_at: 1 } };

function writeAgent(root, name, color) {
  const fields = [`name: ${name}`, ...(color ? [`color: ${color}`] : [])];
  mkdirSync(join(root, "agents"), { recursive: true });
  writeFileSync(join(root, "agents", `${name}.md`), `---\n${fields.join("\n")}\n---\n`);
}

writeAgent(TEAM, "manager", "purple");
writeAgent(TEAM, "tester", "cyan");
writeAgent(PLAIN, "solo");
writeFileSync(
  join(TEAM, "office.json"),
  JSON.stringify({ title: "Test team", agents: { tester: { title: "QA", item: "signal" } } }),
);
mkdirSync(DIR, { recursive: true });
writeFileSync(
  join(PLUGINS, "installed_plugins.json"),
  JSON.stringify({ plugins: { "team@market": [{ installPath: TEAM }], "plain@market": [{ installPath: PLAIN }] } }),
);
writeFileSync(join(DIR, "main.jsonl"), `${JSON.stringify(START)}\n${JSON.stringify(STOP)}\n`);

async function freePort() {
  const probe = createServer().listen(0, HOST);
  await once(probe, "listening");
  const { port } = probe.address();
  probe.close();
  await once(probe, "close");
  return port;
}

const PORT = await freePort();
const ORIGIN = `http://${HOST}:${PORT}`;

function request(path, { method = "GET", headers = {} } = {}) {
  return new Promise((resolve, reject) => {
    const call = httpRequest({ hostname: HOST, port: PORT, path, method, headers, agent: false }, (response) => {
      let body = "";
      response.setEncoding("utf8");
      response.on("data", (chunk) => (body += chunk));
      response.on("end", () => resolve({ status: response.statusCode, body }));
    });
    call.on("error", reject);
    call.end();
  });
}

async function json(path) {
  const { status, body } = await request(path);
  assert.equal(status, 200);
  return JSON.parse(body);
}

// Reads the first events of a stream that never ends.
async function events(session, count) {
  const response = await fetch(`${ORIGIN}/events?session=${session}`);
  const decoder = new TextDecoder();
  let text = "";
  for await (const chunk of response.body) {
    text += decoder.decode(chunk, { stream: true });
    if (text.split("\n\n").length > count) break;
  }
  return text
    .split("\n\n")
    .slice(0, count)
    .map((event) => JSON.parse(event.slice("data: ".length)));
}

async function started() {
  for (let attempt = 0; attempt < 50; attempt++) {
    try {
      return await request("/health");
    } catch {
      await sleep(100);
    }
  }
  throw new Error("The server did not start.");
}

describe("server", () => {
  let server;

  before(async () => {
    server = spawn(process.execPath, [SERVER, DIR, "--serve", String(PORT)], { stdio: "ignore" });
    await started();
  });

  after(() => {
    server.kill();
    rmSync(ROOT, { recursive: true });
  });

  test("names its data folder", async () => {
    assert.deepEqual(await request("/health"), { status: 200, body: `tidy-office ${DIR}` });
  });

  test("serves the page", async () => {
    const { status, body } = await request("/");
    assert.equal(status, 200);
    assert.ok(body.startsWith("<!doctype html>"));
  });

  test("refuses another host", async () => {
    const { status } = await request("/health", { headers: { Host: "evil.example" } });
    assert.equal(status, 403);
  });

  test("refuses another method", async () => {
    const { status } = await request("/health", { method: "POST" });
    assert.equal(status, 405);
  });

  test("refuses a session ID that is not a plain word", async () => {
    assert.equal((await request("/events?session=a.b")).status, 400);
    assert.equal((await request("/status.json?session=../main")).status, 400);
  });

  test("refuses a path it does not know", async () => {
    assert.equal((await request("/installed_plugins.json")).status, 404);
  });

  test("lists each session with its folder", async () => {
    const sessions = await json("/sessions.json");
    assert.deepEqual(
      sessions.map(({ updated, ...session }) => session),
      [{ id: "main", cwd: "/work/project", ended: false }],
    );
  });

  test("streams the events of a session", async () => {
    assert.deepEqual(await events("main", 2), [START, STOP]);
  });

  test("builds an office from the agent files of each team", async () => {
    const offices = await json("/offices.json");
    assert.deepEqual(offices, {
      team: {
        title: "Test team",
        guests: GUESTS,
        agents: {
          tester: { title: "QA", item: "signal", shirt: "#3cc4c9" },
          manager: { title: "Manager", shirt: "#9b6bdf" },
        },
      },
      plain: { title: "plain", guests: GUESTS, agents: { solo: { title: "Solo", shirt: "#e8e2d6" } } },
    });
    assert.deepEqual(Object.keys(offices.team.agents), ["tester", "manager"]);
  });

  test("builds an office from each team of opencode", async () => {
    const crew = { tester: { color: "blue" }, builder: { color: "#a1b2c3" }, "bad key": { color: "red" } };
    writeFileSync(join(DIR, "teams.json"), JSON.stringify({ crew }));
    const offices = await json("/offices.json");
    assert.deepEqual(offices.crew, {
      title: "crew",
      guests: GUESTS,
      agents: {
        builder: { title: "Builder", shirt: "#a1b2c3" },
        tester: { title: "Tester", shirt: "#4f8fe8" },
      },
    });
    assert.deepEqual(Object.keys(offices.crew.agents), ["builder", "tester"]);
  });

  test("serves the limits only when there is data", async () => {
    assert.equal((await request("/limits.json")).status, 404);
    writeFileSync(join(DIR, "limits.json"), JSON.stringify(LIMITS));
    assert.deepEqual(await json("/limits.json"), LIMITS);
  });

  test("does not reuse a server of another data folder, and names another port in the tool's command", () => {
    const other = join(ROOT, "other");
    const next = PORT < 65535 ? PORT + 1 : 65534;
    for (const command of ["/tidy-office:open", "/tidy-office/open"]) {
      const args = [SERVER, other, "main", String(PORT), command];
      const { status, stderr } = spawnSync(process.execPath, args, { encoding: "utf8" });
      assert.equal(status, 1);
      assert.equal(
        stderr,
        `Tidy Agent Office could not start on port ${PORT}. Pass another port, like \`${command} ${next}\`.\n`,
      );
    }
  });

  test("refuses a port that is not a whole number from 1024 to 65535", () => {
    for (const port of ["1023", "65536", "0", "-8000", "7600x", "7.5", "1e4"]) {
      const args = [SERVER, DIR, "main", port, "/tidy-office:open"];
      const { status, stderr } = spawnSync(process.execPath, args, { encoding: "utf8" });
      assert.equal(status, 1, port);
      assert.equal(stderr, "The port must be a whole number from 1024 to 65535.\n", port);
    }
  });

  test("refuses an open command it does not know", () => {
    const { status, stderr } = spawnSync(process.execPath, [SERVER, DIR, "main", "", "/other"], { encoding: "utf8" });
    assert.equal(status, 1);
    assert.equal(stderr, 'Usage: node server.mjs <data-dir> <session-id> <port, or "" for 7542> <open-command>\n');
  });
});
