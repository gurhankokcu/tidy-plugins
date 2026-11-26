# Files

Depth for the files pass of the `security-check` skill: the files an app takes, keeps, reads and serves.

## Method

Checking the files of a change, in order:

1. List where the change takes a file, builds a path, reads or writes a file, unpacks an archive, or serves a file.
2. For each path, find every part that comes from outside: a name, an id, an extension, a folder. Trace each one back.
3. For each file that comes in: its size limit, and whether the limit applies before the bytes are in memory. The name it is stored under. The place it is stored.
4. For each file that goes out: who may fetch it, the content type it is served with, and the origin it is served from.
5. For each file the app opens and parses: which parser, and what the format can ask a parser to do.
6. For each file the app writes: its mode, its folder, and who else can read that folder.
7. For each temp file: how its name is made, and when it is removed.

## Where the line is

1. A path joined with a value from input, with no check after it is resolved: a row. A join does not stop `..`.
2. A check with `startsWith(root)` and no separator at the end: a row. `/data/files-old` starts with `/data/files`.
3. A check on the string, where a link inside the root can point outside: a row when users can put links there, like in an unpacked archive or a cloned repo. The fix checks the real path.
4. A name the client chose: a row when it decides the path or the extension on disk. Kept as a label in the database only, no row.
5. An upload with no size limit before the bytes are read: a row. Some upload libraries set none by themselves.
6. A content type or an extension from the request, trusted later: a row when it picks a parser, or the type the file is served with.
7. Uploads kept under the folder the web server serves, or served from the app's own origin with their own type: a row. An HTML or an SVG file runs script as the site. The fix is another origin, or a download header and `X-Content-Type-Options: nosniff`.
8. A download with no object check on the file, or a public folder with names that are hard to guess: a row.
9. A file name from input in a header, like `Content-Disposition`, and not encoded: a row.
10. An archive unpacked with no check of each entry's path and type, and of the total size: a row. An entry named `../../app/config.js` writes outside, a link entry points outside, and a small archive can fill the disk.
11. A parser run on a user's file with its unsafe side on: XML with outside entities, YAML with the full loader, a native object format, an image or office tool called through a shell. A row. The fix names the safe loader or the switch.
12. A temp file with a name the code made up, in a shared folder: a row. The platform's temp API makes the name and the mode.
13. A file with a secret or private data written with the default mode, or `chmod 777` anywhere: a row.
14. A signed link to stored files: a row when its life is long, when it signs a whole folder, or when the caller picks the key it signs.
15. A bucket or a folder made public for the sake of one file: a row.
16. A log, an export or a backup written where the web server serves: a row.
17. A read of files the job does not need, like the home folder, other projects or chat transcripts: a row.
18. A delete or a move takes the same checks as a read. A path from input in either is a row of its own.
19. A path only the operator sets, in config or on the command line: no row. So is a file picked by name from a fixed list.

## Examples

A check with no separator. `ROOT` is `/srv/uploads`.

```js
const file = path.resolve(ROOT, req.params.name);
if (!file.startsWith(ROOT)) return badRequest(res, "name");
res.sendFile(file);
```

Wrong: no finding, because the path is checked.

Right:

```text
| 1 | security | files.js:9 | Anyone reads the folders next to the root: `../uploads-private/keys.txt` resolves to a path that still starts with `/srv/uploads` | Compare with `ROOT + path.sep` |
```

An upload served from the app's own origin. The upload takes any `image/*` type.

```js
app.use("/avatars", express.static(AVATARS));
```

Right:

```text
| 1 | security | app.js:22 | Any user runs script as the site for whoever opens the link to their avatar: an SVG upload is served from the app's origin as `image/svg+xml` | Refuse SVG at the upload, and serve avatars with a download header and `nosniff` |
```

A path only the operator sets.

```js
const log = fs.createWriteStream(path.join(process.env.LOG_DIR, "app.log"));
```

Wrong:

```text
| 2 | security | logger.js:4 | Path traversal through `LOG_DIR` | Validate the path |
```

Right: no row.
