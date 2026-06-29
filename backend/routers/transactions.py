from fastapi import APIRouter, HTTPException, Response, status
from backend.models import TransactionIn, TransactionOut
import backend.database as db

router = APIRouter()


@router.get("", response_model=list[TransactionOut])
def list_transactions(type: str | None = None, category: str | None = None):
    return db.get_all(type_filter=type, category_filter=category)


@router.post("", response_model=TransactionOut, status_code=status.HTTP_201_CREATED)
def create_transaction(body: TransactionIn):
    return db.create(body.model_dump())


@router.put("/{transaction_id}", response_model=TransactionOut)
def update_transaction(transaction_id: int, body: TransactionIn):
    result = db.update(transaction_id, body.model_dump())
    if result is None:
        raise HTTPException(status_code=404, detail="Transaction not found")
    return result


@router.delete("/{transaction_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_transaction(transaction_id: int):
    if not db.delete(transaction_id):
        raise HTTPException(status_code=404, detail="Transaction not found")
    return Response(status_code=status.HTTP_204_NO_CONTENT)
