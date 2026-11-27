import { readFileSync } from "node:fs";
import { guard } from "./guard.mjs";

const { tool_input } = JSON.parse(readFileSync(0, "utf8"));
const message = guard(tool_input?.command);

if (message) {
  process.stderr.write(`${message}\n`);
  process.exitCode = 2;
}
