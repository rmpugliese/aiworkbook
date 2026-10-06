from fastapi import APIRouter, HTTPException, status

from app.workbook.loader import TemplateNotFoundError, current_template, load_template
from app.workbook.schema import Template

router = APIRouter(prefix="/api/template", tags=["template"])


@router.get("")
def get_current_template() -> Template:
    return current_template()


@router.get("/{version}")
def get_template(version: int) -> Template:
    try:
        return load_template(version)
    except TemplateNotFoundError as error:
        raise HTTPException(status.HTTP_404_NOT_FOUND, str(error)) from error
