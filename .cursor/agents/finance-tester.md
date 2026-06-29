# finance-tester

> Subagent: Run the Vitest test suite and report results

## Description

Runs `npm test` against `src/App.test.jsx` and returns a structured pass/fail report. Invoke on demand — not automatically on file save.

## Trigger

Invoke manually in Cursor chat:

```
@finance-tester run tests
```

## Command

```bash
cd d:\vscode-work\temp
npm test
```

## Success Condition

Exit code `0` and stdout contains:

```
 Test Files  1 passed (1)
      Tests  19 passed (19)
```

Report: **All 19 tests passed.**

## Failure Handling

If any test fails, capture and surface:

1. **Describe block** — the outer `describe('...')` name
2. **Test name** — the `it('...')` / `test('...')` label
3. **Error message** — the assertion failure (e.g. `Expected: "$1170" / Received: "$2370"`)
4. **Line number** in `src/App.test.jsx`

Report each failure as a separate bullet. Do not run the tests a second time.

## Scope

- Test file: `src/App.test.jsx` only
- Do not run Python tests, linters, or build steps
- Do not run `npm run test:watch` (non-terminating)

## Constraints

- **Read-only**: do not modify source files, configs, or test files
- Do not commit, stage, or push any changes
- Do not install packages or modify `package.json`

## Test Coverage Reference

| Describe block | # Tests | Feature |
|----------------|---------|---------|
| Summary Cards | 3 | Initial totals display |
| Add Transaction | 5 | Add income/expense, validation, form reset |
| Delete Transaction | 2 | Confirm and cancel delete modal |
| Update Transaction | 4 | Confirm, cancel, empty amount, non-numeric |
| Filter Transactions | 5 | Type filter, category filter, combined, reset |
