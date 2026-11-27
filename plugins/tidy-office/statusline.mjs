import { execFileSync } from "node:child_process";
import { readFileSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { basename, join } from "node:path";
import { fileURLToPath } from "node:url";

const DIR = fileURLToPath(new URL(".", import.meta.url));
const LIMITS_FILE = join(DIR, "limits.json");
const SESSION = /^[A-Za-z0-9_-]+$/;

function branch(dir) {
  try {
    return execFileSync("git", ["-C", dir, "branch", "--show-current"], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
  } catch {
    return "";
  }
}

function tokens(window) {
  const usage = window?.current_usage;
  if (!usage) return undefined;
  const used = (usage.input_tokens ?? 0) + (usage.cache_creation_input_tokens ?? 0) + (usage.cache_read_input_tokens ?? 0);
  return used ? `${Math.round(used / 1000)}k ctx` : undefined;
}

function duration(ms, label) {
  if (typeof ms !== "number") return undefined;
  const seconds = Math.floor(ms / 1000);
  const hours = Math.floor(seconds / 3600);
  const pad = (n) => String(n).padStart(2, "0");
  if (hours >= 24) return `${Math.floor(hours / 24)}d ${hours % 24}h ${label}`;
  return `${hours}:${pad(Math.floor(seconds / 60) % 60)}:${pad(seconds % 60)} ${label}`;
}

function flag(on, label) {
  return on ? label : [...label].map((char) => `${char}̶`).join("");
}

function money(usd) {
  return typeof usd === "number" ? `$${usd.toFixed(2)}` : undefined;
}

function limit(window, label) {
  return [
    typeof window?.used_percentage === "number" && `${label} ${Math.round(window.used_percentage)}%`,
    typeof window?.resets_at === "number" && duration(Math.max(0, window.resets_at * 1000 - Date.now()), "left"),
  ];
}

// Every session writes the shared limits, and an idle one holds old numbers.
// A saved window counts until it resets. The window that resets later is the newer one.
// With the same reset, the higher usage is.
function fresher(saved, window) {
  if (typeof saved?.resets_at !== "number" || saved.resets_at * 1000 <= Date.now()) return window;
  if (typeof window?.resets_at !== "number") return saved;
  if (saved.resets_at !== window.resets_at) return saved.resets_at > window.resets_at ? saved : window;
  return saved.used_percentage > window.used_percentage ? saved : window;
}

function load(file) {
  try {
    return JSON.parse(readFileSync(file, "utf8"));
  } catch {
    return null;
  }
}

function save(file, text) {
  const temp = `${file}.${process.pid}.tmp`;
  try {
    writeFileSync(temp, text, { mode: 0o600 });
    renameSync(temp, file);
  } catch {
    rmSync(temp, { force: true });
  }
}

const { session_id, workspace, model, effort, thinking, fast_mode, context_window, cost, rate_limits } = JSON.parse(
  readFileSync(0, "utf8"),
);

if (rate_limits) {
  const saved = load(LIMITS_FILE);
  save(
    LIMITS_FILE,
    JSON.stringify({
      five_hour: fresher(saved?.five_hour, rate_limits.five_hour),
      seven_day: fresher(saved?.seven_day, rate_limits.seven_day),
    }),
  );
}
if (SESSION.test(session_id ?? "")) {
  save(join(DIR, `${session_id}.status.json`), JSON.stringify({ model: model?.id, effort: effort?.level }));
}

const project = workspace?.project_dir;
const groups = [
  [basename(project), branch(project)],
  [model?.display_name, effort?.level, flag(thinking?.enabled, "thinking"), flag(fast_mode, "fast")],
  [
    tokens(context_window),
    duration(cost?.total_api_duration_ms, "model"),
    duration(cost?.total_duration_ms, "session"),
    money(cost?.total_cost_usd),
  ],
  limit(rate_limits?.five_hour, "5h"),
  limit(rate_limits?.seven_day, "7d"),
];

process.stdout.write(
  groups
    .map((group) => group.filter(Boolean).join(" · "))
    .filter(Boolean)
    .join(" │ "),
);
