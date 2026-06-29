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

`App.jsx` owns state and handlers; rendering is delegated to 4 components in `src/components/`:

| Component | File | Responsibility |
|---|---|---|
| `Summary` | `components/Summary.jsx` | 3 summary cards (income, expenses, balance) |
| `AddTransaction` | `components/AddTransaction.jsx` | Add form — manages its own local form state; calls `onSubmit(newTransaction)` |
| `Transactions` | `components/Transactions.jsx` | Filter dropdowns + transaction table with Update/Delete buttons |
| `ModalActions` | `components/ModalActions.jsx` | Shared modal shell used by both Delete and Update flows |

State in `App.jsx`:
- `transactions` — 8 seed records; resets on page refresh by design
- `filterType`, `filterCategory` — passed to `Transactions`; filtering applied in `App`
- `pendingDeleteId`, `pendingUpdate`, `updateAmount` — modal state

Amounts are stored as strings and parsed with `parseFloat()` for arithmetic.

The Update modal passes `<input className="modal-input">` as `children` to `ModalActions` — the modal shell is generic; the input slot is caller-owned.

### Testing

- Runner: Vitest 4 + jsdom + `@testing-library/react` + `@testing-library/user-event` v14
- Setup file: `src/setupTests.js` (imports `@testing-library/jest-dom`)
- Test file: `src/App.test.jsx` — 19 tests covering Summary Cards, Add, Delete, Update, and Filter; all positive and negative cases
- Use `userEvent.setup()` pattern (not the legacy `userEvent` directly)
- Use `within(element)` to scope queries — "Income" appears in both summary headings and `<option>` elements
