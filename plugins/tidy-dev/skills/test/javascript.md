# JavaScript and TypeScript

Depth for the `test` skill in a project with a `package.json` or a `deno.json`.

## Find the checks

1. The lock file names the package manager: `package-lock.json` is npm, `pnpm-lock.yaml` is pnpm, `yarn.lock` is yarn, `bun.lock` or `bun.lockb` is bun. A `packageManager` field in `package.json` wins. Use that one for every command.
2. The checks are in the `scripts` of `package.json`. Read each script, and what it calls.
3. Usual names: `lint`, `format:check` and `prettier:check` for lint. `typecheck`, `type-check`, `check-types` and `tsc` for the type check. `test` and `test:unit` for tests. `e2e`, `test:e2e`, `cypress` and `playwright` for end-to-end.
4. A script that joins others, like `check`, `ci` or `validate`, runs as its parts.
5. Workspaces show in the `workspaces` field, in `pnpm-workspace.yaml`, `turbo.json` or `nx.json`. A root script that fans out covers every package. With none, `npm run <script> --workspaces --if-present` or `pnpm -r run <script>` does. For one package it is `npm run <script> -w <package>` or `pnpm --filter <package> run <script>`.
6. A tool with a config file and no script is a check too, when the tool is in `devDependencies`. Its command is in the table below.
7. With no `node_modules`, every check is `not run`. The reason names the install command of the package manager.
8. A project with a `deno.json` and no `package.json` keeps its scripts under `tasks`, run with `deno task <name>`. Its built-in checks are `deno lint`, `deno fmt --check` and `deno test`.

## Run the checks

| Check           | Shown by                                              | Command                               |
| --------------- | ----------------------------------------------------- | ------------------------------------- |
| Lint            | `eslint.config.*` or `.eslintrc*`                     | `npx --no-install eslint .`           |
| Lint and format | `biome.json` or `biome.jsonc`                         | `npx --no-install biome ci .`         |
| Format          | `.prettierrc*`, or a `prettier` key in `package.json` | `npx --no-install prettier --check .` |
| Type check      | `tsconfig.json`                                       | `npx --no-install tsc --noEmit`       |
| Tests           | `vitest.config.*`, or a `test` key in `vite.config.*` | `npx --no-install vitest run`         |
| Tests           | `jest.config.*`, or a `jest` key in `package.json`    | `npx --no-install jest`               |
| End-to-end      | `playwright.config.*`                                 | `npx --no-install playwright test`    |
| End-to-end      | `cypress.config.*`                                    | `npx --no-install cypress run`        |

1. `npx --no-install` runs only what is installed. With pnpm it is `pnpm exec`.
2. Flags for the tool behind a script go after `--`: `npm test -- --watchAll=false`.
3. `CI=true` stops the watch mode of Vitest and of `react-scripts test`. It also stops Jest and Vitest from writing a snapshot file for a new test.
4. ESLint ends with code 0 when it has only warnings. That is `pass`, unless the project's script sets `--max-warnings`.
5. A root `tsconfig.json` with `references` and an empty `files` list checks nothing by itself. Run `tsc --noEmit -p <path>` for each config it points to.
6. `tsc` does not read `.vue`, `.svelte` or `.astro` files. With `vue-tsc`, `svelte-check` or `astro` in the dependencies, the type check is `vue-tsc --noEmit`, `svelte-check` or `astro check`.
7. Playwright starts the app by itself, from `webServer` in its config. `PLAYWRIGHT_HTML_OPEN=never` keeps it from serving its report after a failure and waiting there. A run that asks for `playwright install` is `not run`.

## Start the app

1. The script is `dev`. `start` often serves a build that is old or not there.
2. Read the URL from the output. Usual ports: Vite 5173, Next.js 3000, Angular 4200, Astro 4321.
3. Vite and Next.js move to the next port when theirs is taken, and print the new one. Other servers ask a question and wait.
4. A dev server builds a page on its first request. A slow first answer is normal.
5. An app with a front end and an API may be two processes. The `dev` script, a `Procfile` or the docs say so.
6. In a project with several packages, the script is the one of the app's own package.
7. The script starts `node` as a child. Stop the group, not only the package manager.

## Traps

1. `npm test` in watch mode. It never ends.
2. `tsc` with no `--noEmit`, when the config does not set it: it writes `.js` files next to the source.
3. `npx <tool>` with no `--no-install`: it downloads a tool the project does not have, and the result means nothing.
4. A `lint` script with `--fix`, or a `format` script with `--write`. Run `eslint` with no `--fix`, and `prettier --check`.
5. `next build` as the type check. It writes `.next`, which a running dev server reads.
6. `--passWithNoTests`, or a run that says `No tests found`. It is `not run`, whatever the exit code.
7. `cypress open`, `playwright test --ui`, `vitest --ui`. They open a window and wait.
8. `-u` or `--update` on a test run. It rewrites the snapshots to fit the code.
