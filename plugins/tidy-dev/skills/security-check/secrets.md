# Secrets

Depth for the secrets pass of the `security-check` skill. The standard is in `secrets.md` of the `secure-code` skill.

## Method

Following the secrets of a change, in order:

1. Read every added line for a value that looks like a secret: a long random string, a key with a known prefix, a URL with a password, a private key block. In code, tests, fixtures, examples, docs, config and CI files alike.
2. Leave secret files closed: `.env`, key files, and whatever `.gitignore` lists. When one of them is in the change, that it is there is the finding.
3. For each secret the change reads, find where it comes from, and what happens when it is missing.
4. Follow each secret forward, to every place it could show: a log, an error, a response, a URL, a cache, the browser, an outside service.
5. Then go backward. For each log line, error handler and response the change adds or touches, read what is in the thing it prints.
6. For each token or code the change makes: where the randomness comes from, its length, its life, how it is stored and how it is compared.
7. For each secret a user gives, like a password or an API key: how it is stored, and where it travels before that.
8. Read the removed lines: a start check that is gone, a field that is no longer cut from a log.

## Where the line is

1. A real-looking secret in the change: a row, first in the table. It names the file and the line, never the value. The fix takes it out before the commit, and replaces it at its source if it was ever committed or shared.
2. A fake that looks fake, like `test-token`: no row. A fake that looks real: a row, low in the table. Scanners and people cannot tell.
3. `changeme`, `secret` or `admin` as a default, or as a value in the example env file: a row. It gets deployed.
4. A fallback in code, like `process.env.JWT_SECRET || "dev"`: a row. Every install that forgets the variable shares one key.
5. A secret file in the change, or tracked by git: a row for the file. Do not open it.
6. A publishable key, a client id or an analytics id: no row.
7. A secret behind a public env prefix, like `NEXT_PUBLIC_` or `VITE_`, or imported into code that ships to the browser: a row.
8. A log line or an error with a whole request, the headers, a body, the env, a config object or a client library's error in it: a row. Name the secret that is inside.
9. An error passed on to the caller as it came: a row when it can hold a query, a path, a connection string or a URL with a token.
10. A secret in a URL: a row. It ends up in logs, history and referrers. A signed link with a short life is made to be a URL, and gets none.
11. A plain compare of a token, a signature or a code: a row, low in the table. A lookup by the token's hash is not a compare, and gets none.
12. `Math.random`, the time, a counter or a hash of known data as a token, a code or a reset link: a row. As a list key, a jitter or a test name: no row.
13. MD5 or SHA-1: a row when it protects something, like a password, a signature or a token. As a cache key, an ETag or a checksum against accidents: no row.
14. A password stored with a fast hash, SHA-256 included, salted or not: a row. A long random token stored as SHA-256: no row.
15. A token with no end, or with a wider scope than its job: a row, low in the table.
16. Encryption written by hand, a nonce that is used twice, or a mode that does not check the data: a row.
17. A secret echoed in CI, passed as a command line argument or copied into an image layer: a row. Arguments show in the process list, and layers stay in the image.
18. A secret you cannot judge without opening a closed file: a row that says what the user should check.

## Examples

A log that holds secrets.

```js
app.use((req, res, next) => {
  logger.info("request", { url: req.url, headers: req.headers });
  next();
});
```

Wrong:

```text
| 1 | security | app.js:12 | Logging may expose sensitive data | Be careful with what is logged |
```

Right:

```text
| 1 | security | app.js:12 | Whoever reads the logs acts as any user: each request's `Authorization` header and session cookie are logged | Log the method, the path and the user's id |
```

A fake that looks fake.

```js
const session = await login({ token: "test-token" });
```

Wrong:

```text
| 2 | security | login.test.js:8 | Hardcoded credential in source code | Move the token to an environment variable |
```

Right: no row.

A secret behind a public prefix.

```js
const payments = new Payments(process.env.NEXT_PUBLIC_PAYMENTS_SECRET_KEY);
```

Right:

```text
| 1 | security | lib/payments.js:3 | Every visitor gets the payments secret key: a `NEXT_PUBLIC_` variable is built into the browser bundle | Read it on the server only, under a name with no prefix, and replace the key if this was ever deployed |
```
