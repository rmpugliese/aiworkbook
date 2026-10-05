from functools import lru_cache
from typing import Literal

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_prefix="APP_", env_file=".env", extra="ignore")

    env: Literal["development", "production", "test"] = "development"
    database_url: str = "sqlite:///./dev.db"


@lru_cache
def get_settings() -> Settings:
    return Settings()
