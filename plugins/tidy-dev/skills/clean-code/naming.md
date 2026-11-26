# Naming

Depth for the naming standard of the `clean-code` skill.

## Method

Naming a new thing, in order:

1. Search for the thing first. If the codebase has a word for it, that word is the name.
2. If it joins a family, take the family's form. Next to `listUsers`, the new one is `listTeams`, not `getAllTeams` or `fetchTeamList`.
3. Otherwise, say what it is or does in one plain sentence. The name is the main words of that sentence.
4. Cut every word the place already gives: the module, the class, the type.
5. Read the name alone at a place where it is used, without the code behind it. Can it be read another way? Does it promise more or less than the code does?
6. Check the pair. If the thing has an opposite or a partner, the two names match.

## Where the line is

1. Short or clear: the wider the reach, the fuller the name. `i` in a three-line loop is clear. `d` for a deadline used across a file is not.
2. An abbreviation: only the ones the project already uses, like `id`, `url` or `db`. If the file says `config`, do not write `cfg`.
3. The type in the name, like `userList`, `nameString` or `IUser`: no, unless the project does it everywhere. Then symmetry wins.
4. A yes-or-no value: it reads as a fact, in the project's form, like `isOpen` or `hasAccess`. Never a negative: `isReady`, not `isNotReady`.
5. A number with a unit: the unit is in the name when the type does not carry it, like `timeoutMs` or `maxBytes`.
6. A big word, like `Manager`, `Service`, `Handler`, `Processor`, `Helper`, `Data` or `Info`: only where the project's own pattern uses it. Otherwise name the thing by what it holds or does.
7. A verb: it is true. `get` reads and does not write. `check` answers and does not fix. `validate` refuses and does not change the value.
8. Two versions side by side: name both by what differs, like `parseStrict` and `parseLoose`. Never `parse` and `parseNew`.
9. A wrong name in old code: report it in one line. Rename it only when the job changed what the thing does, and then everywhere, in the same step.
10. A file or a folder: the form of its neighbors decides the case, singular or plural, and the suffix.
11. A test name: the behavior and the case, in the project's form, like "blocks git add" or "returns 404 for another user's order". Not "works", and not the function's name alone.

## Examples

One name per thing.

Wrong:

```js
const account = await loadMember(session.userId);
return { customer: account };
```

Right:

```js
const user = await loadUser(session.userId);
return { user };
```

A name that is true to the job.

Wrong:

```js
function getCart(user) {
  return carts.find(user.id) ?? carts.create(user.id);
}
```

Right:

```js
function findOrCreateCart(user) {
  return carts.find(user.id) ?? carts.create(user.id);
}
```

Pairs that match, and names with no history.

Wrong:

```js
export { addMember, deleteMember, sendInviteV2, newParseDate };
```

Right:

```js
export { addMember, removeMember, sendInvite, parseDate };
```
