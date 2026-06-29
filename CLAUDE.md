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
- Key dependencies: `fastapi`, `uvicorn[standard]`, `jinja2`, `python-multipart`, `mcp[cli]`, `python-dotenv`

## Backend (backend/)

FastAPI app served by uvicorn. SQLite database (`finance.db`) in the project root.

### Commands

```bash
uv run uvicorn backend.main:app --reload --port 8000   # dev server with auto-reload
uv run uvicorn backend.main:app --port 8000             # production
```

### Structure

| File | Role |
|------|------|
| `backend/main.py` | FastAPI app — lifespan init, Jinja2 template, `/static` mount, router include |
| `backend/database.py` | SQLite CRUD (`init_db`, `get_all`, `create`, `update`, `delete`); seeds 8 records on first run |
| `backend/models.py` | Pydantic models: `TransactionIn`, `TransactionOut` |
| `backend/routers/transactions.py` | `/api/transactions` — GET, POST, PUT `/{id}`, DELETE `/{id}` |
| `backend/templates/index.html` | Jinja2 HTML shell — mounts React at `#root`; used only in production |

### API

`GET /api/transactions` · `POST /api/transactions` · `PUT /api/transactions/{id}` · `DELETE /api/transactions/{id}`

Amount is stored as `TEXT` in SQLite to match the React `string` convention. The DB file path is configurable via the `DB_PATH` environment variable.

### Dev workflow

Run both servers concurrently:
- **Backend:** `uv run uvicorn backend.main:app --reload --port 8000`
- **Frontend:** `npm run dev` (Vite at `:5173`; proxies `/api/*` to `:8000`)

In production: `npm run build` then `uv run uvicorn backend.main:app --port 8000` (FastAPI serves `dist/` under `/static/`).

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

Data flows through `src/api.js` — thin `fetch` wrappers that are the only files that reference `/api/transactions`. `App.jsx` calls these on mount and after every CRUD action; all handlers are `async`.

State in `App.jsx`:
- `transactions` — loaded from `GET /api/transactions` on mount via `useEffect([], getTransactions)`
- `filterType`, `filterCategory` — applied client-side before passing to `<Transactions>`
- `pendingDeleteId`, `pendingUpdate` — modal visibility state (`null` = hidden)

`UpdateTransaction` owns its own local form state (`description`, `amount`, `type`, `category`) synced from the transaction prop via `useEffect`. Validates description non-empty and amount numeric before calling `onConfirm`.

Amounts are stored as strings and parsed with `parseFloat()` for arithmetic.

### Testing

- Runner: Vitest 4 + jsdom + `@testing-library/react` + `@testing-library/user-event` v14
- Setup file: `src/setupTests.js` — imports `@testing-library/jest-dom` only; no localStorage mock (removed)
- Test file: `src/App.test.jsx` — 23 tests; API layer mocked with `vi.mock('./api')` at the top of the file; `beforeEach` sets `getTransactions.mockResolvedValue([...SEED_TRANSACTIONS])` and stubs `addTransaction`, `updateTransaction`, `deleteTransaction`
- `render(<App />)` is wrapped in `act(async () => {...})` followed by `waitFor(() => expect(getRowCount()).toBe(8))` to let the initial fetch settle before each test runs
- Async state updates (add, delete, update confirm) use `waitFor` on the expected DOM change
- Use `userEvent.setup()` pattern (not the legacy `userEvent` directly)
- Use `within(element)` to scope queries — "Income" appears in both summary headings and `<option>` elements
- In the Update modal: `getByPlaceholderText('Description')` → text input; `getByRole('spinbutton')` → amount; `getAllByRole('combobox')` → `[typeSelect, categorySelect]`
