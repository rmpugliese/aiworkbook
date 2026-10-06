from importlib.metadata import version

from fastapi import FastAPI

from app.routers import health, projects, template
from app.workbook.loader import validate_all_templates


def create_app() -> FastAPI:
    # Refuse to start with a broken workbook template.
    validate_all_templates()

    app = FastAPI(title="AI Project Workbook API", version=version("app"))
    app.include_router(health.router)
    app.include_router(template.router)
    app.include_router(projects.router)
    return app


app = create_app()
