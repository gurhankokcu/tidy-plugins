# Python

Depth for the `test` skill in a project with a `pyproject.toml`, a `requirements.txt` or `.py` files.

## Find the checks

1. The lock file names the runner: `uv.lock` is `uv run --no-sync`, `poetry.lock` is `poetry run`, `pdm.lock` is `pdm run`, `Pipfile.lock` is `pipenv run`. With none of them and a `.venv` folder, it is `.venv/bin/python -m`. Every command goes through the runner.
2. With no lock file and no `.venv`, there is no environment to run in. Every check is `not run`.
3. The tools show in `pyproject.toml` as `[tool.<name>]` tables, and in `ruff.toml`, `mypy.ini`, `pytest.ini`, `.flake8`, `setup.cfg`, `tox.ini` and `noxfile.py`.
4. Scripts are in `[tool.poe.tasks]`, `[tool.pdm.scripts]`, `[tool.hatch.envs.<name>.scripts]`, `[tool.taskipy.tasks]`, or in a `Makefile`.
5. `.pre-commit-config.yaml` lists the project's linters with their arguments. Read it as a list. Never run `pre-commit`: its hooks fix files in place.
6. `tox` and `nox` build their own environments on a first run, and install into them. With no `.tox` or `.nox` folder, run the commands their config names, through the runner.
7. A Django project has a `manage.py`. Its tests are `python manage.py test`, or `pytest` when the pytest config names `DJANGO_SETTINGS_MODULE`. Its own checks are `python manage.py check` and `python manage.py makemigrations --check --dry-run`, which fails when a model changed with no migration.

## Run the checks

| Check      | Shown by                                                   | Command                 |
| ---------- | ---------------------------------------------------------- | ----------------------- |
| Lint       | `[tool.ruff]` or `ruff.toml`                               | `ruff check --no-fix .` |
| Lint       | `.flake8`, or a `[flake8]` part in `setup.cfg`             | `flake8`                |
| Format     | `[tool.ruff.format]`, or `ruff format` in the CI config    | `ruff format --check .` |
| Format     | `[tool.black]`                                             | `black --check .`       |
| Format     | `[tool.isort]`                                             | `isort --check-only .`  |
| Type check | `[tool.mypy]` or `mypy.ini`                                | `mypy .`                |
| Type check | `[tool.pyright]` or `pyrightconfig.json`                   | `pyright`               |
| Tests      | `[tool.pytest.ini_options]`, `pytest.ini` or `conftest.py` | `pytest`                |
| Tests      | Test files that import `unittest`, and no pytest           | `python -m unittest`    |

1. `ruff check` fixes when the config says `fix = true`. `--no-fix` goes on every run.
2. A type checker with paths in its config runs with no path argument: `mypy`, not `mypy .`.
3. pytest ends with code 0 when all pass, 1 when tests fail, 2 to 4 when it could not run them, and 5 when it found no tests. 1 to 4 is `fail`. 5 is `not run`.
4. Slow and end-to-end tests are split off with markers, like `-m "not e2e"`, in `addopts` or in the CI config. Use the project's own selection.
5. A test command is the one the CI config uses: `pytest` and `python -m pytest` do not load the same paths, and a test can pass with one and fail with the other.
6. Django makes its own test database, named `test_` and the name of the real one. It needs the database server to be up.

## Start the app

1. Django: `python manage.py runserver`, on port 8000. It is up at `Starting development server at`.
2. FastAPI or Starlette: `uvicorn <module>:<app>` or `fastapi dev <file>`, on port 8000. The module is named in the docs, a `Procfile`, a `Dockerfile` or `[project.scripts]`. It is up at `Application startup complete`.
3. Flask: `flask --app <module> run`, on port 5000.
4. On macOS the system can hold port 5000. An answer that is not from the app, like a bare 403, means the port is taken.
5. Never run `migrate`, `flush`, `loaddata` or `createsuperuser`. When `runserver` warns of migrations that are not applied, it is a question.
6. A change in a background task needs its worker too, like Celery. A worker you did not start is a line in the notes.

## Traps

1. A bare `python` or `pytest` from the path. It is another environment, and the result is about other packages.
2. `uv run` with no `--no-sync`. It installs, and it can rewrite `uv.lock`.
3. `pre-commit run` as the lint. It rewrites files.
4. `mypy` or `pyright` in a project with no config for it. Hundreds of errors nobody asked about.
5. pytest with exit code 5 taken as a pass. Nothing ran.
6. `-x`, `--lf` or `-k` to make the run shorter. The whole suite runs.
7. `--snapshot-update` or `--force-regen`. They rewrite the expected results to fit the code.
8. `ruff format` or `black` with no `--check`. They rewrite files.
