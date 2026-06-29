# AGENTS.md

Tech stack and conventions for this repo.

## Stack

- Python 3.14.
- Flask for the web app, Tailwind via CDN, vanilla JS. No front-end build step.
- UV for environments and dependencies.

## Dependencies

- Add runtime deps with `uv add <pkg>` and dev deps with `uv add --dev <pkg>`.
- Never edit the dependencies in `pyproject.toml` by hand. Let UV manage it.

## Style

- Ruff for formatting and linting. Format before committing.
- Modern type hints only. Use `list[str]`, `dict[str, int]`, `X | None`. Do not import from `typing` for what the builtins or syntax already cover.
- Google-style docstrings on modules, classes, and public functions.
- Optimize for readability. There are no tests for now, but the code should read like it has a reviewer.
