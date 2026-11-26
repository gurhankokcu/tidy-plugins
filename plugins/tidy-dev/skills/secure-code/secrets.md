# Secrets

Depth for the secrets standard of the `secure-code` skill.

## Method

When the change needs a secret, in order:

1. Decide if it is one: anything that lets its holder act as someone, or read what they should not. A key, a password, a token, a signing secret, a private key, a connection string with a password.
2. Find how the project loads its secrets, and use the same door.
3. Add the name, never the value, wherever its siblings are: the config loader with its check at start, the example env file, the setup docs.
4. Read it in one place and pass it to the code that needs it.
5. Follow where it goes: no path to a log, an error, a response, a URL or the browser bundle.
6. In tests, use a fake that looks fake, set by the test.
7. In the report, name the variable the user must set. Never a value.

## Where the line is

1. A secret is already in the code or the diff: copy it nowhere, the report included. Name the file and the line. Say it must be replaced at its source, because it is in history. Replacing it is the user's job.
2. `.env`, a key file, anything `.gitignore` lists: not opened. For the name of a variable, read the example file or the config loader.
3. The example env file: names with empty values. `changeme` is not a fake: it gets deployed.
4. A default for local work: none in code. The app names the missing variable and stops. Local values belong in the developer's own env file.
5. A publishable key, a client id, an analytics id: not a secret, and fine in the browser. It still comes from config.
6. A front-end env prefix, like `NEXT_PUBLIC_`, `VITE_`, `REACT_APP_` or `EXPO_PUBLIC_`: all of it is public. When the browser needs something only a secret can get, the call goes through your server.
7. A log: never a secret, a token, a password, a cookie, an auth header, a whole request body, a whole env or a connection string. For a person, the id.
8. An error from a client library: it can hold the URL with its token, or the connection string. Do not pass it on to the caller as it is.
9. A URL: no secret in the query string. It ends up in logs, history and referrers. Use a header or the body.
10. A compare of tokens, signatures or codes: the platform's constant-time compare, like `crypto.timingSafeEqual` or `hmac.compare_digest`.
11. A new token or code: the platform's secure random source, like `crypto.randomBytes` or `secrets.token_urlsafe`, and at least 128 bits for a token. Not a UUID made from the time.
12. A stored password: the project's slow hash: argon2id, scrypt or bcrypt. Checked with the library's own verify.
13. A stored token or API key: a plain SHA-256 hash is enough, because the token is long and random. Shown once in clear.
14. Encryption: the platform's high-level API, with a mode that also checks the data, like AES-GCM, and a fresh nonce each time. Never your own scheme. MD5 and SHA-1 protect nothing.
15. CI and deploy config: a reference to the secret store, never the value, and never echoed in a build log.
16. The scope of a key: the narrowest that does the job. Not the admin key because it works.
17. A call to an outside service or a model: no secret and no personal data goes out, unless that is the job.

## Examples

A fallback secret.

Wrong:

```js
const secret = process.env.SESSION_SECRET || "dev-secret";
```

Right:

```js
const secret = process.env.SESSION_SECRET;
if (!secret) throw new Error("SESSION_SECRET is not set");
```

A log that holds secrets and personal data.

Wrong:

```js
logger.info("login", { headers: req.headers, body: req.body });
```

Right:

```js
logger.info("login", { userId: user.id });
```

A reset token.

Wrong:

```js
const token = Math.random().toString(36).slice(2);
await resets.insert({ userId, token });
```

Right:

```js
const token = randomBytes(32).toString("base64url");
await resets.insert({ userId, hash: sha256(token), expiresAt: inMinutes(30) });
```
