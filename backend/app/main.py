from importlib.metadata import version

from fastapi import FastAPI

from app.routers import health


def create_app() -> FastAPI:
    app = FastAPI(title="AI Project Workbook API", version=version("app"))
    app.include_router(health.router)
    return app


app = create_app()
