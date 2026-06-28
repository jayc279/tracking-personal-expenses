# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Package Manager

Python dependencies are managed with `uv`. Use `uv` instead of `pip` for all dependency operations.

```bash
uv sync            # install dependencies
uv add <package>   # add a dependency
uv run <script>    # run a script in the venv
```

## Python Environment

- Python 3.13.11 (pinned in `.python-version`)
- Key dependencies: `mcp[cli]` (Model Context Protocol), `python-dotenv`

## Frontend (src/)

The `src/` directory contains a React 18 finance tracker app (`App.jsx`, `main.jsx`). There is no `package.json` yet — the frontend build toolchain (e.g., Vite) has not been initialized.

### App structure

Single-component app (`App.jsx`) with:
- In-memory transaction state (income/expense records)
- Summary cards (total income, expenses, balance)
- Add-transaction form
- Filterable transaction table by type and category

**Known bug:** `totalIncome` and `totalExpenses` reduce over string `amount` values instead of parsed floats — arithmetic will be wrong until amounts are stored as numbers.
