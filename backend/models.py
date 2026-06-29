from typing import Literal
from pydantic import BaseModel


class TransactionIn(BaseModel):
    description: str
    amount: str
    type: Literal["income", "expense"]
    category: str
    date: str


class TransactionOut(TransactionIn):
    id: int
