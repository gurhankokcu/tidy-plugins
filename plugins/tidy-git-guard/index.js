import { guard } from "./hooks/guard.mjs";

// opencode renames a call to `bash` to `shell` in a hook of its own, which may run after this one.
const SHELL_TOOLS = new Set(["bash", "shell"]);

export default {
  id: "tidy-git-guard",
  async setup(ctx) {
    await ctx.tool.hook("execute.before", (event) => {
      const message = SHELL_TOOLS.has(event.tool) ? guard(event.input?.command) : null;
      if (message) throw new Error(message);
    });
  },
};
