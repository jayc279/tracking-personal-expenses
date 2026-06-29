# Claude-Context.md

> Full session context from `/init` to present — June 2026.
> Use this file to orient any AI assistant picking up work on this repo mid-stream.

---

## 1. Project Origin

The repo began as a single-file React 18 app (`src/App.jsx`) containing all state, logic, and rendering. The `/init` skill was run to analyze the codebase and produce `CLAUDE.md` with accurate build/test commands and architectural notes.

---

## 2. Component Extraction

**Task:** Refactor monolithic `App.jsx` into focused components without breaking the existing test suite.

**Result:** Four components extracted to `src/components/`:

| Component | File | Responsibility |
|---|---|---|
| `Summary` | `Summary.jsx` | Presentational — 3 summary cards; no state |
| `AddTransaction` | `AddTransaction.jsx` | Add form — owns local form state; calls `onSubmit(newTransaction)` |
| `Transactions` | `Transactions.jsx` | Filter dropdowns + transaction table |
| `ModalActions` | `ModalActions.jsx` | Generic modal shell; `children` slot for modal content |

`App.jsx` retained all shared state and handlers. All 19 existing tests passed unchanged because they render `<App>` end-to-end and query by ARIA role/visible text.

**Commit:** `15430e9` — `refactor(src): extract App.jsx into Summary, AddTransaction, Transactions, ModalActions components`

---

## 3. CLAUDE.md Updated

Updated to document the 4-component architecture: component table, state ownership split (App shared vs AddTransaction local), `parseFloat()` rule, and the modal `children` slot pattern.

---

## 4. README.md Created

Written from scratch following an MRD → PRD → V&V methodology:

- **§1** Executive Summary
- **§2** Problem Statement (MRD)
- **§3** Target Users (MRD)
- **§4** Market & User Needs N-1 through N-6 (MRD)
- **§5** Success Metrics (MRD)
- **§6** Goals & Non-Goals (PRD)
- **§7** Functional Requirements FR-1 through FR-7 (PRD)
- **§8** Data Model — Transaction schema + 7 categories + derived values (PRD)
- **§9** Technical Architecture — file tree, component hierarchy diagram, state ownership table (PRD)
- **§10** Non-Functional Requirements (PRD)
- **§11** Test Strategy (V&V)
- **§12** Test Cases T-01 through T-19 (V&V)
- **§13** Acceptance Criteria (V&V)
- **§14** Running Tests (V&V)

**Commit:** `6101076` — `docs(readme): update technical architecture to reflect 4-component hierarchy`

---

## 5. Cursor Configuration Files Created

Four files added to configure Cursor IDE for this project:

### `.cursorignore`
Excludes `node_modules/`, `.venv/`, `dist/`, `coverage/`, `.git/`, `*.lock`, `*.pyc`, `__pycache__/` from Cursor's codebase index.

### `.cursor/rules/finance-tracker.mdc`
MDC format with YAML frontmatter (`alwaysApply: true`). Covers:
- Package managers: `npm` for JS, `uv` for Python — never mix
- Component hierarchy with props
- State ownership
- `parseFloat()` rule for amounts
- Test selector gotcha: `within(document.querySelector('.summary'))` required because `"Income"` matches both a summary `<h3>` and `<option>` elements
- `userEvent.setup()` pattern
- No router / no context / no external state library

### `.cursor/SKILL.md`
Reference for launching and driving the app: dev server, test commands, build, key entry points, CSS selector map, seed data table with initial totals.

### `.cursor/agents/finance-tester.md`
On-demand subagent definition: runs `npm test`, reports pass/fail with describe block, test name, error message, and line number. Read-only — no file modifications or commits.

**Commit:** `f8fe247` — `chore(cursor): add Cursor IDE configuration files`

---

## 6. localStorage Persistence Added

**Problem:** All transaction data was seeded from hardcoded constants and lost on page refresh.

**Solution:**
- `useState` lazy initializer reads from `localStorage` on mount; falls back to `SEED_TRANSACTIONS` when storage is empty or parse fails
- `useEffect([transactions])` writes back on every state change
- Key: `finance-tracker-transactions`

```jsx
const [transactions, setTransactions] = useState(() => {
  try {
    const stored = localStorage.getItem(LS_KEY)
    return stored ? JSON.parse(stored) : SEED_TRANSACTIONS
  } catch {
    return SEED_TRANSACTIONS
  }
})

useEffect(() => {
  localStorage.setItem(LS_KEY, JSON.stringify(transactions))
}, [transactions])
```

**Test fix required:** jsdom in Vitest does not expose `localStorage` on `globalThis`. Fixed by adding an in-memory mock to `src/setupTests.js`:

```js
const localStorageMock = (() => {
  let store = {}
  return {
    getItem: (key) => store[key] ?? null,
    setItem: (key, value) => { store[key] = String(value) },
    removeItem: (key) => { delete store[key] },
    clear: () => { store = {} },
  }
})()

Object.defineProperty(globalThis, 'localStorage', { value: localStorageMock, writable: true })

beforeEach(() => {
  localStorageMock.clear()
})
```

The `beforeEach` clear ensures each test starts with empty storage, so the lazy initializer always falls back to `SEED_TRANSACTIONS` — all 19 assertions remained valid.

**Commit:** `b9e7473` — `feat(storage): persist transactions to localStorage across page refreshes`

---

## 7. UpdateTransaction Component Extracted

**Task:** Replace the single-field (amount-only) update modal with a full-field update flow. Users should be able to edit description, amount, type, and category.

**Baseline confirmed:** `npm test` → 19/19 before any changes.

### New file: `src/components/UpdateTransaction.jsx`

Self-contained modal that:
- Accepts props: `transaction`, `categories`, `onConfirm(updatedTransaction)`, `onCancel`
- Owns local state: `description`, `amount`, `type`, `category`
- Syncs from `transaction` prop via `useEffect([transaction])`
- Validates: description non-empty AND amount numeric before calling `onConfirm`
- Composes `ModalActions` internally; renders 4 inputs inside `.update-fields`

### Changes to `App.jsx`
- Import `UpdateTransaction`
- Removed `updateAmount` state and `openUpdate` handler
- `handleUpdateConfirm(updated)` now receives the full merged object and maps it directly
- `onUpdate` prop on `<Transactions>` changed from `openUpdate` to `setPendingUpdate`
- Replaced inline `<ModalActions>` update block with `<UpdateTransaction>`

### Test expansion: 4 new tests added to `Update Transaction` describe block

| New test | What it covers |
|----------|----------------|
| `confirm updates description in the table` | `getByPlaceholderText('Description')` in modal; checks table row text |
| `confirm updates type and recalculates summary` | `getAllByRole('combobox')[0]` → type select; flips income→expense; checks summary |
| `confirm updates category shown in table` | `getAllByRole('combobox')[1]` → category select; checks row cell text |
| `empty description does not close modal` | Validates description guard in addition to the existing amount guard |

**Test selectors inside the Update modal:**
- `getByPlaceholderText('Description')` — text input
- `getByRole('spinbutton')` — amount number input (unique in modal)
- `getAllByRole('combobox')[0]` — type select
- `getAllByRole('combobox')[1]` — category select

**Result:** `npm test` → 23/23 passed.

**Commit:** `b8c4bc4` — `feat(update): extract UpdateTransaction component with full field editing`

---

## 8. All Documentation Updated

All five documentation files updated to reflect the `UpdateTransaction` addition and localStorage persistence:

| File | Key changes |
|------|-------------|
| `CLAUDE.md` | 5-component table; `updateAmount` removed from state list; test count 19→23; modal query selector patterns documented |
| `README.md` | Executive summary; N-3 broadened; localStorage added to Goals; Non-Goals changed to "no server-side persistence"; FR-3 expanded to all fields; FR-8 added; file tree updated; hierarchy diagram updated; state ownership table updated; T-12–T-14, T-17 added; Filters renumbered T-19–T-23; acceptance criteria and expected output updated to 23 |
| `.cursor/rules/finance-tracker.mdc` | Updated hierarchy, state ownership (localStorage pattern), testing rules (modal selectors), constraints |
| `.cursor/SKILL.md` | UpdateTransaction in entry points; `.update-fields` in selector map; seed data persistence note updated; test count 23 |
| `.cursor/agents/finance-tester.md` | Success condition updated to 23; Update Transaction coverage row expanded to 8 tests |

**Commit:** `6ba954e` — `docs: update all docs to reflect UpdateTransaction component and localStorage`

---

## 9. Current State

### Component hierarchy

```
App
├── Summary                  (totalIncome, totalExpenses, balance)
├── AddTransaction            (categories, onSubmit)
├── Transactions              (transactions, filterType, filterCategory, categories,
│                              onFilterTypeChange, onFilterCategoryChange, onUpdate, onDelete)
├── UpdateTransaction         (transaction, categories, onConfirm, onCancel)
│   └── ModalActions
│       └── .update-fields
│           ├── <input type="text">    description
│           ├── <input type="number">  amount
│           ├── <select>               type
│           └── <select>               category
└── ModalActions              (visible, message, onConfirm, onCancel)  ← Delete only
```

### State in `App.jsx`

| Variable | Purpose |
|----------|---------|
| `transactions` | All records; init from localStorage, synced on change |
| `filterType`, `filterCategory` | Active filter values |
| `pendingDeleteId` | Delete modal visibility (`null` = hidden) |
| `pendingUpdate` | Update modal visibility — holds full transaction object (`null` = hidden) |

### Local state in components

| Component | State |
|-----------|-------|
| `AddTransaction` | `description`, `amount`, `type`, `category` — resets after submit |
| `UpdateTransaction` | `description`, `amount`, `type`, `category` — synced from prop via `useEffect` |

### Test suite

```
 Test Files  1 passed (1)
      Tests  23 passed (23)
```

| Describe block | Tests |
|----------------|-------|
| Summary Cards | 3 |
| Add Transaction | 5 |
| Delete Transaction | 2 |
| Update Transaction | 8 |
| Filter Transactions | 5 |

### Git log (chronological)

```
6ba954e  docs: update all docs to reflect UpdateTransaction component and localStorage
b8c4bc4  feat(update): extract UpdateTransaction component with full field editing
b9e7473  feat(storage): persist transactions to localStorage across page refreshes
f8fe247  chore(cursor): add Cursor IDE configuration files
6101076  docs(readme): update technical architecture to reflect 4-component hierarchy
15430e9  refactor(src): extract App.jsx into Summary, AddTransaction, Transactions, ModalActions components
```

### Commands

```bash
npm install        # first time only
npm run dev        # dev server at http://localhost:5173
npm test           # run suite once (exit 0 = all 23 pass)
npm run test:watch # re-run on file save
npm run build      # production bundle → dist/
```

---

## 10. Known Constraints

- No router, no React context, no external state library
- No server-side persistence — localStorage only; data is device-local
- `amount` stored as `string`; always parse with `parseFloat()` for arithmetic
- `totalIncome`, `totalExpenses`, `balance` are derived on every render — never store in state
- jsdom does not expose `localStorage`; the mock in `src/setupTests.js` is required for tests to pass
- `beforeEach` clears the localStorage mock so each test gets clean `SEED_TRANSACTIONS`
