const BASE = '/api/transactions'

export const getTransactions = () =>
  fetch(BASE).then(r => r.json())

export const addTransaction = (t) =>
  fetch(BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(t),
  }).then(r => r.json())

export const updateTransaction = (t) =>
  fetch(`${BASE}/${t.id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(t),
  }).then(r => r.json())

export const deleteTransaction = (id) =>
  fetch(`${BASE}/${id}`, { method: 'DELETE' })
