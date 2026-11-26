# Ruby

Depth for the `test` skill in a project with a `Gemfile`.

## Find the checks

1. With a `Gemfile.lock`, every command runs through `bundle exec`, or through a file in `bin/`, like `bin/rails` or `bin/rubocop`.
2. `bundle check` says whether the gems are installed, and installs nothing. When they are not, every check is `not run`. The reason names `bundle install`.
3. Scripts are the tasks of the `Rakefile`. `bundle exec rake -T` lists them. The default task, `rake` with no name, is often every check in one. Run its parts.
4. A `spec` folder and a `.rspec` file show RSpec. A `test` folder shows Minitest.
5. A Rails project with a `bin/ci` file lists its checks in `config/ci.rb`. Read it as a list. Never run `bin/ci` or `bin/setup`: they install gems and prepare the database.
6. End-to-end tests are the ones that drive a browser with Capybara: `test/system` in Minitest, `spec/system` and `spec/features` in RSpec.

## Run the checks

| Check      | Shown by                    | Command                    |
| ---------- | --------------------------- | -------------------------- |
| Lint       | `.rubocop.yml`              | `bundle exec rubocop`      |
| Lint       | `.standard.yml`             | `bundle exec standardrb`   |
| Type check | A `sorbet` folder           | `bundle exec srb tc`       |
| Type check | `Steepfile`                 | `bundle exec steep check`  |
| Type check | A Rails project             | `bin/rails zeitwerk:check` |
| Tests      | A `spec` folder             | `bundle exec rspec`        |
| Tests      | A `test` folder, with Rails | `bin/rails test`           |
| Tests      | A `test` folder, no Rails   | `bundle exec rake test`    |

1. Ruby has no type check of its own. Without Sorbet or Steep, a Rails project has `zeitwerk:check`, which loads every file by its name. Any other project has no row.
2. `bin/rails test` leaves out the system tests. `bin/rails test:system` runs them, and `bin/rails test:all` runs both.
3. RSpec runs the browser tests with the rest. Without `e2e`, leave them out: `bundle exec rspec --exclude-pattern "spec/{system,features}/**/*_spec.rb"`.
4. A run that ends with `0 examples` or `0 runs` is `not run`.
5. The test commands set `RAILS_ENV=test` by themselves. Never set it to another value.
6. Rails brings the schema of the test database up to date by itself. When the test database is not there, the tests are `not run`. The reason names `bin/rails db:test:prepare`.

## Start the app

1. Rails: `bin/dev` when it is there. It starts every process of `Procfile.dev`: the server, and the builders of CSS and JavaScript. Otherwise `bin/rails server`. Both on port 3000.
2. A Rack or Sinatra app: `bundle exec rackup`, on port 9292.
3. It is up at `Listening on`, a line of the Puma server.
4. Never run `db:create`, `db:migrate`, `db:seed`, `db:reset` or `db:test:prepare`. When a page fails with `PendingMigrationError`, it is a question.
5. "A server is already running" comes from the file `tmp/pids/server.pid`. Never delete it. Stop and say so.
6. A change in a background job needs its worker. `Procfile.dev` shows whether one runs.
7. `bin/dev` starts several processes. Stop the group, and ask the port after.

## Traps

1. `rubocop -a`, `rubocop -A` or `standardrb --fix`. They rewrite files.
2. A bare `rubocop` or `rspec` from the path. It is another version than the one in `Gemfile.lock`.
3. `bundle exec rake` as one row. It stops at the first task that fails.
4. `bin/rails test:all`, or a bare `rspec`, without `e2e`. They run the browser tests.
5. `RAILS_ENV=production` on any command.
6. `bin/rails db:test:prepare` to get the tests to run. It writes a database.
7. One file or one line number to make the run shorter. The whole suite runs.
