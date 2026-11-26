# Go

Depth for the `test` skill in a project with a `go.mod`.

## Find the checks

1. A `go.mod` marks one module. `./...` does not cross into another module: with a `go.work` file or several `go.mod` files, run each check in each module.
2. Scripts are targets in a `Makefile`, a `justfile`, a `Taskfile.yml` or a `magefile.go`: `lint`, `vet`, `test`, `check`. Read each target. `make lint` may fix, and `make test` may start containers.
3. `.golangci.yml` or `.golangci.toml` shows that `golangci-lint` is the linter. It must be on the path already. Never fetch it with `go install` or `go run <package>@<version>`.
4. The CI config shows the flags the project tests with: `-race`, `-tags`, `-short`. Use them as they are there.
5. End-to-end tests sit behind a build tag, like `//go:build integration` or `e2e`, or skip themselves under `-short`.

## Run the checks

| Check        | Shown by              | Command             |
| ------------ | --------------------- | ------------------- |
| Format       | Every module          | `gofmt -l .`        |
| Type check   | Every module          | `go vet ./...`      |
| Lint         | `.golangci.*`         | `golangci-lint run` |
| Lint         | `staticcheck.conf`    | `staticcheck ./...` |
| Module files | A CI step that tidies | `go mod tidy -diff` |
| Tests        | Every module          | `go test ./...`     |

1. `gofmt -l` ends with code 0 whatever it finds. A file name in its output is `fail`. No output is `pass`.
2. `go vet` compiles every package and its tests, and writes nothing. It is the type check and a lint in one row.
3. `go test` prints `(cached)` for a package whose inputs did not change. That result holds. It is `pass`.
4. `[no test files]` is not a failure. A module with no test files at all is `not run`.
5. `FAIL <package> [build failed]` means that the tests of that package did not run. It is `fail`.
6. `go mod tidy -diff` needs Go 1.23 or newer. It prints what would change, and writes nothing.
7. Any `go` command downloads a module that is not in the cache. `GOPROXY=off` stops that. A run that then fails for a missing module is `not run`.

## Start the app

1. A program is a `main` package: at the root, or one per folder under `cmd/`. Start it with `go run .` or `go run ./cmd/<name>`.
2. With several programs, the docs or a `run` target of the `Makefile` say which one is the app. With no word on it, stop and say so.
3. The port and the config come from the flags and the env vars that `main` reads. A `.air.toml` shows a dev runner with reload: `air`.
4. `go run` compiles first. The first start takes a while.
5. `go run` starts the program as a child. Stopping `go run` alone leaves the program up. Stop the group.

## Traps

1. `go build ./...` as the type check. When the pattern matches one `main` package, it writes a binary into the folder.
2. `gofmt -l` with code 0 taken as a pass. Read the output.
3. `go fmt`. It rewrites files. `gofmt -l` only lists them.
4. `go mod tidy` with no `-diff`, `go generate`, `go get`. They write to the tree.
5. `golangci-lint run --fix`. It rewrites files.
6. `-race` or `-tags` added because they seem right. Only what the project uses.
7. `-run` or one package path to make the run shorter. `./...`, whole.
