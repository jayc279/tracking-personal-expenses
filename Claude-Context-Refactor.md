# Claude-Context-Refactor.md

Full session context for the Finance Tracker refactor: localStorage → React + FastAPI + SQLite + Jinja2.

---

## 1. Starting Point

Before this refactor the app was a pure React 18 SPA with **no backend**:

- Data lived in `localStorage` (`LS_KEY = 'finance-transactions'`)
- `useState` was initialised with a lazy function that read localStorage
- A `useEffect` synced state back to localStorage on every change
- 8 hardcoded `SEED_TRANSACTIONS` were written to localStorage on first load
- Tests mocked `localStorage` via `Object.defineProperty` in `setupTests.js`
- 5 components: `Summary`, `AddTransaction`, `Transactions`, `UpdateTransaction`, `ModalActions`
- 23 Vitest tests in `src/App.test.jsx`

Git state at refactor start: commit `d72f56f` (docs only, no backend code).

---

## 2. Goal

Replace localStorage with a **FastAPI + SQLite** backend while keeping the React frontend and all 23 tests intact.

Design decisions (user-confirmed in plan mode):
- **Jinja2 role**: HTML shell only — renders `index.html` in production; Vite serves its own in dev
- **Storage**: SQLite via stdlib `sqlite3`; no ORM
- **Frontend**: keep React 18 + all 23 Vitest tests; no routing library, no context, no state manager

---

## 3. Architecture After Refactor

```
Browser
  React 18 SPA
  src/App.jsx  ←→  src/api.js  ←→  fetch('/api/...')
                                          ↕ HTTP
                              FastAPI (uvicorn :8000)
                                GET  /           → Jinja2 index.html (production)
                                GET  /static/**  → Vite dist/ (production)
                                /api/transactions → CRUD routes
                                          ↕
                              backend/database.py (sqlite3)
                                          ↕
                              finance.db (SQLite file)
```

**Dev:** Vite at `:5173` proxies `/api/*` to `:8000`. Two terminals required.  
**Production:** `npm run build` → FastAPI serves `dist/` at `/static/`; Jinja2 serves `GET /`.

---

## 4. New Files Created

### `backend/__init__.py`
Empty — marks `backend/` as a Python package.

### `backend/routers/__init__.py`
Empty — marks `backend/routers/` as a Python package.

### `backend/models.py`

```python
from typing import Literal
from pydantic import BaseModel

class TransactionIn(BaseModel):
    description: str
    amount: str
    type: Literal["income", "expense"]
    category: str
    date: str

class TransactionOut(TransactionIn):
    id: int
```

`amount` is `str` — matches the React string convention; never cast to float in the DB layer.

### `backend/database.py`

Key design points:
- `@contextmanager get_conn()` — opens, commits, closes; `sqlite3.Row` row factory for dict-like access
- `init_db()` — `CREATE TABLE IF NOT EXISTS`; seeds 8 records only when table is empty
- `amount` column is `TEXT NOT NULL` — not `REAL`
- `DB_PATH` configurable via env var; defaults to `finance.db` in CWD

```python
import sqlite3, os
from contextlib import contextmanager

DB_PATH = os.environ.get("DB_PATH", "finance.db")

@contextmanager
def get_conn():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    try:
        yield conn
        conn.commit()
    finally:
        conn.close()

def init_db():
    with get_conn() as conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS transactions (
                id          INTEGER PRIMARY KEY AUTOINCREMENT,
                description TEXT    NOT NULL,
                amount      TEXT    NOT NULL,
                type        TEXT    NOT NULL CHECK(type IN ('income','expense')),
                category    TEXT    NOT NULL,
                date        TEXT    NOT NULL
            )
        """)
        if conn.execute("SELECT COUNT(*) FROM transactions").fetchone()[0] == 0:
            conn.executemany(
                "INSERT INTO transactions (description, amount, type, category, date) "
                "VALUES (:description, :amount, :type, :category, :date)",
                SEED_TRANSACTIONS,
            )

def get_all(type_filter=None, category_filter=None) -> list[dict]: ...
def create(data: dict) -> dict: ...
def update(transaction_id: int, data: dict) -> dict | None: ...
def delete(transaction_id: int) -> bool: ...
```

Full file: [backend/database.py](backend/database.py)

### `backend/routers/transactions.py`

```python
from fastapi import APIRouter, HTTPException, Response, status
from backend.models import TransactionIn, TransactionOut
import backend.database as db

router = APIRouter()

@router.get("", response_model=list[TransactionOut])
def list_transactions(type: str | None = None, category: str | None = None):
    return db.get_all(type_filter=type, category_filter=category)

@router.post("", response_model=TransactionOut, status_code=status.HTTP_201_CREATED)
def create_transaction(body: TransactionIn):
    return db.create(body.model_dump())

@router.put("/{transaction_id}", response_model=TransactionOut)
def update_transaction(transaction_id: int, body: TransactionIn):
    result = db.update(transaction_id, body.model_dump())
    if result is None:
        raise HTTPException(status_code=404, detail="Transaction not found")
    return result

@router.delete("/{transaction_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_transaction(transaction_id: int):
    if not db.delete(transaction_id):
        raise HTTPException(status_code=404, detail="Transaction not found")
    return Response(status_code=status.HTTP_204_NO_CONTENT)
```

Routes mounted at `/api/transactions` by `main.py` → effective paths:
`GET /api/transactions` · `POST /api/transactions` · `PUT /api/transactions/{id}` · `DELETE /api/transactions/{id}`

### `backend/main.py`

```python
import os
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from backend.database import init_db
from backend.routers.transactions import router as transactions_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield

app = FastAPI(lifespan=lifespan)
templates = Jinja2Templates(directory="backend/templates")
app.include_router(transactions_router, prefix="/api/transactions")

dist_dir = os.path.join(os.path.dirname(__file__), "..", "dist")
if os.path.isdir(dist_dir):
    app.mount("/static", StaticFiles(directory=dist_dir), name="static")

@app.get("/")
def root(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})
```

Key decisions:
- `lifespan` context manager (not deprecated `@app.on_event`) calls `init_db()` on startup
- `/static` mount is conditional — `dist/` only exists after `npm run build`; skipping prevents startup errors in dev

### `backend/templates/index.html`

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Finance Tracker</title>
    <link rel="stylesheet" href="/static/assets/index.css" />
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/static/assets/index.js"></script>
  </body>
</html>
```

Only used in production (FastAPI + built React). In dev, Vite serves its own `index.html`.

### `src/api.js`

```js
const BASE = '/api/transactions'

export const getTransactions = () =>
  fetch(BASE).then(r => r.json())

export const addTransaction = (t) =>
  fetch(BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(t),
  }).then(r => r.json())

export const updateTransaction = (t) =>
  fetch(`${BASE}/${t.id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(t),
  }).then(r => r.json())

export const deleteTransaction = (id) =>
  fetch(`${BASE}/${id}`, { method: 'DELETE' })
```

This is the **only** file that references `/api/transactions`. Components never call `fetch` directly.

---

## 5. Modified Files

### `src/App.jsx` — removed localStorage; added async API calls

**Removed:**
- `LS_KEY` constant
- Hardcoded `SEED_TRANSACTIONS`
- Lazy `useState(() => JSON.parse(localStorage.getItem(LS_KEY)) || SEED_TRANSACTIONS)`
- `useEffect` that synced state to localStorage
- `updateAmount` intermediate state

**Added:**
```jsx
import { getTransactions, addTransaction, updateTransaction, deleteTransaction } from './api'

const [transactions, setTransactions] = useState([])

useEffect(() => {
  getTransactions().then(setTransactions)
}, [])

const handleAdd = async (t) => {
  const created = await addTransaction(t)
  setTransactions(prev => [...prev, created])
}

const handleUpdateConfirm = async (updated) => {
  const saved = await updateTransaction(updated)
  setTransactions(prev => prev.map(t => t.id === saved.id ? saved : t))
  setPendingUpdate(null)
}

const handleDeleteConfirm = async () => {
  await deleteTransaction(pendingDeleteId)
  setTransactions(prev => prev.filter(t => t.id !== pendingDeleteId))
  setPendingDeleteId(null)
}
```

All three handlers are `async`. State is updated optimistically after the API call resolves.

### `src/setupTests.js` — localStorage mock removed

Before:
```js
import '@testing-library/jest-dom'
// + Object.defineProperty(globalThis, 'localStorage', ...) — multi-line mock
```

After:
```js
import '@testing-library/jest-dom'
```

The mock is no longer needed because `vi.mock('./api')` intercepts all API calls before they reach `fetch`.

### `src/App.test.jsx` — switched from localStorage mock to `vi.mock('./api')`

**Added at top:**
```js
import { getTransactions, addTransaction, updateTransaction, deleteTransaction } from './api'
vi.mock('./api')
```

**`beforeEach` replaced** — old version pre-populated localStorage; new version:
```js
beforeEach(async () => {
  getTransactions.mockResolvedValue([...SEED_TRANSACTIONS])
  addTransaction.mockImplementation(t => Promise.resolve({ ...t, id: Date.now() }))
  updateTransaction.mockImplementation(t => Promise.resolve(t))
  deleteTransaction.mockResolvedValue(undefined)

  await act(async () => { render(<App />) })
  await waitFor(() => expect(getRowCount()).toBe(8))
})
```

`SEED_TRANSACTIONS` moved from `App.jsx` into the test file itself (same 8 records).

**Async render pattern:** Because `App.jsx` now loads data in `useEffect` (async), tests must wait for state to settle:
1. `await act(async () => { render(<App />) })` — flushes the initial render + queued microtasks
2. `await waitFor(() => expect(getRowCount()).toBe(8))` — waits for the DOM to reflect the resolved mock

All async CRUD actions also use `waitFor` on the expected DOM change:
```js
await user.click(within(modal).getByRole('button', { name: 'Confirm' }))
await waitFor(() => expect(document.querySelector('.modal')).not.toBeInTheDocument())
```

### `vite.config.js` — added API proxy

```js
server: {
  proxy: {
    '/api': 'http://localhost:8000',
  },
},
```

This forwards all `/api/*` requests from the Vite dev server (`:5173`) to FastAPI (`:8000`), eliminating CORS configuration.

### `pyproject.toml` — Python dependencies added via `uv add`

```
fastapi>=0.115
uvicorn[standard]>=0.34
jinja2>=3.1
python-multipart>=0.0.9
```

---

## 6. `UpdateTransaction` Component (pre-existing, but part of this session)

Extracted before the backend refactor (commit `b8c4bc4`). Owns local form state for all 4 fields; syncs from prop via `useEffect`; validates before calling `onConfirm`.

```jsx
// src/components/UpdateTransaction.jsx
import { useState, useEffect } from 'react'
import ModalActions from './ModalActions'

function UpdateTransaction({ transaction, categories, onConfirm, onCancel }) {
  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')
  const [type, setType] = useState('expense')
  const [category, setCategory] = useState('other')

  useEffect(() => {
    if (transaction) {
      setDescription(transaction.description)
      setAmount(transaction.amount)
      setType(transaction.type)
      setCategory(transaction.category)
    }
  }, [transaction])

  const handleConfirm = () => {
    if (!description.trim() || !amount || isNaN(parseFloat(amount))) return
    onConfirm({ ...transaction, description, amount, type, category })
  }

  return (
    <ModalActions visible={transaction !== null} message={...} onConfirm={handleConfirm} onCancel={onCancel}>
      <div className="update-fields">
        <input className="modal-input" type="text"   placeholder="Description" value={description} onChange={...} />
        <input className="modal-input" type="number" placeholder="Amount"      value={amount}      onChange={...} />
        <select className="modal-input" value={type}     onChange={...}>...</select>
        <select className="modal-input" value={category} onChange={...}>...</select>
      </div>
    </ModalActions>
  )
}

export default UpdateTransaction
```

Test selectors inside the Update modal:
- `getByPlaceholderText('Description')` → description text input
- `getByRole('spinbutton')` → amount (`type="number"`)
- `getAllByRole('combobox')[0]` → type select
- `getAllByRole('combobox')[1]` → category select

---

## 7. Problems Encountered and Solutions

### 7.1 PowerShell `@'...'@` here-string with em-dash

**Problem:** A git commit message containing `—` (em-dash) split the PowerShell here-string incorrectly, causing a parse error.

**Fix:** Removed the line containing the em-dash from the commit body.

### 7.2 `Start-Process npm run dev` failed

**Problem:** `npm` on Windows is a `.cmd` script, not a native executable — `Start-Process` cannot launch it directly.

**Fix:**
```powershell
Start-Process "cmd.exe" -ArgumentList "/k npm run dev"
```

### 7.3 Test isolation: async initial render

**Problem:** `App.jsx` now calls `getTransactions()` inside `useEffect` — the component renders empty first, then updates after the promise resolves. Old tests that asserted immediately after `render()` would see 0 rows.

**Fix:** `beforeEach` wraps `render` in `act(async () => {...})` and follows it with `waitFor(() => expect(getRowCount()).toBe(8))`.

### 7.4 Jinja2 `/static` mount crashing in dev

**Problem:** `app.mount("/static", StaticFiles(directory="dist"), ...)` throws a `RuntimeError` if `dist/` doesn't exist (dev mode — `npm run build` not yet run).

**Fix:** Conditional mount — only mount if the directory exists:
```python
dist_dir = os.path.join(os.path.dirname(__file__), "..", "dist")
if os.path.isdir(dist_dir):
    app.mount("/static", StaticFiles(directory=dist_dir), name="static")
```

---

## 8. Test Suite Summary

| Describe | Tests | Feature |
|----------|-------|---------|
| Summary Cards | 3 | Initial totals — income $5000, expenses $2370, balance $2630 |
| Add Transaction | 5 | Add income/expense; form reset; validation (empty desc, empty amount) |
| Delete Transaction | 2 | Confirm (row −1, totals update); Cancel (no change) |
| Update Transaction | 8 | Amount, description, type, category changes; cancel; empty amount/description/non-numeric amount |
| Filter Transactions | 5 | Income-only, expense-only, food category, income+food (0 rows), reset |
| **Total** | **23** | |

Run: `npm test` — no backend required (API fully mocked via `vi.mock('./api')`).

---

## 9. Git Log (refactor commits)

```
740ded5  docs(readme): update for FastAPI + SQLite backend architecture
05e2e2b  docs: update CLAUDE.md and .cursor files for FastAPI + SQLite backend
67a636c  feat(backend): add FastAPI + SQLite backend; wire React frontend to REST API
d72f56f  docs(context): add Claude-Context.md capturing full session history
6ba954e  docs: update all docs to reflect UpdateTransaction component and localStorage
b8c4bc4  feat(update): extract UpdateTransaction component with full field editing
```

The full backend implementation landed in `67a636c`. Docs updated in `05e2e2b` and `740ded5`.

---

## 10. Running the App

### Install

```bash
npm install    # JS dependencies
uv sync        # Python dependencies
```

### Dev (two terminals)

```bash
# Terminal 1 — Backend
uv run uvicorn backend.main:app --reload --port 8000

# Terminal 2 — Frontend
npm run dev
```

- Frontend: http://localhost:5173 (Vite, hot-reload)
- API: http://localhost:8000/api/transactions (uvicorn, auto-reload)
- `finance.db` is created and seeded on first backend start
- Delete `finance.db` to reset to seed data

### Production (single server)

```bash
npm run build
uv run uvicorn backend.main:app --port 8000
```

FastAPI serves the React build at `/static/`; Jinja2 serves the HTML shell at `/`.

### Tests

```bash
npm test
```

Expected: `Test Files 1 passed (1)` · `Tests 23 passed (23)`
