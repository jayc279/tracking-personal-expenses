# Finance Tracker — Cursor Skill

> description: Launch, test, and navigate the Finance Tracker React + FastAPI app

## Launch

Both servers must run concurrently in separate terminals:

```bash
# Terminal 1 — Backend (FastAPI + SQLite)
uv run uvicorn backend.main:app --reload --port 8000

# Terminal 2 — Frontend (Vite dev server)
npm run dev
```

Frontend at **http://localhost:5173** (Vite 6, hot-reload). API at **http://localhost:8000** (uvicorn, auto-reload). Vite proxies all `/api/*` requests to `:8000` — no CORS configuration needed.

### Production (single server)

```bash
npm run build                                    # output → dist/
uv run uvicorn backend.main:app --port 8000      # serves dist/ under /static/; Jinja2 serves /
```

## Test

```bash
npm test          # run once, exit 0 on success
npm run test:watch  # re-run on file save
```

Expected output on a clean run:

```
 Test Files  1 passed (1)
      Tests  23 passed (23)
```

All 23 tests are in `src/App.test.jsx`. There is no separate test for individual components — the suite renders `<App>` end-to-end.

## Build

```bash
npm run build     # production bundle → dist/
```

## Key Entry Points

### Backend

| File | Role |
|------|------|
| `backend/main.py` | FastAPI app — lifespan `init_db`, Jinja2 `GET /`, `/static` mount |
| `backend/database.py` | sqlite3 CRUD — `init_db`, `get_all`, `create`, `update`, `delete` |
| `backend/models.py` | Pydantic models: `TransactionIn`, `TransactionOut` |
| `backend/routers/transactions.py` | REST routes: GET / POST / PUT `/{id}` / DELETE `/{id}` |
| `backend/templates/index.html` | Jinja2 HTML shell — mounts React `#root` (production) |
| `finance.db` | SQLite database file — created on first server start |

### Frontend

| File | Role |
|------|------|
| `src/api.js` | Fetch wrappers — sole reference to `/api/transactions` |
| `src/App.jsx` | Root — shared state, async handlers, derived values |
| `src/components/Summary.jsx` | Summary cards (income, expenses, balance) |
| `src/components/AddTransaction.jsx` | Add form with local state |
| `src/components/Transactions.jsx` | Filters + transaction table |
| `src/components/UpdateTransaction.jsx` | Update modal — local form state for all 4 fields |
| `src/components/ModalActions.jsx` | Shared modal shell (Delete flow; composed inside UpdateTransaction) |
| `src/App.css` | All styles — summary cards, table, modals, layout |
| `vite.config.js` | Vite + Vitest config — jsdom env + `/api` proxy to `:8000` |

## CSS Selector Map

| Selector | Element |
|----------|---------|
| `.summary` | Summary cards wrapper |
| `.summary-card` | Individual card (Income / Expenses / Balance) |
| `.add-transaction` | Add form section |
| `.transactions` | Filters + table section |
| `.filters` | Filter dropdowns row |
| `.modal-overlay` | Modal backdrop |
| `.modal` | Modal dialog |
| `.update-fields` | Container for all 4 update inputs inside the Update modal |
| `.modal-input` | Each field input/select inside `.update-fields` |
| `.modal-confirm` | Confirm button (both modals) |
| `.modal-cancel` | Cancel button (both modals) |
| `.update-btn` | Per-row Update button |
| `.delete-btn` | Per-row Delete button |

## API Quick Reference

```
GET    /api/transactions             list all; optional ?type= ?category= filters
POST   /api/transactions             create; body: TransactionIn; returns TransactionOut (201)
PUT    /api/transactions/{id}        update all fields; returns TransactionOut
DELETE /api/transactions/{id}        delete; returns 204
GET    /                             Jinja2-rendered HTML shell (production)
GET    /static/**                    Vite dist/ output (production)
```

## Seed Data

8 transactions inserted into SQLite on first server start (`init_db` runs on lifespan). If `finance.db` already exists the seed is skipped. Delete `finance.db` to reset to seed data.

| # | Description | Type | Amount | Category |
|---|-------------|------|--------|----------|
| 1 | Salary | income | $5000 | salary |
| 2 | Rent | expense | $1200 | housing |
| 3 | Groceries | expense | $150 | food |
| 4 | Freelance Work | expense | $800 | salary |
| 5 | Electric Bill | expense | $95 | utilities |
| 6 | Dinner Out | expense | $65 | food |
| 7 | Gas | expense | $45 | transport |
| 8 | Netflix | expense | $15 | entertainment |

Initial totals: Income $5000 · Expenses $2370 · Balance $2630
