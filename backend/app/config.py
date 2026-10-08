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

    @property
    def secure_cookies(self) -> bool:
        return self.env == "production"

    @property
    def google_enabled(self) -> bool:
        return bool(self.google_client_id and self.google_client_secret)

    @model_validator(mode="after")
    def _production_needs_a_secret(self) -> Self:
        if self.env == "production" and self.secret_key == DEV_SECRET_KEY:
            raise ValueError("APP_SECRET_KEY must be set in production")
        return self


@lru_cache
def get_settings() -> Settings:
    return Settings()
