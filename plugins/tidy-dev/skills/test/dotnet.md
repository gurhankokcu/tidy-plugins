# .NET

Depth for the `test` skill in a project with a `.sln`, a `.csproj` or a `.fsproj` file.

## Find the checks

1. A `.sln` or `.slnx` file at the root joins the projects. Run every command on it. With none, run on each project file.
2. A `global.json` pins the SDK. When that SDK is not installed, every check is `not run`.
3. The lint is part of the build: the analyzers and their rules, set in `.editorconfig`, `.globalconfig` and `Directory.Build.props`. The build is the type check and the lint in one row.
4. The format check counts when the project has an `.editorconfig`, or the CI config runs `dotnet format`.
5. A test project is one that references `Microsoft.NET.Test.Sdk`. Its name mostly ends with `.Tests`.
6. End-to-end tests are their own projects, with names like `*.IntegrationTests` or `*.E2E`, or with a reference to Playwright or Selenium.
7. Scripts are a `build.sh`, a `build.ps1`, a `build.cake` or a `Makefile`. Read each one. Most of them also restore, pack or publish.

## Run the checks

| Check               | Shown by        | Command                                          |
| ------------------- | --------------- | ------------------------------------------------ |
| Format              | `.editorconfig` | `dotnet format --verify-no-changes --no-restore` |
| Type check and lint | Every project   | `dotnet build --no-restore`                      |
| Tests               | A test project  | `dotnet test --no-build`                         |

1. `--no-restore` stops the download of packages. A build that then fails for a missing `project.assets.json` is `not run`. The reason names `dotnet restore`.
2. The build ends with code 0 when it has only warnings. That is `pass`, unless the project sets `TreatWarningsAsErrors`.
3. `dotnet test --no-build` runs what the build made. With a failed build, the tests are `not run`.
4. `dotnet test` on a solution runs every test project, the end-to-end ones too. Without `e2e`, run it once per unit test project: `dotnet test <project> --no-build`.
5. A build fails with "being used by another process" while the app runs from the same output folder. That is `not run`. The reason says that the app is running.
6. The build writes `bin` and `obj` folders. They are build output, and git leaves them out.

## Start the app

1. The web project is the one whose project file starts with `Sdk="Microsoft.NET.Sdk.Web"`. Start it with `dotnet run --project <path> --no-build`, after a build.
2. The URLs are in `Properties/launchSettings.json` of that project, under `applicationUrl`. `dotnet run` takes the first profile. Another one is `--launch-profile <name>`.
3. It is up at `Now listening on:`. Read the URL from that line.
4. Try the `http` URL. The `https` one needs the dev certificate. Never run `dotnet dev-certs https --trust`: it changes what the machine trusts.
5. Never run `dotnet ef database update`. When the app fails for a migration that is not applied, it is a question.
6. `dotnet run` starts the app as a child. Stop the group.

## Traps

1. `dotnet format` with no `--verify-no-changes`. It rewrites files.
2. `dotnet build` or `dotnet test` with no `--no-restore` or `--no-build`. They download packages.
3. `dotnet test` on the solution without `e2e`. It runs the end-to-end projects too.
4. `-warnaserror` added because it seems right. Only what the project uses.
5. `dotnet watch` to start the app. It asks questions and restarts by itself.
6. `dotnet clean` in front of a check to be sure. It deletes the output a running app uses.
7. `--filter` to make the run shorter. The whole suite runs.
