# Defaults

Depth for the defaults standard of the `secure-code` skill.

## Method

When the change adds something that can be open or closed (a server, a route, an option, a flag, a header, a cookie, a permission, a file, a dependency), in order:

1. Name its two states: the open one and the closed one.
2. Make the closed one the default: what you get with no config, no flag and no action.
3. Open it only with a reason from the job, and only as far as the reason goes: one origin, one path, one role.
4. Ask what happens when it fails, or when its config is missing. The answer must be the closed state.
5. If a protection of the framework or the platform is in the way, it stays on.
6. Say in the report what is open, and what the control does not cover.

## Where the line is

1. A server: `127.0.0.1`. `0.0.0.0` only when the job says other machines connect. A local server also checks the `Host` header, so a web page cannot reach it through a made-up name.
2. HTTP methods: only the ones the route needs. Reads on GET, changes on the others.
3. CORS: no CORS headers until a named origin needs them. Never `*` with credentials. Never the request's own origin echoed back.
4. A cookie: `HttpOnly`, `Secure`, `SameSite=Lax` or stricter, and the narrowest path and domain.
5. Security headers: the framework's defaults stay on. To let one script or frame in, open the policy for that one source.
6. TLS: certificate checks on, and `https` for every outbound call. No switch "for development" in code.
7. Debug mode and stack traces: off unless the environment says development. With no environment set, it is production.
8. A feature flag or an option: off, or the stricter value. Missing config means strict.
9. A file: mode `0600` when it holds a secret or private data. Never `777`. A temp file comes from the platform's own temp API.
10. A database or a service account: it can do what the app does. It does not own the database.
11. A token: the narrowest scope and the shortest life that works.
12. An outbound call: a timeout, always.
13. A new dependency: look it up first: it exists, it is the one you mean (check the spelling and the owner), it is maintained, and the version is the latest. The lockfile pins it. It is the user's decision.
14. Code built at run time: no `eval`, no `new Function`, no import or require of a name that came from input.
15. Data kept: only what the job needs, with an end date. Do not read files the job does not need: the user's home folder, other projects, chat transcripts.
16. A call out of the app, like telemetry, an update check, or a font or a script from a CDN: none, unless the job says so.
17. A helper for development, like a seed user, a default password, a login bypass or a mock of the access check: it cannot be reached in production. Best is not in the code at all.
18. The safe default blocks the job: the open state is the user's decision, unless the plan already made it.
19. A control with a limit: say the limit in the report and in the docs. A guard rail is not called a sandbox.
20. A control that cannot say no: remove it. It reads as safety and gives none.

## Examples

A local server. With no address, Node listens on every interface.

Wrong:

```js
server.listen(PORT);
```

Right:

```js
server.listen(PORT, "127.0.0.1");
```

CORS that echoes any origin back, with credentials.

Wrong:

```js
app.use(cors({ origin: true, credentials: true }));
```

Right:

```js
app.use(cors({ origin: "https://app.example.com", credentials: true }));
```

Missing config. In the wrong version, a missing variable opens the app.

Wrong:

```js
const requireLogin = process.env.REQUIRE_LOGIN === "true";
```

Right:

```js
const allowGuests = process.env.ALLOW_GUESTS === "true";
```
