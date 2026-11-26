# Tests

Depth for the tests standard of the `clean-code` skill.

## Method

Writing the tests of a step, in order:

1. Read the closest test file. It gives the runner, the folder, the file name, the helpers and the shape. It is the template.
2. List the behaviors the step adds or changes, one line each: given this, when that, then this. Take them from the job, not from reading your own code.
3. For each behavior, list the cases: the normal one, the edge of each rule (the last value that passes and the first that fails), and each case that must be refused.
4. Write each expected value by hand, from the job.
5. Write the tests in the shape of the template. Cases that differ only in data go in one table.
6. For each test, name the line of code that would turn it red if it were broken. Do this by reading, whether or not you may run the tests. No such line means the test is noise: fix it or delete it.
7. Check that each test stands alone: it builds what it needs, it passes in any order, and it uses no real network, clock or randomness.
8. For each old test the change breaks, decide which one is wrong. If the code is wrong, fix the code. If the job changed the behavior, update the test and name it in the report.

## Where the line is

1. Gets a test: behavior a caller or a user can see, like a rule, a branch, a result, an error case or a permission. And each fixed bug: one test that fails without the fix.
2. Gets none: a rename, a move, wiring, config, constants, text, generated code, a getter, the framework, a library.
3. A private helper: test it through the public function that uses it. Do not export it for the test.
4. How many: one per behavior and case. Stop when the next test could not fail for a new reason. Coverage is not the goal.
5. The level: the lowest one that shows the behavior through a public surface. An end-to-end test only when the plan asks for one.
6. A fake: for the network, the clock, randomness and services you do not own. Your own modules stay real. For the database and the file system, do what the project's tests do.
7. An assertion on a call: only when the call is the behavior, like a mail that is sent or a card that is charged. Otherwise assert the result.
8. A snapshot: only if the project uses them, and only for small output that rarely changes. Never the only assertion on logic.
9. An assertion: an exact value. Not "is defined", not "is truthy", not "does not throw" alone. For an error, assert which error.
10. Set-up: a helper that builds input is fine. The values an assertion depends on stay visible in the test.
11. Logic in a test: none past the loop over a case table.
12. A test that fails now and then: report it. Do not wrap it in a retry, raise its timeout or skip it.
13. Time: pass it in or fake it. No sleeping, and no assertion on "now".
14. An access rule: it gets its refusals: no login, the wrong role, another user's object.
15. Test data: fakes that look fake, like `user@example.com` or `test-token`. Never a real secret or a real person's data.
16. Old code with no tests: test what the step changes. Do not fill in tests for the rest, unless the job says so.

## Examples

A test that cannot fail. It fakes the thing under test.

Wrong:

```js
test("priceWith works", () => {
  const priceWith = mock.fn(() => 90);
  assert.equal(priceWith(100, "SAVE10"), 90);
  assert.equal(priceWith.mock.callCount(), 1);
});
```

Right:

```js
test("SAVE10 takes 10% off", () => {
  assert.equal(priceWith(100, "SAVE10"), 90);
});
```

Cases that differ only in data, with the refusals next to the happy path.

```js
const PRICES = [
  { name: "no code keeps the price", code: null, price: 100 },
  { name: "SAVE10 takes 10% off", code: "SAVE10", price: 90 },
  { name: "a code works in lower case", code: "save10", price: 90 },
];
const REFUSED = [
  { name: "an unknown code", code: "SAVE99" },
  { name: "an expired code", code: "SUMMER23" },
];

for (const { name, code, price } of PRICES) {
  test(name, () => assert.equal(priceWith(100, code), price));
}
for (const { name, code } of REFUSED) {
  test(`refuses ${name}`, () => assert.throws(() => priceWith(100, code), InvalidCode));
}
```

Old tests that the change breaks. The job says "SAVE10 now takes 15% off", and two tests go red. The job changed the first behavior and not the second.

Wrong:

```js
test("SAVE10 takes 10% off", () => assert.ok(priceWith(100, "SAVE10") < 100));
test.skip("no code keeps the price", () => assert.equal(priceWith(100, null), 100));
```

Right, with the first test named in the report and the code fixed for the second:

```js
test("SAVE10 takes 15% off", () => assert.equal(priceWith(100, "SAVE10"), 85));
test("no code keeps the price", () => assert.equal(priceWith(100, null), 100));
```
