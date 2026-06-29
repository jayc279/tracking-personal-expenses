import { useState } from 'react'
import './App.css'
import Summary from './components/Summary'
import AddTransaction from './components/AddTransaction'
import Transactions from './components/Transactions'
import ModalActions from './components/ModalActions'

const CATEGORIES = ["food", "housing", "utilities", "transport", "entertainment", "salary", "other"]

function App() {
  const [transactions, setTransactions] = useState([
    { id: 1, description: "Salary", amount: "5000", type: "income", category: "salary", date: "2025-01-01" },
    { id: 2, description: "Rent", amount: "1200", type: "expense", category: "housing", date: "2025-01-02" },
    { id: 3, description: "Groceries", amount: "150", type: "expense", category: "food", date: "2025-01-03" },
    { id: 4, description: "Freelance Work", amount: "800", type: "expense", category: "salary", date: "2025-01-05" },
    { id: 5, description: "Electric Bill", amount: "95", type: "expense", category: "utilities", date: "2025-01-06" },
    { id: 6, description: "Dinner Out", amount: "65", type: "expense", category: "food", date: "2025-01-07" },
    { id: 7, description: "Gas", amount: "45", type: "expense", category: "transport", date: "2025-01-08" },
    { id: 8, description: "Netflix", amount: "15", type: "expense", category: "entertainment", date: "2025-01-10" },
  ])
  const [filterType, setFilterType] = useState("all")
  const [filterCategory, setFilterCategory] = useState("all")
  const [pendingDeleteId, setPendingDeleteId] = useState(null)
  const [pendingUpdate, setPendingUpdate] = useState(null)
  const [updateAmount, setUpdateAmount] = useState("")

  const totalIncome = transactions
    .filter(t => t.type === "income")
    .reduce((sum, t) => sum + parseFloat(t.amount), 0)
  const totalExpenses = transactions
    .filter(t => t.type === "expense")
    .reduce((sum, t) => sum + parseFloat(t.amount), 0)
  const balance = totalIncome - totalExpenses

  let filteredTransactions = transactions
  if (filterType !== "all") filteredTransactions = filteredTransactions.filter(t => t.type === filterType)
  if (filterCategory !== "all") filteredTransactions = filteredTransactions.filter(t => t.category === filterCategory)

  const handleDeleteConfirm = () => {
    setTransactions(transactions.filter(t => t.id !== pendingDeleteId))
    setPendingDeleteId(null)
  }

  const openUpdate = (t) => {
    setPendingUpdate(t)
    setUpdateAmount(t.amount)
  }

  const handleUpdateConfirm = () => {
    if (!updateAmount || isNaN(parseFloat(updateAmount))) return
    setTransactions(transactions.map(t =>
      t.id === pendingUpdate.id ? { ...t, amount: updateAmount } : t
    ))
    setPendingUpdate(null)
  }

  return (
    <>
      <div className="app">
        <h1>Finance Tracker</h1>
        <p className="subtitle">Track your income and expenses</p>
        <Summary totalIncome={totalIncome} totalExpenses={totalExpenses} balance={balance} />
        <AddTransaction
          categories={CATEGORIES}
          onSubmit={(t) => setTransactions([...transactions, t])}
        />
        <Transactions
          transactions={filteredTransactions}
          filterType={filterType}
          filterCategory={filterCategory}
          categories={CATEGORIES}
          onFilterTypeChange={setFilterType}
          onFilterCategoryChange={setFilterCategory}
          onUpdate={openUpdate}
          onDelete={setPendingDeleteId}
        />
      </div>
      <ModalActions
        visible={pendingUpdate !== null}
        message={pendingUpdate
          ? <><strong>{pendingUpdate.description}</strong> — update amount</>
          : null}
        onConfirm={handleUpdateConfirm}
        onCancel={() => setPendingUpdate(null)}
      >
        <input
          className="modal-input"
          type="number"
          value={updateAmount}
          onChange={(e) => setUpdateAmount(e.target.value)}
          autoFocus
        />
      </ModalActions>
      <ModalActions
        visible={pendingDeleteId !== null}
        message="Delete this transaction?"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setPendingDeleteId(null)}
      />
    </>
  )
}

export default App
