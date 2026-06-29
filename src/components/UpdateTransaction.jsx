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
    <ModalActions
      visible={transaction !== null}
      message={transaction ? <><strong>{transaction.description}</strong> — update transaction</> : null}
      onConfirm={handleConfirm}
      onCancel={onCancel}
    >
      <div className="update-fields">
        <input
          className="modal-input"
          type="text"
          placeholder="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <input
          className="modal-input"
          type="number"
          placeholder="Amount"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
        <select
          className="modal-input"
          value={type}
          onChange={(e) => setType(e.target.value)}
        >
          <option value="income">Income</option>
          <option value="expense">Expense</option>
        </select>
        <select
          className="modal-input"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          {categories.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
      </div>
    </ModalActions>
  )
}

export default UpdateTransaction
