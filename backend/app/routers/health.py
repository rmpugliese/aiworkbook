from importlib.metadata import version
from typing import Annotated, Literal

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from app.db import get_db

router = APIRouter(prefix="/api", tags=["health"])


class HealthResponse(BaseModel):
    status: Literal["ok", "degraded"]
    version: str
    database: Literal["ok", "error"]


@router.get("/health")
def health(db: Annotated[Session, Depends(get_db)]) -> HealthResponse:
    try:
        db.execute(text("SELECT 1"))
        database: Literal["ok", "error"] = "ok"
    except SQLAlchemyError:
        database = "error"
    return HealthResponse(
        status="ok" if database == "ok" else "degraded",
        version=version("app"),
        database=database,
    )
