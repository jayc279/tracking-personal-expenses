import os
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from backend.database import init_db
from backend.routers.transactions import router as transactions_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield


app = FastAPI(lifespan=lifespan)

templates = Jinja2Templates(directory="backend/templates")

app.include_router(transactions_router, prefix="/api/transactions")

dist_dir = os.path.join(os.path.dirname(__file__), "..", "dist")
if os.path.isdir(dist_dir):
    app.mount("/static", StaticFiles(directory=dist_dir), name="static")


@app.get("/")
def root(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})
