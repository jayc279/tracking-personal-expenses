# Finance Tracker — Cursor Skill

> description: Launch, test, and navigate the Finance Tracker React app

## Launch

```bash
npm run dev
```

Dev server starts at **http://localhost:5173** (Vite 6). Hot-reload is enabled — source changes apply without restart.

## Test

```bash
npm test          # run once, exit 0 on success
npm run test:watch  # re-run on file save
```

Expected output on a clean run:

```
 Test Files  1 passed (1)
      Tests  19 passed (19)
```

All 19 tests are in `src/App.test.jsx`. There is no separate test for individual components — the suite renders `<App>` end-to-end.

## Build

```bash
npm run build     # production bundle → dist/
```

## Key Entry Points

| File | Role |
|------|------|
| `src/App.jsx` | Root — all shared state, derived values, handlers |
| `src/components/Summary.jsx` | Summary cards (income, expenses, balance) |
| `src/components/AddTransaction.jsx` | Add form with local state |
| `src/components/Transactions.jsx` | Filters + transaction table |
| `src/components/ModalActions.jsx` | Shared modal shell (Delete + Update) |
| `src/App.css` | All styles — summary cards, table, modals, layout |
| `vite.config.js` | Vite + Vitest config (jsdom environment) |

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
| `.modal-input` | Amount input inside Update modal |
| `.modal-confirm` | Confirm button (both modals) |
| `.modal-cancel` | Cancel button (both modals) |
| `.update-btn` | Per-row Update button |
| `.delete-btn` | Per-row Delete button |

## Seed Data

8 transactions loaded on mount; resets on page refresh by design.

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
