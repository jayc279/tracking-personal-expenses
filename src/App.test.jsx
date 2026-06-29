import { render, screen, within, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from './App'
import { getTransactions, addTransaction, updateTransaction, deleteTransaction } from './api'

vi.mock('./api')

const SEED_INCOME = 5000
const SEED_EXPENSES = 2370
const SEED_BALANCE = SEED_INCOME - SEED_EXPENSES

const SEED_TRANSACTIONS = [
  { id: 1, description: "Salary",        amount: "5000", type: "income",  category: "salary",        date: "2025-01-01" },
  { id: 2, description: "Rent",          amount: "1200", type: "expense", category: "housing",       date: "2025-01-02" },
  { id: 3, description: "Groceries",     amount: "150",  type: "expense", category: "food",          date: "2025-01-03" },
  { id: 4, description: "Freelance Work",amount: "800",  type: "expense", category: "salary",        date: "2025-01-05" },
  { id: 5, description: "Electric Bill", amount: "95",   type: "expense", category: "utilities",     date: "2025-01-06" },
  { id: 6, description: "Dinner Out",    amount: "65",   type: "expense", category: "food",          date: "2025-01-07" },
  { id: 7, description: "Gas",           amount: "45",   type: "expense", category: "transport",     date: "2025-01-08" },
  { id: 8, description: "Netflix",       amount: "15",   type: "expense", category: "entertainment", date: "2025-01-10" },
]

const getSummaryValue = (label) => {
  const summary = document.querySelector('.summary')
  return within(summary).getByText(label).closest('.summary-card').querySelector('p').textContent
}

const getTransactionsSection = () => screen.getByText('Transactions').closest('.transactions')

const getFilterSelects = () => {
  const section = getTransactionsSection()
  return within(section).getAllByRole('combobox')
}

const getAddFormSelects = () => {
  const section = screen.getByText('Add Transaction').closest('.add-transaction')
  return within(section).getAllByRole('combobox')
}

const getRowCount = () => {
  const section = getTransactionsSection()
  return within(section).getAllByRole('row').length - 1
}

beforeEach(async () => {
  getTransactions.mockResolvedValue([...SEED_TRANSACTIONS])
  addTransaction.mockImplementation(t => Promise.resolve({ ...t, id: Date.now() }))
  updateTransaction.mockImplementation(t => Promise.resolve(t))
  deleteTransaction.mockResolvedValue(undefined)

  await act(async () => { render(<App />) })
  await waitFor(() => expect(getRowCount()).toBe(8))
})

// ---------------------------------------------------------------------------
// Summary Cards
// ---------------------------------------------------------------------------
describe('Summary Cards', () => {
  test('shows correct initial income', () => {
    expect(getSummaryValue('Income')).toBe(`$${SEED_INCOME}`)
  })

  test('shows correct initial expenses', () => {
    expect(getSummaryValue('Expenses')).toBe(`$${SEED_EXPENSES}`)
  })

  test('shows correct initial balance', () => {
    expect(getSummaryValue('Balance')).toBe(`$${SEED_BALANCE}`)
  })
})

// ---------------------------------------------------------------------------
// Add Transaction
// ---------------------------------------------------------------------------
describe('Add Transaction', () => {
  test('adds income row and updates totals', async () => {
    const user = userEvent.setup()
    const descInput = screen.getByPlaceholderText('Description')
    const amtInput = screen.getByPlaceholderText('Amount')
    const [typeSelect] = getAddFormSelects()

    await user.clear(descInput)
    await user.type(descInput, 'Bonus')
    await user.clear(amtInput)
    await user.type(amtInput, '1000')
    await user.selectOptions(typeSelect, 'income')
    await user.click(screen.getByRole('button', { name: 'Add' }))

    await waitFor(() => expect(getRowCount()).toBe(9))
    expect(getSummaryValue('Income')).toBe(`$${SEED_INCOME + 1000}`)
    expect(getSummaryValue('Balance')).toBe(`$${SEED_BALANCE + 1000}`)
  })

  test('adds expense row and updates totals', async () => {
    const user = userEvent.setup()
    const descInput = screen.getByPlaceholderText('Description')
    const amtInput = screen.getByPlaceholderText('Amount')
    const [typeSelect] = getAddFormSelects()

    await user.type(descInput, 'Coffee')
    await user.type(amtInput, '5')
    await user.selectOptions(typeSelect, 'expense')
    await user.click(screen.getByRole('button', { name: 'Add' }))

    await waitFor(() => expect(getRowCount()).toBe(9))
    expect(getSummaryValue('Expenses')).toBe(`$${SEED_EXPENSES + 5}`)
    expect(getSummaryValue('Balance')).toBe(`$${SEED_BALANCE - 5}`)
  })

  test('resets form fields after add', async () => {
    const user = userEvent.setup()
    const descInput = screen.getByPlaceholderText('Description')
    const amtInput = screen.getByPlaceholderText('Amount')

    await user.type(descInput, 'Test')
    await user.type(amtInput, '100')
    await user.click(screen.getByRole('button', { name: 'Add' }))

    await waitFor(() => expect(descInput).toHaveValue(''))
    expect(amtInput).toHaveValue(null)
  })

  test('does not add when description is empty', async () => {
    const user = userEvent.setup()
    const amtInput = screen.getByPlaceholderText('Amount')

    await user.type(amtInput, '100')
    await user.click(screen.getByRole('button', { name: 'Add' }))

    expect(getRowCount()).toBe(8)
    expect(getSummaryValue('Income')).toBe(`$${SEED_INCOME}`)
  })

  test('does not add when amount is empty', async () => {
    const user = userEvent.setup()
    const descInput = screen.getByPlaceholderText('Description')

    await user.type(descInput, 'No Amount')
    await user.click(screen.getByRole('button', { name: 'Add' }))

    expect(getRowCount()).toBe(8)
    expect(getSummaryValue('Expenses')).toBe(`$${SEED_EXPENSES}`)
  })
})

// ---------------------------------------------------------------------------
// Delete Transaction
// ---------------------------------------------------------------------------
describe('Delete Transaction', () => {
  test('confirm removes the row and updates totals', async () => {
    const user = userEvent.setup()
    const deleteButtons = screen.getAllByRole('button', { name: 'Delete' })
    await user.click(deleteButtons[1])

    const modal = document.querySelector('.modal')
    expect(modal).toBeInTheDocument()

    await user.click(within(modal).getByRole('button', { name: 'Confirm' }))

    await waitFor(() => expect(getRowCount()).toBe(7))
    expect(getSummaryValue('Expenses')).toBe(`$${SEED_EXPENSES - 1200}`)
    expect(getSummaryValue('Balance')).toBe(`$${SEED_BALANCE + 1200}`)
  })

  test('cancel keeps the row unchanged', async () => {
    const user = userEvent.setup()
    const deleteButtons = screen.getAllByRole('button', { name: 'Delete' })
    await user.click(deleteButtons[0])

    const modal = document.querySelector('.modal')
    await user.click(within(modal).getByRole('button', { name: 'Cancel' }))

    expect(document.querySelector('.modal')).not.toBeInTheDocument()
    expect(getRowCount()).toBe(8)
    expect(getSummaryValue('Expenses')).toBe(`$${SEED_EXPENSES}`)
  })
})

// ---------------------------------------------------------------------------
// Update Transaction
// ---------------------------------------------------------------------------
describe('Update Transaction', () => {
  test('confirm updates amount and recalculates totals', async () => {
    const user = userEvent.setup()
    const updateButtons = screen.getAllByRole('button', { name: 'Update' })
    await user.click(updateButtons[1])

    const modal = document.querySelector('.modal')
    expect(modal).toBeInTheDocument()

    const input = within(modal).getByRole('spinbutton')
    await user.clear(input)
    await user.type(input, '900')
    await user.click(within(modal).getByRole('button', { name: 'Confirm' }))

    await waitFor(() => expect(document.querySelector('.modal')).not.toBeInTheDocument())
    expect(getSummaryValue('Expenses')).toBe(`$${SEED_EXPENSES - 1200 + 900}`)
    expect(getSummaryValue('Balance')).toBe(`$${SEED_BALANCE + 1200 - 900}`)
  })

  test('confirm updates description in the table', async () => {
    const user = userEvent.setup()
    const updateButtons = screen.getAllByRole('button', { name: 'Update' })
    await user.click(updateButtons[1])

    const modal = document.querySelector('.modal')
    const descInput = within(modal).getByPlaceholderText('Description')
    await user.clear(descInput)
    await user.type(descInput, 'Mortgage')
    await user.click(within(modal).getByRole('button', { name: 'Confirm' }))

    await waitFor(() => expect(document.querySelector('.modal')).not.toBeInTheDocument())
    const section = getTransactionsSection()
    expect(within(section).getByText('Mortgage')).toBeInTheDocument()
    expect(within(section).queryByText('Rent')).not.toBeInTheDocument()
  })

  test('confirm updates type and recalculates summary', async () => {
    const user = userEvent.setup()
    const updateButtons = screen.getAllByRole('button', { name: 'Update' })
    await user.click(updateButtons[0])

    const modal = document.querySelector('.modal')
    const typeSelect = within(modal).getAllByRole('combobox')[0]
    await user.selectOptions(typeSelect, 'expense')
    await user.click(within(modal).getByRole('button', { name: 'Confirm' }))

    await waitFor(() => expect(document.querySelector('.modal')).not.toBeInTheDocument())
    expect(getSummaryValue('Income')).toBe('$0')
    expect(getSummaryValue('Expenses')).toBe(`$${SEED_EXPENSES + SEED_INCOME}`)
  })

  test('confirm updates category shown in table', async () => {
    const user = userEvent.setup()
    const updateButtons = screen.getAllByRole('button', { name: 'Update' })
    await user.click(updateButtons[2])

    const modal = document.querySelector('.modal')
    const categorySelect = within(modal).getAllByRole('combobox')[1]
    await user.selectOptions(categorySelect, 'transport')
    await user.click(within(modal).getByRole('button', { name: 'Confirm' }))

    await waitFor(() => expect(document.querySelector('.modal')).not.toBeInTheDocument())
    const section = getTransactionsSection()
    const rows = within(section).getAllByRole('row')
    expect(rows[3].textContent).toContain('transport')
  })

  test('cancel leaves amount unchanged', async () => {
    const user = userEvent.setup()
    const updateButtons = screen.getAllByRole('button', { name: 'Update' })
    await user.click(updateButtons[0])

    const modal = document.querySelector('.modal')
    const input = within(modal).getByRole('spinbutton')
    await user.clear(input)
    await user.type(input, '9999')
    await user.click(within(modal).getByRole('button', { name: 'Cancel' }))

    expect(document.querySelector('.modal')).not.toBeInTheDocument()
    expect(getSummaryValue('Expenses')).toBe(`$${SEED_EXPENSES}`)
  })

  test('empty amount does not close modal', async () => {
    const user = userEvent.setup()
    const updateButtons = screen.getAllByRole('button', { name: 'Update' })
    await user.click(updateButtons[0])

    const modal = document.querySelector('.modal')
    const input = within(modal).getByRole('spinbutton')
    await user.clear(input)
    await user.click(within(modal).getByRole('button', { name: 'Confirm' }))

    expect(document.querySelector('.modal')).toBeInTheDocument()
    expect(getSummaryValue('Expenses')).toBe(`$${SEED_EXPENSES}`)
  })

  test('empty description does not close modal', async () => {
    const user = userEvent.setup()
    const updateButtons = screen.getAllByRole('button', { name: 'Update' })
    await user.click(updateButtons[0])

    const modal = document.querySelector('.modal')
    const descInput = within(modal).getByPlaceholderText('Description')
    await user.clear(descInput)
    await user.click(within(modal).getByRole('button', { name: 'Confirm' }))

    expect(document.querySelector('.modal')).toBeInTheDocument()
  })

  test('non-numeric amount does not close modal', async () => {
    const user = userEvent.setup()
    const updateButtons = screen.getAllByRole('button', { name: 'Update' })
    await user.click(updateButtons[0])

    const modal = document.querySelector('.modal')
    const input = within(modal).getByRole('spinbutton')
    await user.clear(input)
    await user.click(within(modal).getByRole('button', { name: 'Confirm' }))

    expect(document.querySelector('.modal')).toBeInTheDocument()
  })
})

// ---------------------------------------------------------------------------
// Filter Transactions
// ---------------------------------------------------------------------------
describe('Filter Transactions', () => {
  test('filter by income shows only income rows', async () => {
    const user = userEvent.setup()
    const [filterTypeSelect] = getFilterSelects()
    await user.selectOptions(filterTypeSelect, 'income')
    expect(getRowCount()).toBe(1)
  })

  test('filter by expense shows only expense rows', async () => {
    const user = userEvent.setup()
    const [filterTypeSelect] = getFilterSelects()
    await user.selectOptions(filterTypeSelect, 'expense')
    expect(getRowCount()).toBe(7)
  })

  test('filter by food category shows only food rows', async () => {
    const user = userEvent.setup()
    const [, filterCategorySelect] = getFilterSelects()
    await user.selectOptions(filterCategorySelect, 'food')
    expect(getRowCount()).toBe(2)
  })

  test('filter by income + food yields empty table', async () => {
    const user = userEvent.setup()
    const [filterTypeSelect, filterCategorySelect] = getFilterSelects()
    await user.selectOptions(filterTypeSelect, 'income')
    await user.selectOptions(filterCategorySelect, 'food')
    expect(getRowCount()).toBe(0)
  })

  test('resetting filters to all shows all rows', async () => {
    const user = userEvent.setup()
    const [filterTypeSelect, filterCategorySelect] = getFilterSelects()
    await user.selectOptions(filterTypeSelect, 'expense')
    await user.selectOptions(filterCategorySelect, 'food')
    await user.selectOptions(filterTypeSelect, 'all')
    await user.selectOptions(filterCategorySelect, 'all')
    expect(getRowCount()).toBe(8)
  })
})
