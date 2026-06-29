import sqlite3
import os
from contextlib import contextmanager

DB_PATH = os.environ.get("DB_PATH", "finance.db")

SEED_TRANSACTIONS = [
    {"description": "Salary",        "amount": "5000", "type": "income",  "category": "salary",        "date": "2025-01-01"},
    {"description": "Rent",          "amount": "1200", "type": "expense", "category": "housing",       "date": "2025-01-02"},
    {"description": "Groceries",     "amount": "150",  "type": "expense", "category": "food",          "date": "2025-01-03"},
    {"description": "Freelance Work","amount": "800",  "type": "expense", "category": "salary",        "date": "2025-01-05"},
    {"description": "Electric Bill", "amount": "95",   "type": "expense", "category": "utilities",     "date": "2025-01-06"},
    {"description": "Dinner Out",    "amount": "65",   "type": "expense", "category": "food",          "date": "2025-01-07"},
    {"description": "Gas",           "amount": "45",   "type": "expense", "category": "transport",     "date": "2025-01-08"},
    {"description": "Netflix",       "amount": "15",   "type": "expense", "category": "entertainment", "date": "2025-01-10"},
]


@contextmanager
def get_conn():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    try:
        yield conn
        conn.commit()
    finally:
        conn.close()


def init_db():
    with get_conn() as conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS transactions (
                id          INTEGER PRIMARY KEY AUTOINCREMENT,
                description TEXT    NOT NULL,
                amount      TEXT    NOT NULL,
                type        TEXT    NOT NULL CHECK(type IN ('income','expense')),
                category    TEXT    NOT NULL,
                date        TEXT    NOT NULL
            )
        """)
        if conn.execute("SELECT COUNT(*) FROM transactions").fetchone()[0] == 0:
            conn.executemany(
                "INSERT INTO transactions (description, amount, type, category, date) VALUES (:description, :amount, :type, :category, :date)",
                SEED_TRANSACTIONS,
            )


def get_all(type_filter: str | None = None, category_filter: str | None = None) -> list[dict]:
    with get_conn() as conn:
        query = "SELECT * FROM transactions"
        params: list = []
        conditions: list[str] = []
        if type_filter:
            conditions.append("type = ?")
            params.append(type_filter)
        if category_filter:
            conditions.append("category = ?")
            params.append(category_filter)
        if conditions:
            query += " WHERE " + " AND ".join(conditions)
        rows = conn.execute(query, params).fetchall()
        return [dict(r) for r in rows]


def create(data: dict) -> dict:
    with get_conn() as conn:
        cur = conn.execute(
            "INSERT INTO transactions (description, amount, type, category, date) VALUES (?, ?, ?, ?, ?)",
            (data["description"], data["amount"], data["type"], data["category"], data["date"]),
        )
        row = conn.execute("SELECT * FROM transactions WHERE id = ?", (cur.lastrowid,)).fetchone()
        return dict(row)


def update(transaction_id: int, data: dict) -> dict | None:
    with get_conn() as conn:
        conn.execute(
            "UPDATE transactions SET description=?, amount=?, type=?, category=?, date=? WHERE id=?",
            (data["description"], data["amount"], data["type"], data["category"], data["date"], transaction_id),
        )
        row = conn.execute("SELECT * FROM transactions WHERE id = ?", (transaction_id,)).fetchone()
        return dict(row) if row else None


def delete(transaction_id: int) -> bool:
    with get_conn() as conn:
        cur = conn.execute("DELETE FROM transactions WHERE id = ?", (transaction_id,))
        return cur.rowcount > 0
