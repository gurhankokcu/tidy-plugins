# Web

Depth for the web pass of the `security-check` skill: code that runs in a browser, and the headers, cookies and origins around it.

## Method

Checking the browser side of a change, in order:

1. List where the change puts a value into a page: each template, component and DOM call. Note the place of each value: text, an attribute, a URL, a script, a style.
2. Trace each value back. Could a user have written it, now or at some earlier time?
3. List each request from the browser that changes state. How does the server know that the user meant it?
4. Read each cookie, each header and each origin rule the change sets, loosens or removes.
5. List where the page meets another origin: a redirect, a link built from input, `postMessage`, a frame, a script from another host.
6. List what the change keeps in the browser: in storage, in the URL, and in the state the server sends down for the page to start with.
7. List what the page decides by itself: a hidden button, a route guard, a price. Find the server's check behind each one.

## Where the line is

1. A value in text or in a quoted attribute, through the framework's escaping: no row.
2. A value past the escaping, with `innerHTML`, `dangerouslySetInnerHTML`, `v-html`, `|safe` or a page built as a string: a row when a user could have written the value. With a fixed string, no row.
3. A value as the whole URL of an `href`, a `src` or an `action`: escaping does not stop `javascript:`. A row when a user sets it. The fix lets `https:` and the site's own paths through.
4. A value inside a script block or an event handler attribute: HTML escaping is the wrong escaping there. A row.
5. Markdown or rich text from users turned into HTML: a row, unless a known sanitizer runs on the HTML that comes out.
6. A cookie session, a request that changes state, and no CSRF token, no `SameSite` and no check of `Origin`: a row. "It only takes JSON" is a guard only when the server refuses every other content type.
7. A login sent in a header that a script sets, like `Authorization`: there is no CSRF, and no row for it.
8. A session cookie with no `HttpOnly`, with no `Secure`, or with `SameSite=None`: a row.
9. A session token in `localStorage` or in a URL: a row, low in the table. Every script on the page can read it.
10. `Access-Control-Allow-Origin: *` with no credentials, on answers that are public anyway: no row.
11. The request's own origin sent back with credentials, the origin `null` let in, or an origin checked with `endsWith`, `includes` or a loose regex: a row. `evil-example.com` ends with `example.com`.
12. A redirect or a link to a target from input: a row. `startsWith("/")` lets `//evil.example` through. The fix is a path of the site, parsed and checked, or a target from a fixed list.
13. A `postMessage` listener that does not check `event.origin` against a fixed list, or a message with data in it sent to `"*"`: a row.
14. `target="_blank"` with no `rel`: no row. Browsers add `noopener` by themselves.
15. A security header the change loosens: a row for `unsafe-inline`, `unsafe-eval` or a wildcard added to a policy, and for a frame rule taken off a page with actions.
16. State the server sends down for the page to start with: all of it is public. A row when it holds a secret, another user's data, or a field the page does not show.
17. A check in the browser only, like a hidden button, a route guard or a price worked out in the page: a row when the server does not check the same.
18. A local server or a dev tool's port: any web page the user visits can call `localhost`. A row when it changes state on GET, does not check the `Host` header, or lets any origin in.
19. A file a user uploaded, shown from the app's own origin: its reference file is `files.md`. A script from another host: `dependencies.md`.

## Examples

A value as a whole URL. The template engine escapes both values.

```html
<a href="{{ profile.website }}">{{ profile.name }}</a>
```

Wrong:

```text
| 1 | security | profile.html:8 | XSS: user content is rendered in the page | Sanitize `profile.name` |
```

Right:

```text
| 1 | security | profile.html:8 | Any user runs script as whoever clicks the link on their profile: `website` can be a `javascript:` URL, and escaping does not stop it | Check `website` at the edge as an `https:` URL |
```

A value in a text place, through the engine's escaping.

```html
<p>{{ comment.text }}</p>
```

Wrong:

```text
| 2 | security | comments.html:4 | Stored XSS: a user's comment is rendered | Sanitize comments before they are saved |
```

Right: no row.

An origin checked by its ending.

```js
const allowed = origin.endsWith("example.com");
res.setHeader("Access-Control-Allow-Origin", allowed ? origin : "");
res.setHeader("Access-Control-Allow-Credentials", "true");
```

Right:

```text
| 1 | security | cors.js:5 | Any site reads a logged-in user's data: `https://evil-example.com` passes `endsWith("example.com")` and is let in with credentials | Compare the origin with a fixed list of whole origins |
```
