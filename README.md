# Finance Tracker

## 1. Executive Summary

Finance Tracker is a lightweight, single-page React application for recording and reviewing personal income and expense transactions. It provides real-time balance calculation, full in-line editing of all transaction fields, category-based filtering, and localStorage persistence — with no backend dependency. The UI is built from five focused components (`Summary`, `AddTransaction`, `Transactions`, `UpdateTransaction`, `ModalActions`) composed in a top-level `App` that owns all shared state.

---

## 2. Problem Statement

*(MRD)*

Personal finance management typically requires either heavyweight desktop software or error-prone manual spreadsheets. Neither offers a simple, browser-native workflow where a user can add a transaction, immediately see an updated balance, edit an amount in place, and filter by category — all without a login, server round-trip, or complex setup. This project addresses that gap for users who need a frictionless daily ledger.

---

## 3. Target Users

*(MRD)*

| Persona | Description |
|---------|-------------|
| Personal budget tracker | Individual managing monthly household income and expenses; comfortable with a browser but not necessarily with financial software |
| Student or early-career professional | Tracking a small number of recurring income sources and expense categories for the first time |

No prior financial software experience is assumed. The UI must be self-explanatory.

---

## 4. Market & User Needs

*(MRD)*

| # | Need | Priority |
|---|------|----------|
| N-1 | Record income and expense transactions with a description, amount, type, and category | Must-have |
| N-2 | View a real-time running balance (income − expenses) at all times | Must-have |
| N-3 | Correct any field (description, amount, type, category) of a previously entered transaction without deleting and re-entering the record | Must-have |
| N-4 | Remove an erroneous transaction | Must-have |
| N-5 | Narrow the transaction list by type or category to review spending patterns | Should-have |
| N-6 | Prevent accidental deletion or amount overwrite without confirmation | Should-have |

---

## 5. Success Metrics

*(MRD)*

| Metric | Target |
|--------|--------|
| CRUD operation latency | < 200 ms per action (client-side only, no network) |
| Balance accuracy | Balance always equals Σ income − Σ expenses; verified on every state change |
| Automated test coverage | 100 % of defined test cases pass (`npm test` exits 0) |
| Validation coverage | Every invalid input scenario has a corresponding negative test |

---

## 6. Goals & Non-Goals

*(PRD)*

### Goals
- Single-page application with no backend or build-time data fetching
- Transaction data persisted to `localStorage`; survives page refresh; seeds from 8 hardcoded records only when storage is empty
- Responsive layout readable on mobile viewports
- Confirmation modals for destructive and mutating actions

### Non-Goals
- Server-side or cloud data persistence
- User authentication or multi-user support
- CSV / JSON import or export
- Charts, graphs, or time-series views
- Budget limits or alerts
- Recurring transactions

---

## 7. Functional Requirements

*(PRD)*

| ID | Requirement | Acceptance |
|----|-------------|------------|
| FR-1 | Display **Summary Cards** for Total Income, Total Expenses, and Balance; recalculate automatically after every add, update, or delete | Balance card always shows correct value |
| FR-2 | **Add Transaction** form accepts description (text), amount (number), type (income \| expense), and category; date is set to today automatically; both description and amount are required | New row appears in table; totals update; form resets |
| FR-3 | **Update Transaction** — clicking Update opens a modal pre-filled with all fields (description, amount, type, category); Confirm saves changes to all edited fields; Cancel discards them | All changed fields reflected in table and totals after Confirm; unchanged after Cancel |
| FR-4 | **Delete Transaction** — clicking Delete opens a confirmation modal; Confirm removes the row; Cancel closes the modal with no change | Row count decreases by one and totals update after Confirm; unchanged after Cancel |
| FR-5 | **Filter by Type** — dropdown with options All Types / Income / Expense; filters the transaction table without affecting summary totals | Only matching rows are visible |
| FR-6 | **Filter by Category** — dropdown with All Categories plus the seven named categories; can be combined with the type filter | Only rows matching both active filters are visible |
| FR-7 | **Input Validation** — Add is blocked when description is empty or amount is empty; Update Confirm is blocked when description is empty, amount is empty, or amount is non-numeric | No new row added; modal stays open on invalid confirm |
| FR-8 | **Data Persistence** — transactions are saved to `localStorage` on every state change and restored on page load; seed data is used only when storage is empty | Data survives page refresh; adds/edits/deletes persist across sessions |

---

## 8. Data Model

*(PRD)*

### Transaction

| Field | Type | Notes |
|-------|------|-------|
| `id` | `number` | `Date.now()` at creation; seed data uses integers 1–8 |
| `description` | `string` | Free text; required |
| `amount` | `string` | Stored as string; parsed with `parseFloat()` for arithmetic |
| `type` | `"income" \| "expense"` | Determines sign in balance calculation |
| `category` | `string` (enum) | One of seven values (see below) |
| `date` | `string` | ISO-8601 date (`YYYY-MM-DD`); auto-set on add |

### Categories

`food` · `housing` · `utilities` · `transport` · `entertainment` · `salary` · `other`

### Derived Values (computed, not stored)

```
totalIncome   = Σ parseFloat(amount) for all income transactions
totalExpenses = Σ parseFloat(amount) for all expense transactions
balance       = totalIncome − totalExpenses
```

---

## 9. Technical Architecture

*(PRD)*

```
index.html              Vite entry point; mounts React root at #root
src/
  main.jsx              React 18 createRoot mount
  App.jsx               Root component — shared state, derived values, handlers, localStorage sync
  App.css               Global styles (summary cards, table, modals, layout)
  index.css             CSS resets
  components/
    Summary.jsx         Presentational — 3 summary cards; no state, no callbacks
    AddTransaction.jsx  Add form — owns its own local form state; calls onSubmit(newTransaction)
    Transactions.jsx    Filter dropdowns + transaction table with Update/Delete buttons
    UpdateTransaction.jsx  Update modal — local form state for all 4 fields; calls onConfirm(updated)
    ModalActions.jsx    Shared modal shell (Delete flow); children slot for arbitrary modal content
  setupTests.js         jest-dom matchers + in-memory localStorage mock + beforeEach clear
  App.test.jsx          Full test suite (23 tests)
vite.config.js          Vite + Vitest configuration (jsdom environment)
package.json            Dependencies and npm scripts
```

### Component Hierarchy

```
App
├── Summary                  (totalIncome, totalExpenses, balance)
├── AddTransaction            (categories, onSubmit)
├── Transactions              (transactions, filterType, filterCategory, categories,
│                              onFilterTypeChange, onFilterCategoryChange, onUpdate, onDelete)
├── UpdateTransaction         (transaction, categories, onConfirm, onCancel)   ← Update modal
│   └── ModalActions          (visible, message, onConfirm, onCancel)
│       └── <div.update-fields>
│           ├── <input>       description (text)
│           ├── <input>       amount (number)
│           ├── <select>      type (income | expense)
│           └── <select>      category
└── ModalActions              (visible, message, onConfirm, onCancel)          ← Delete modal
```

### State Ownership

**`App.jsx` (shared / cross-component state):**

| State variable | Purpose |
|----------------|---------|
| `transactions` | Array of all Transaction objects; initialised from `localStorage` (falls back to SEED_TRANSACTIONS); synced to `localStorage` via `useEffect` on every change |
| `filterType`, `filterCategory` | Active filter selections (applied in `App`, passed to `Transactions`) |
| `pendingDeleteId` | Controls delete modal visibility (`null` = hidden) |
| `pendingUpdate` | Controls update modal visibility — holds the full transaction object being edited (`null` = hidden) |

**`AddTransaction.jsx` (local form state):**

| State variable | Purpose |
|----------------|---------|
| `description`, `amount`, `type`, `category` | Controlled inputs; reset to defaults after submit |

**`UpdateTransaction.jsx` (local form state):**

| State variable | Purpose |
|----------------|---------|
| `description`, `amount`, `type`, `category` | Synced from `transaction` prop via `useEffect`; validated on Confirm; passed back as merged object via `onConfirm(updated)` |

**No router, no context, no external state library.** All derived values (`totalIncome`, `totalExpenses`, `balance`, `filteredTransactions`) are recalculated inline on every render in `App.jsx`.

---

## 10. Non-Functional Requirements

*(PRD)*

| Category | Requirement |
|----------|-------------|
| Performance | All state updates synchronous; no async operations; UI responds instantly |
| Compatibility | Modern evergreen browsers (Chrome, Firefox, Edge, Safari) |
| Accessibility | Native HTML form elements and buttons; semantic heading hierarchy |
| Maintainability | Five focused components with clear prop contracts; `App.jsx` owns only shared state and handlers; `UpdateTransaction` owns its own form state; no build-time configuration beyond Vite defaults |
| Test isolation | Each test renders a fresh `<App>`; `localStorage` mock cleared in `beforeEach` so every test starts from SEED_TRANSACTIONS |

---

## 11. Test Strategy

*(V&V)*

- **Runner**: Vitest 4 with jsdom environment
- **Rendering**: `@testing-library/react` — `render`, `screen`, `within`
- **Interaction**: `@testing-library/user-event` v14 — `userEvent.setup()` pattern
- **Custom matchers**: `@testing-library/jest-dom` (`toBeInTheDocument`, `toHaveValue`)
- **Selector scoping**: `within(element)` used throughout to avoid cross-section ambiguity (e.g. "Income" appears in both a summary heading and `<option>` elements)
- **Test file**: `src/App.test.jsx`
- **Setup file**: `src/setupTests.js`

---

## 12. Test Cases

*(V&V)*

| ID | Feature Area | Scenario | Type | Expected Outcome |
|----|-------------|----------|------|-----------------|
| T-01 | Summary Cards | Initial load | Positive | Income $5000, Expenses $2370, Balance $2630 |
| T-02 | Summary Cards | Initial income card | Positive | Displays `$5000` |
| T-03 | Summary Cards | Initial expenses card | Positive | Displays `$2370` |
| T-04 | Add Transaction | Add income entry | Positive | Row count +1; income total increases; balance increases |
| T-05 | Add Transaction | Add expense entry | Positive | Row count +1; expense total increases; balance decreases |
| T-06 | Add Transaction | Form resets after add | Positive | Description and amount fields are empty after submit |
| T-07 | Add Transaction | Missing description | Negative | Row count unchanged; totals unchanged |
| T-08 | Add Transaction | Missing amount | Negative | Row count unchanged; totals unchanged |
| T-09 | Delete Transaction | Confirm delete | Positive | Row count −1; expense total decreases; balance increases |
| T-10 | Delete Transaction | Cancel delete | Negative | Row count unchanged; totals unchanged; modal closed |
| T-11 | Update Transaction | Confirm new amount | Positive | Expense total reflects new amount; balance recalculated; modal closed |
| T-12 | Update Transaction | Confirm new description | Positive | Updated description visible in table row; original description gone |
| T-13 | Update Transaction | Confirm type change (income → expense) | Positive | Income total drops to $0; expense total increases; modal closed |
| T-14 | Update Transaction | Confirm category change | Positive | Updated category visible in table row |
| T-15 | Update Transaction | Cancel update | Negative | Totals unchanged; modal closed |
| T-16 | Update Transaction | Confirm with empty amount | Negative | Modal remains open; totals unchanged |
| T-17 | Update Transaction | Confirm with empty description | Negative | Modal remains open |
| T-18 | Update Transaction | Confirm with non-numeric amount | Negative | Modal remains open; totals unchanged |
| T-19 | Filter | Income only | Positive | Table shows 1 row (Salary) |
| T-20 | Filter | Expense only | Positive | Table shows 7 rows |
| T-21 | Filter | Category = food | Positive | Table shows 2 rows (Groceries, Dinner Out) |
| T-22 | Filter | Income + food (no match) | Negative | Table shows 0 rows |
| T-23 | Filter | Reset to All / All | Positive | Table shows all 8 rows |

---

## 13. Acceptance Criteria

*(V&V)*

Each functional requirement (FR-1 through FR-8) is satisfied when:

1. All positive test cases for that requirement pass.
2. All negative test cases for that requirement pass (invalid input is rejected without side effects).
3. `npm test` exits with code 0 and reports 23/23 tests passed.

No requirement is considered complete if any associated test case fails, even if the feature appears to work visually.

---

## 14. Running Tests

*(V&V)*

```bash
# Install dependencies (first time only)
npm install

# Run all tests once
npm test

# Run in watch mode (re-runs on file save)
npm run test:watch
```

Expected output:

```
 Test Files  1 passed (1)
      Tests  23 passed (23)
```
