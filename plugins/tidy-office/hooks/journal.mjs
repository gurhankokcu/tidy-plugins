import { appendFileSync, mkdirSync, statSync, unlinkSync } from "node:fs";
import { join } from "node:path";
import { cut, entries, SETTING_MAX } from "../app/files.mjs";

const SESSION = /^[A-Za-z0-9_-]+$/;
const MAX_AGE_MS = 24 * 60 * 60 * 1000;
const ACTIVITY_MAX = 80;
const MESSAGE_MAX = 280;

function prune(dir) {
  for (const name of entries(dir)) {
    const file = join(dir, name);
    try {
      if (Date.now() - statSync(file).mtimeMs > MAX_AGE_MS) unlinkSync(file);
    } catch {}
  }
}

// Adds one event to the file of its session.
export function record(dir, session, event) {
  if (!dir || !SESSION.test(session ?? "")) return;
  mkdirSync(dir, { recursive: true, mode: 0o700 });
  if (event.event === "SessionStart") prune(dir);
  const line = {
    time: Date.now(),
    ...event,
    model: cut(event.model, SETTING_MAX),
    effort: cut(event.effort, SETTING_MAX),
    activity: cut(event.activity, ACTIVITY_MAX),
    message: cut(event.message, MESSAGE_MAX),
  };
  appendFileSync(join(dir, `${session}.jsonl`), `${JSON.stringify(line)}\n`, { mode: 0o600 });
}
