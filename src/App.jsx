import { useState, useEffect } from 'react'
import './App.css'
import Summary from './components/Summary'
import AddTransaction from './components/AddTransaction'
import Transactions from './components/Transactions'
import ModalActions from './components/ModalActions'
import UpdateTransaction from './components/UpdateTransaction'
import { getTransactions, addTransaction, updateTransaction, deleteTransaction } from './api'

const CATEGORIES = ["food", "housing", "utilities", "transport", "entertainment", "salary", "other"]

function App() {
  const [transactions, setTransactions] = useState([])
  const [filterType, setFilterType] = useState("all")
  const [filterCategory, setFilterCategory] = useState("all")
  const [pendingDeleteId, setPendingDeleteId] = useState(null)
  const [pendingUpdate, setPendingUpdate] = useState(null)

  useEffect(() => {
    getTransactions().then(setTransactions)
  }, [])

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

  const handleDeleteConfirm = async () => {
    await deleteTransaction(pendingDeleteId)
    setTransactions(prev => prev.filter(t => t.id !== pendingDeleteId))
    setPendingDeleteId(null)
  }

  const handleUpdateConfirm = async (updated) => {
    const saved = await updateTransaction(updated)
    setTransactions(prev => prev.map(t => t.id === saved.id ? saved : t))
    setPendingUpdate(null)
  }

  const handleAdd = async (t) => {
    const created = await addTransaction(t)
    setTransactions(prev => [...prev, created])
  }

  return (
    <>
      <div className="app">
        <h1>Finance Tracker</h1>
        <p className="subtitle">Track your income and expenses</p>
        <Summary totalIncome={totalIncome} totalExpenses={totalExpenses} balance={balance} />
        <AddTransaction
          categories={CATEGORIES}
          onSubmit={handleAdd}
        />
        <Transactions
          transactions={filteredTransactions}
          filterType={filterType}
          filterCategory={filterCategory}
          categories={CATEGORIES}
          onFilterTypeChange={setFilterType}
          onFilterCategoryChange={setFilterCategory}
          onUpdate={setPendingUpdate}
          onDelete={setPendingDeleteId}
        />
      </div>
      <UpdateTransaction
        transaction={pendingUpdate}
        categories={CATEGORIES}
        onConfirm={handleUpdateConfirm}
        onCancel={() => setPendingUpdate(null)}
      />
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
