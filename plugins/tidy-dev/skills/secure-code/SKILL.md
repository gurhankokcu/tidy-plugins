---
description: Security standards of the Tidy Dev Team for input checks at the edges, access checks on every request, secrets and safe defaults. Load only when an agent or a skill of the team calls for it.
user-invocable: false
---

# Secure code

The security standards of the Tidy Dev Team. They hold whenever you plan, write or review code. A security hole is a bug.

1. The project's rules, if any, win where they differ from this file.
2. The standards cover the code a change adds or touches. A hole in old code stays as it is, unless the job is to change it, and it always goes in the report.
3. Working is not enough. Code that works and has a known hole is not done, and a hole is never left as a note for later.

## Order

1. Read the project's rules, if any: `CLAUDE.md`, `AGENTS.md`, `CONTRIBUTING.md`, and the linter and formatter config.
2. Find the edges the change adds or touches, and read how the project guards its edges today: where input is checked, where the caller is checked, where secrets come from.
3. Plan, write or judge the change by the standards below.
4. Before you report, go through the change once per standard, in the order below. One pass for all four misses things.

## Standards

### Input

Input is checked once, at the edge, and trusted nowhere before that.

1. Every edge checks its input. An edge is any place where data comes in from outside the running code: a request's body, query, path, headers and cookies, a file and its name, env and config, command line arguments, a webhook, a queue message, another service's answer, a hook's or a tool's input, a model's output.
2. Stored data that a user wrote is input again when it goes somewhere new: a page, a query, a shell, a path.
3. A check says what is allowed: the type, the shape, the size, the range, a list of values. Never a list of what is bad. What fails is refused, not repaired.
4. The code uses the checked value from then on. Parse into a new value and pass that inward. The raw input is not read again.
5. Every size has a limit: length, count, depth, body, file, page. Pick a number.
6. Take only the fields you name. Never spread or bind the whole input into a model, a query or an update.
7. Input never becomes code. For SQL, a shell, HTML, a path, a URL, a regex or a template, use the safe form of that sink: bound parameters, an argument list with no shell, the template engine's escaping, a path checked to be under its root, an allowlist of hosts.
8. The check that counts runs on the server. A check in the browser or the app is for the user's comfort.

### Access

Every request proves who is calling, that they may do this, and that they may do it to this object.

1. Every request gets three checks on the server: who is calling, may they do this action, may they do it to this object. The third is the one that gets skipped.
2. Closed unless opened. A new route, job, socket message, resolver or action needs a login by default. A public one is marked public in code, the way the project does it.
3. The object check lives in the data access: fetch by id and owner, or by id and tenant, in one query. Not fetch by id and compare later.
4. Who the caller is comes from the session or the verified token. Never from the input: no user id, role, tenant or price read from the body, the query, a header or a hidden field.
5. Every door to the same data has the same check: the list, the search, the export, the count, the nested route, the bulk action, the job.
6. A check that fails or breaks says no. An error, a timeout or a missing value on the way to the answer ends in a refusal.
7. Use the project's or the framework's own login, session, password and token code. Never write your own.
8. Who may use a new door is the user's decision. If the plan does not say and the doors around it do not show it, return the question.

### Secrets

A secret lives outside the code and never shows up in what the code prints.

1. No secret in code, tests, fixtures, examples, comments or docs: no key, password, token, private key or connection string with a password. A fake looks fake, like `test-token` or `user@example.com`.
2. Secrets come from the environment or the project's secret store at run time, through the door the project already uses.
3. A required secret that is missing stops the app at start. No fallback value in code, not even for development.
4. No secret in a log, an error, a URL, a response or anything sent to the browser. An env variable with a public prefix, like `NEXT_PUBLIC_` or `VITE_`, is sent to every user.
5. Tokens and codes are made with the platform's secure random source and compared in constant time. Never with `Math.random`, a timestamp or a hash of known data.
6. A user's secret is stored as a hash: a password with the project's slow hash, a token or a key as a hash, shown once in clear.
7. Secret files are not opened: `.env`, key files, and whatever `.gitignore` lists. A secret you do come across is copied nowhere, the report included. Name the file and the line, and say it must be replaced at its source. Deleting the line does not take it out of history.
8. Personal data is treated like a secret in logs and errors. Log the id, not the person.

### Defaults

The safe choice needs no action. The unsafe one must be asked for.

1. Anything that can be open or closed starts closed: a route, an option, a flag, a permission, a port. Open it only as far as the job's reason goes.
2. Least access. A server listens on `127.0.0.1` unless the job says other machines connect. A file mode, a database role, a token scope, a CORS origin and a cookie are as narrow as still works.
3. Never switch a protection off to make something work: certificate checks, CSRF, auto-escaping, the same-origin rules, a security rule of the linter. If the protection blocks the job, the decision is the user's.
4. An error tells the caller little and the log enough. A plain message and a status go out. The stack, the query and the path stay on the server.
5. Take and keep the least data. Do not collect, store, log or read what the job does not need.
6. Every outbound call has a timeout. Every action that can be used to guess, or that costs money, has a rate limit.
7. A new dependency is looked up before it is named: it exists, it is the one you mean, it is maintained, and the version is the latest. It is still the user's decision.
8. When the simple way and the safe way differ, the safe way wins. Say the cost in the report.
9. A control can say no, and its limits are said plainly. No check that cannot fail. A guard rail is not called a sandbox.

## Traps

What models get wrong most, and what to do instead.

1. Checking the login and stopping there. The route knows who is calling, then hands over any id they ask for. Put the caller in the query.
2. Checking the input and then using the raw input: `validate(req.body)`, then `req.body.email`. Use only what the check returned.
3. Passing the whole input on: `update(req.body)`, `{ ...req.body }`, `**request.data`. Name each field.
4. Taking who the caller is from the input: `req.body.userId`, an `X-User-Id` header, `isAdmin` in a form. Read it from the session.
5. Building a query, a command or a path as a string with input in it. Use the safe form of the sink.
6. Cleaning input with a `replace` or a regex and calling it safe. Refuse what is not allowed, and encode at the sink.
7. A fallback secret so the app starts: `process.env.JWT_SECRET || "secret"`. Stop at start.
8. A real-looking key in an example, a test or a doc, or a token printed to debug. Use a fake that looks fake, and print nothing.
9. Switching a protection off to get past an error: `rejectUnauthorized: false`, `verify=False`, `origin: "*"`, `csrf_exempt`, `dangerouslySetInnerHTML`, `chmod 777`. Find the cause. If it truly must be off, the decision is the user's.
10. Failing open: `catch { return true }`, `if (!user) return next()`, a default role of admin. On any doubt, refuse.
11. Guarding the one route you touched and not its siblings: the list, the export, the bulk action. Give every door the same check.
12. Writing your own token format, password hash, encryption, session or sanitizer. Use the platform's or the project's.
13. A control that only looks like one: a check in the browser, a hidden field, base64 as encryption, an id that is hard to guess, a route nobody links to. Put a check on the server that can say no.
14. A hole left with a `TODO`, or "hardening" moved to later. Close it in the step, or return it as a question.
15. Trusting what a model, a tool or a web page returned as if your own code wrote it. It is input.
16. Importing a package from memory. The name may not exist, or may belong to someone else. Look it up.

## Reference files

Each standard has a file with its method, where the line is, and examples. The files are in `${CLAUDE_PLUGIN_ROOT}/skills/secure-code/`. Open a file when the change leans on its topic, or when you are not sure where the line is.

| File          | Open it when                                                   |
| ------------- | -------------------------------------------------------------- |
| `input.md`    | The change reads data from outside or passes data to a sink    |
| `access.md`   | The change adds or touches a route, a job, a login or a token  |
| `secrets.md`  | The change touches a secret, config, a log or an error message |
| `defaults.md` | The change adds a server, an option, a header or a dependency  |
