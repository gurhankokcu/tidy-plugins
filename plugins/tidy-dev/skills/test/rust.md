# Rust

Depth for the `test` skill in a project with a `Cargo.toml`.

## Find the checks

1. A `[workspace]` table in the root `Cargo.toml` shows several crates. `--workspace` covers them all. For one crate it is `-p <crate>`.
2. Scripts are targets in a `Makefile` or a `justfile`, an `[alias]` in `.cargo/config.toml`, or an `xtask` crate run with `cargo xtask <name>`. Read each one.
3. The CI config shows the flags the project checks with: `--all-features`, `--no-default-features`, `-- -D warnings`. Use them as they are there.
4. A `.config/nextest.toml` shows that the tests run with `cargo nextest run`. It leaves out the doc tests: `cargo test --doc` is their own row.
5. End-to-end tests are marked `#[ignore]`, or sit behind a feature. They run with `-- --ignored` or with that feature.

## Run the checks

| Check      | Shown by                            | Command                                           |
| ---------- | ----------------------------------- | ------------------------------------------------- |
| Format     | Every project                       | `cargo fmt --all --check`                         |
| Type check | Every project                       | `cargo check --workspace --all-targets --locked`  |
| Lint       | Clippy in the CI config or the docs | `cargo clippy --workspace --all-targets --locked` |
| Tests      | Every project                       | `cargo test --workspace --locked --no-fail-fast`  |

1. `--locked` goes on every command. Without it, cargo rewrites `Cargo.lock` when it is behind `Cargo.toml`. With it, the command fails. That is `fail`, with its output.
2. Clippy checks all that `cargo check` checks. When Clippy runs, `cargo check` has no row.
3. Clippy ends with code 0 when it has only warnings. That is `pass`, unless the project's command has `-D warnings`.
4. `cargo test` stops after the first test binary that fails, and the others do not run. `--no-fail-fast` runs them all.
5. `cargo test` runs the unit tests, the files under `tests/` and the doc tests, each as its own part of the output. A failure in any part is `fail`.
6. `--offline` stops downloads. A run that then fails for a missing crate is `not run`.
7. `CI=true` stops the `insta` crate from writing `.snap.new` files next to the tests.

## Start the app

1. `cargo run` starts the one binary of a crate. With several, it is `cargo run --bin <name>`, or `cargo run -p <crate>` in a workspace. `default-run` in `Cargo.toml` names the main one.
2. With several binaries and no word on which one is the app, stop and say so.
3. Start the debug build. `--release` only when the docs say so.
4. The first build can take minutes. The output goes from `Compiling` to `Running`. Wait for the port from there.
5. The port and the config come from the env vars and the files that `main` reads.
6. `cargo run` starts the binary as a child. Stop the group.

## Traps

1. `cargo fmt` with no `--check`. It rewrites files.
2. `cargo fix`, or `cargo clippy --fix`. They rewrite files.
3. A command with no `--locked`. A changed `Cargo.lock` is in the tree after the run.
4. `cargo test` with no `--no-fail-fast`, read as the whole result. The binaries after the first failure did not run.
5. `-D warnings` or `--all-features` added because they seem right. Only what the project uses.
6. `cargo update`, `cargo add`, `cargo install`. They install, or write to the tree.
7. A test name as a filter to make the run shorter. The whole suite runs.
