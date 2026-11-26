# PHP

Depth for the `test` skill in a project with a `composer.json`.

## Find the checks

1. The checks are in the `scripts` of `composer.json`. `composer run-script --list` lists them. Read each script, and what it calls.
2. Usual names: `lint`, `cs` and `cs-check` for lint. `analyse`, `phpstan` and `psalm` for the type check. `test` for tests. A script named `cs-fix`, `fix` or `format` rewrites files.
3. A tool with a config file and no script is a check too. Its command is in the table below, run from `vendor/bin`.
4. With no `vendor` folder, every check is `not run`. The reason names `composer install`.
5. A Laravel project has an `artisan` file. Its tests are `php artisan test`.
6. The test suites are named in `phpunit.xml`, like `Unit` and `Feature`. One of them runs with `--testsuite <name>`.
7. End-to-end tests are the ones that drive a browser: Laravel Dusk in `tests/Browser`, Panther, Behat, the acceptance suite of Codeception.

## Run the checks

| Check      | Shown by                                        | Command                                        |
| ---------- | ----------------------------------------------- | ---------------------------------------------- |
| Format     | `.php-cs-fixer.php` or `.php-cs-fixer.dist.php` | `vendor/bin/php-cs-fixer fix --dry-run --diff` |
| Format     | `pint.json`, or `laravel/pint` in `require-dev` | `vendor/bin/pint --test`                       |
| Lint       | `phpcs.xml` or `phpcs.xml.dist`                 | `vendor/bin/phpcs`                             |
| Type check | `phpstan.neon` or `phpstan.neon.dist`           | `vendor/bin/phpstan analyse --no-progress`     |
| Type check | `psalm.xml`                                     | `vendor/bin/psalm --no-progress`               |
| Tests      | `phpunit.xml` or `phpunit.xml.dist`             | `vendor/bin/phpunit`                           |
| Tests      | `tests/Pest.php`                                | `vendor/bin/pest`                              |

1. Composer stops a script after 300 seconds. A suite that takes longer is run by its tool, not through `composer`.
2. PHPUnit ends with code 0 when it has only warnings, deprecations or risky tests. That is `pass`, unless `phpunit.xml` sets `failOnWarning` or `failOnRisky`.
3. A run that says `No tests executed!` is `not run`.
4. PHPStan reads its level and its baseline from the config. Never pass a `--level`.
5. In Laravel, a test with `RefreshDatabase` or `DatabaseMigrations` wipes the database it connects to. `phpunit.xml` or a `.env.testing` file must name a test database. When neither does, the tests are `not run`.
6. A cached Laravel config, the file `bootstrap/cache/config.php`, wins over the values of `phpunit.xml`. The tests then run on the app's own database. With that file there, the tests are `not run`. The reason names `php artisan config:clear`.

## Start the app

1. Laravel: `composer run dev` when `composer.json` has the script. It starts the server, the queue worker and Vite. Otherwise `php artisan serve`, on port 8000.
2. `php artisan serve` moves to the next port when 8000 is taken. It is up at `Server running on`. Read the URL from that line.
3. A Laravel page with Vite assets needs `npm run dev` too. Without it, the page fails with "Vite manifest not found".
4. Symfony: `symfony server:start --no-tls` when the `symfony` command is there. Any other project: `php -S 127.0.0.1:8000 -t public`.
5. Never run `migrate`, `migrate:fresh`, `db:seed`, `db:wipe`, `key:generate`, `config:cache` or `optimize`. What is missing is a question.
6. A change in a queued job needs a worker: `php artisan queue:work`. A worker you did not start is a line in the notes.

## Traps

1. `php-cs-fixer fix` with no `--dry-run`, `pint` with no `--test`, `phpcbf`, or `rector process` with no `--dry-run`. They rewrite files.
2. `phpstan analyse --generate-baseline`. It writes every error of today into a file that hides them.
3. `composer test` on a long suite. Composer stops it at 300 seconds, and the result is about Composer.
4. Laravel tests with no test database named. They wipe the app's own data.
5. `php artisan config:clear` to get the tests to run. It changes the app's state.
6. `php artisan dusk` without `e2e`. It drives a browser.
7. `--filter` to make the run shorter. The whole suite runs.
