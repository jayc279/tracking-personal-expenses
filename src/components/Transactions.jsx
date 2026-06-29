function Transactions({
  transactions,
  filterType,
  filterCategory,
  categories,
  onFilterTypeChange,
  onFilterCategoryChange,
  onUpdate,
  onDelete,
}) {
  return (
    <div className="transactions">
      <h2>Transactions</h2>
      <div className="filters">
        <select value={filterType} onChange={(e) => onFilterTypeChange(e.target.value)}>
          <option value="all">All Types</option>
          <option value="income">Income</option>
          <option value="expense">Expense</option>
        </select>
        <select value={filterCategory} onChange={(e) => onFilterCategoryChange(e.target.value)}>
          <option value="all">All Categories</option>
          {categories.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
      </div>
      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>Description</th>
            <th>Category</th>
            <th>Amount</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {transactions.map(t => (
            <tr key={t.id}>
              <td>{t.date}</td>
              <td>{t.description}</td>
              <td>{t.category}</td>
              <td className={t.type === "income" ? "income-amount" : "expense-amount"}>
                {t.type === "income" ? "+" : "-"}${t.amount}
              </td>
              <td className="row-actions">
                <button className="update-btn" onClick={() => onUpdate(t)}>Update</button>
                <button className="delete-btn" onClick={() => onDelete(t.id)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default Transactions
