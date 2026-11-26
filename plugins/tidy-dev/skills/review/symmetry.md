# Symmetry

Depth for the `symmetry` pass of the `review` skill. The standard is in `symmetry.md` of the `clean-code` skill.

## Method

Hunting broken symmetry in a change, in order. The fault is mostly in files that are not in the diff.

1. For each thing the change does, say the pattern it belongs to in one line.
2. List the family of that pattern, the way the standard's file lists it: the same file, the same folder, the folders of the same shape, a search for the name, the call or the key, and the other layers that carry the same thing.
3. Set the family against the files of the change. Each member that is not in the change is a suspect. Open it, and decide if it needs the same change.
4. For each new member of a family, open the closest sibling and read the two side by side: the same parts, in the same order, with the same names. Each difference must be a true difference of the job.
5. For each list the change adds to, find the rule of the list. Is the new item where the rule puts it?
6. Read the new pieces of the change against each other. Three new handlers are written one way, not three.
7. Read the diff for lines the job did not need: reformatted, reordered or renamed on the way.

## Where the line is

1. A sibling that needs the change and did not get it: one row for the whole family. The first sibling missed is in `File:line`, the others in the problem.
2. When the missed sibling makes the app do the wrong thing, the kind is `bug`. When it only leaves the code uneven, `symmetry`.
3. A sibling that truly differs: no row.
4. A family that was uneven before the change: no row, unless the change adds a new way to it.
5. A weak pattern of the file, followed: no row.
6. A better pattern brought into a file that has one: a row. Two patterns for one job are worse than one weak one. The fix follows the file.
7. A name in another form than its family, like `getAllTeams` next to `listUsers`: `symmetry`. A name that is untrue, unclear, or a second word for one thing: `rule`.
8. A fault copied from a sibling, like a history comment or a debug log: a row on the new lines only, of the fault's own kind.
9. A list with no rule you can see: no row for the place of the new item.
10. Lines the job did not need, changed on the way: a row. The fix puts them back as they were.
11. A difference the project's formatter decides: no row.
12. A generated file edited by hand: a row. The fix changes the source and regenerates.
13. A family too big for this change: still a row. Its fix says the family needs its own step, and that is the user's decision.
14. Never ask for shared code to make siblings match. Symmetry is the same shape.

## Examples

A sibling in another layer. The change adds `EXPORT_BUCKET` to `config.js`. The example env file and the key table of the README list every other key, and are not in the diff.

Wrong: no finding, because the diff reads fine on its own.

Right:

```text
| 2 | symmetry | config.js:18 | `EXPORT_BUCKET` is read here and is missing from `.env.example` and from the key table in `README.md`, which hold every other key | Add it to both, where the order of each list puts it |
```

A new member of a family. The closest sibling is `listTeams`:

```js
export const listTeams = async (req, res) => {
  const { page } = parsePage(req.query);
  res.json(await teams.list({ page }));
};
```

The change adds:

```js
export async function getAllProjects(request, response) {
  const page = Number(request.query.page) || 1;
  response.json(await projects.list({ page }));
}
```

Right:

```text
| 3 | symmetry | projects.js:4 | Does the job of `listTeams` (`teams.js:8`) with another name form, another function form and its own page parsing | Write it as `listProjects`, in the shape of `listTeams`, with `parsePage` |
```

Shared code asked for in the name of symmetry.

Wrong:

```text
| 4 | symmetry | projects.js:4 | `listTeams` and `listProjects` repeat the same lines | Extract a generic `listHandler(store)` |
```

Right: no row.
