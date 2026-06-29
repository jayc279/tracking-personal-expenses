function Summary({ totalIncome, totalExpenses, balance }) {
  return (
    <div className="summary">
      <div className="summary-card">
        <h3>Income</h3>
        <p className="income-amount">${totalIncome}</p>
      </div>
      <div className="summary-card">
        <h3>Expenses</h3>
        <p className="expense-amount">${totalExpenses}</p>
      </div>
      <div className="summary-card">
        <h3>Balance</h3>
        <p className="balance-amount">${balance}</p>
      </div>
    </div>
  )
}

export default Summary
