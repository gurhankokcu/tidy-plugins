---
description: Open the Tidy Agent Office, a pixel office in the browser that shows this session's agents live. Use only when the user types it.
argument-hint: "[port, default 7542]"
disable-model-invocation: true
---

# Open

Open the Tidy Agent Office for this session.

1. Run `node "${CLAUDE_PLUGIN_ROOT}/app/server.mjs" "${CLAUDE_PLUGIN_DATA}" ${CLAUDE_SESSION_ID} "$ARGUMENTS" /tidy-office:open` with Bash.
2. Reply with one line: the URL it printed, or its error.
