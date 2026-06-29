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

`App.jsx` owns state and handlers; rendering is delegated to 5 components in `src/components/`:

| Component | File | Responsibility |
|---|---|---|
| `Summary` | `components/Summary.jsx` | 3 summary cards (income, expenses, balance) |
| `AddTransaction` | `components/AddTransaction.jsx` | Add form — manages its own local form state; calls `onSubmit(newTransaction)` |
| `Transactions` | `components/Transactions.jsx` | Filter dropdowns + transaction table with Update/Delete buttons |
| `UpdateTransaction` | `components/UpdateTransaction.jsx` | Update modal — manages its own local form state for all 4 fields; calls `onConfirm(updatedTransaction)` |
| `ModalActions` | `components/ModalActions.jsx` | Shared modal shell used by the Delete flow and composed inside `UpdateTransaction` |

State in `App.jsx`:
- `transactions` — 8 seed records; persisted to `localStorage` under key `finance-tracker-transactions`; seeds only when storage is empty
- `filterType`, `filterCategory` — passed to `Transactions`; filtering applied in `App`
- `pendingDeleteId`, `pendingUpdate` — modal visibility state (`null` = hidden)

`UpdateTransaction` owns its own local form state (`description`, `amount`, `type`, `category`) synced from the transaction prop via `useEffect`. Validates description non-empty and amount numeric before calling `onConfirm`.

Amounts are stored as strings and parsed with `parseFloat()` for arithmetic.

### Testing

- Runner: Vitest 4 + jsdom + `@testing-library/react` + `@testing-library/user-event` v14
- Setup file: `src/setupTests.js` — imports `@testing-library/jest-dom`; provides in-memory `localStorage` mock via `Object.defineProperty(globalThis, 'localStorage', ...)`; clears store in `beforeEach` so each test gets SEED_TRANSACTIONS
- Test file: `src/App.test.jsx` — 23 tests covering Summary Cards, Add, Delete, Update (8 tests — all 4 editable fields), and Filter; all positive and negative cases
- Use `userEvent.setup()` pattern (not the legacy `userEvent` directly)
- Use `within(element)` to scope queries — "Income" appears in both summary headings and `<option>` elements
- In the Update modal, use `getByPlaceholderText('Description')` for the text input and `getByRole('spinbutton')` for the amount input; `getAllByRole('combobox')` returns `[typeSelect, categorySelect]`
