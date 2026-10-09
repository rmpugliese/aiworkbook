from functools import lru_cache
from typing import Literal, Self

from pydantic import model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

DEV_SECRET_KEY = "dev-only-secret-key-change-me"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_prefix="APP_", env_file=".env", extra="ignore")

    env: Literal["development", "production", "test"] = "development"
    database_url: str = "sqlite:///./dev.db"

    # Signs the short-lived cookie that carries the OAuth state; must be secret in production.
    secret_key: str = DEV_SECRET_KEY
    # Where the browser reaches the app (the frontend origin): used in email links and redirects.
    public_url: str = "http://localhost:5173"
    session_days: int = 30

    email_backend: Literal["console", "smtp", "memory"] = "console"
    email_from: str = "AI Project Workbook <no-reply@localhost>"
    smtp_host: str = "localhost"
    smtp_port: int = 587
    smtp_username: str | None = None
    smtp_password: str | None = None
    smtp_starttls: bool = True

    google_client_id: str | None = None
    google_client_secret: str | None = None

    # The frontend build (frontend/dist) served by the backend in production, so the app has a
    # single origin. Unset in development, where Vite serves the frontend.
    frontend_dist: str | None = None

    @property
    def secure_cookies(self) -> bool:
        return self.env == "production"

    @property
    def google_enabled(self) -> bool:
        return bool(self.google_client_id and self.google_client_secret)

    @model_validator(mode="after")
    def _production_is_complete(self) -> Self:
        if self.env != "production":
            return self
        problems = []
        if self.secret_key == DEV_SECRET_KEY or len(self.secret_key) < 32:
            problems.append("APP_SECRET_KEY must be a random value of at least 32 characters")
        if not self.public_url.startswith("https://"):
            problems.append("APP_PUBLIC_URL must be the public https:// address")
        if self.database_url.startswith("sqlite"):
            problems.append("APP_DATABASE_URL must point to PostgreSQL")
        if self.email_backend != "smtp":
            problems.append("APP_EMAIL_BACKEND must be smtp, or confirmation emails never arrive")
        if problems:
            raise ValueError("Production configuration incomplete: " + "; ".join(problems))
        return self


@lru_cache
def get_settings() -> Settings:
    return Settings()
