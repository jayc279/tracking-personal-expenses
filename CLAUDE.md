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

The `src/` directory contains a React 18 finance tracker app built with Vite 6.

### Commands

```bash
npm install        # install dependencies
npm run dev        # start dev server (Vite)
npm test           # run test suite once (Vitest)
npm run test:watch # run tests in watch mode
npm run build      # production build
```

### App structure

Single-component app (`App.jsx`) with:
- In-memory transaction state (8 seed records; resets on page refresh by design)
- Summary cards: total income, total expenses, balance (recalculated on every state change)
- Add-transaction form with description, amount, type, category; auto-sets today's date
- Update modal: edit amount in place with confirmation
- Delete modal: remove row with confirmation
- Filterable transaction table by type and category

Amounts are stored as strings and parsed with `parseFloat()` for arithmetic.

### Testing

- Runner: Vitest 4 + jsdom + `@testing-library/react` + `@testing-library/user-event` v14
- Setup file: `src/setupTests.js` (imports `@testing-library/jest-dom`)
- Test file: `src/App.test.jsx` — 19 tests covering Summary Cards, Add, Delete, Update, and Filter; all positive and negative cases
- Use `userEvent.setup()` pattern (not the legacy `userEvent` directly)
- Use `within(element)` to scope queries — "Income" appears in both summary headings and `<option>` elements
