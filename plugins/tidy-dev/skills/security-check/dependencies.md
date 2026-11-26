# Dependencies

Depth for the dependencies pass of the `security-check` skill: the code a change brings in from outside.

## Method

Checking what a change brings in, in order:

1. List what the change adds, removes or moves to another version: packages in the manifest, entries in the lock file, CI actions, base images, scripts and styles from another host, a download that is run, code copied into the repo.
2. Set the manifest against the lock file. Each change in one has its twin in the other.
3. Look up each new package with the package manager's own read command, like `npm view <name>`. It reads the registry and installs nothing.
4. From the lookup, check four things: the package exists, it is the one the code means (the spelling, the owner, the repo it points to), it is maintained, and the version in the change is its latest.
5. Read each lock file entry the change adds or edits: the host it resolves from, and its integrity hash.
6. For each script that runs at install or build time, in the project's manifest or in CI, read what it runs.
7. For each package the change removes, find what it guarded.

## Where the line is

1. Whether the change needs the dependency at all is `tidy-dev:review`'s point. Here the question is what comes in with it.
2. A package that is not in the registry: a row, first in the table. Whoever registers the name runs their code on every install.
3. A package that is there and is not the one the code means, like a name one letter away from a known one: a row. Name the one that is meant.
4. A package with no release in years, or marked deprecated: a row, low in the table.
5. A version behind the latest with no reason in the plan: a row, low in the table. A move to an older version: a row whose fix asks for the reason.
6. A range like `^` or `~`, with a lock file in git that pins it: no row. With no lock file, or one that git ignores: a row.
7. A dependency from a git URL, a tarball or a path outside the repo: a row, unless it names a full commit hash. Nothing else pins what it holds.
8. A lock file entry that resolves from a host that is not the project's registry, or that lost its integrity hash: a row.
9. A lock file that changed and a manifest that did not: read which packages moved. A row when one moved to another source, or to another major version.
10. An install script that downloads or runs what the build does not need: a row.
11. A CI action of a third party, pinned by a tag or a branch: a row, low in the table. The tag can move. Pinned by a full commit hash: no row.
12. A workflow that runs code from a pull request with the repo's secrets in reach: a row.
13. A base image with `latest` or no tag: a row, low in the table.
14. A script or a style from another host with no fixed version and no integrity hash: a row. The owner of that host runs code in every user's page.
15. A download piped into a shell, or run with no fixed version and no checksum: a row.
16. Code copied into the repo that parses input or does crypto: a row, low in the table. It is a dependency that gets no updates.
17. A removed package that was a guard, like security headers, CSRF protection, a rate limit or a sanitizer: a row, unless the change puts the guard back another way.
18. Known holes in a version: you run no audit. That check is the tester's or the user's.
19. A dev dependency runs on the developer's machine and in CI, with their secrets. The same lines hold, lower in the table.
20. A lookup that could not be done: a row that says so, and what to check by hand.

## Examples

A package that is not there. `npm view acme-jwt-verify` answers that no such package is in the registry.

```diff
+    "acme-jwt-verify": "^2.1.0",
```

Wrong:

```text
| 1 | security | package.json:14 | Make sure dependencies are kept up to date | Run an audit regularly |
```

Right:

```text
| 1 | security | package.json:14 | `acme-jwt-verify` is not in the registry: whoever registers the name runs their code on every install | Use the token library the project already has, at `lib/session.js:2` |
```

A lock file entry that moved to another host. The manifest is not in the change.

```diff
-      "resolved": "https://registry.npmjs.org/left-pad/-/left-pad-1.3.0.tgz",
-      "integrity": "sha512-example",
+      "resolved": "https://files.example.net/left-pad-1.3.0.tgz",
```

Right:

```text
| 1 | security | package-lock.json:812 | `left-pad` now installs from `files.example.net`, with no integrity hash: that host decides what runs on install | Put the registry entry back, with its hash |
```

A range that the lock file pins. `package-lock.json` is in git.

Wrong:

```text
| 3 | security | package.json:9 | `^4.18.2` is not pinned to an exact version | Pin every version |
```

Right: no row.
