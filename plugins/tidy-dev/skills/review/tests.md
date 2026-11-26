# Tests

Depth for the tests part of the `rule` pass of the `review` skill. The standard is in `tests.md` of the `clean-code` skill.

## Method

Judging the tests of a change, in order. You read the tests and do not run them.

1. List the behaviors the change adds or changes, one line each, from the goal and the diff: each rule, each result, each error case, each fixed bug.
2. For each behavior, find its test in the change. A behavior with none is a finding.
3. For each test in the change, name the line of code that would turn it red if it were broken. A test with no such line is a finding.
4. Read each expected value. Does it come from the goal, written by hand? Or is it built by the same code, the same constant or the same formula as the thing under test?
5. Read what each test fakes. The thing under test stays real.
6. Read each old test the change edited, skipped or deleted. Did the goal change that behavior? If not, the edit is a finding, and the code under it may hold a bug.
7. Read the cases: the edge of each rule, and each case that must be refused.
8. Set each new test file next to the closest old one: the runner, the folder, the name, the helpers, the shape.

## Where the line is

1. A changed behavior with no test: `rule`, on the line of the behavior. The fix names the cases to test.
2. A rename, a move, wiring, config, constants or text with no test: no row. Never ask for one.
3. More tests where the next one could not fail for a new reason: never ask. Coverage is not a finding.
4. A test that cannot fail: `rule`. The problem names what it would still pass with.
5. An expected value copied from the output, or built the way the code builds it: `rule`.
6. An old test weakened, skipped or deleted, for a behavior the goal did not change: `rule`. When the code under it is wrong, that is a `bug` row of its own.
7. A test that asserts what the goal says is wrong: `bug`. The code and the test are wrong together.
8. A test of private parts or of the order of inner calls: `rule`, when a refactor that keeps the behavior would break it.
9. A test on the real network, the real clock, randomness or a sleep: `rule`. Name the line that will fail now and then.
10. A snapshot as the only assertion on logic: `rule`.
11. Cases that differ only in data, written as copies: `rule`. The fix is one table.
12. A test file in another shape than its neighbors: `symmetry`.
13. Old code with no tests, on lines the change did not touch: no row.
14. A project with no test setup: no row per behavior. One line in the real thoughts: the runner is the user's decision.
15. A test that reading shows will fail: `bug`, with the value the code gives and the value the test wants.
16. Never write that the tests pass or fail. You ran nothing.

## Examples

An expected value built the way the code builds it.

```js
test("adds tax", () => {
  assert.equal(withTax(100), 100 * (1 + TAX_RATE));
});
```

Wrong: no finding, because the test is there.

Right:

```text
| 2 | rule | tax.test.js:5 | The expected value is built from `TAX_RATE`, like the code: a wrong rate still passes. Tests standard 4 of `clean-code` | Write the number by hand: `120` for a rate of 20% |
```

An old test weakened. The goal does not change `SAVE10`.

```diff
-  assert.equal(priceWith(100, "SAVE10"), 90);
+  assert.ok(priceWith(100, "SAVE10") < 100);
```

Right:

```text
| 1 | rule | price.test.js:14 | The test of `SAVE10` went from `90` to "less than 100", and the goal does not change that code. Tests standard 8 of `clean-code` | Put `90` back. If it fails, the bug is in `price.js` |
```

A test asked for where none is needed. The change renames `deleteMember` to `removeMember`.

Wrong:

```text
| 3 | rule | members.js:9 | No test covers `removeMember` | Add unit tests |
```

Right: no row.
