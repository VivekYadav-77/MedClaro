from functools import lru_cache
from typing import Literal

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    app_name: str = "MedClaro API"
    environment: Literal["development", "staging", "production"] = "development"
    api_v1_prefix: str = "/api"
    mongo_uri: str = "mongodb://localhost:27017"
    mongo_db_name: str = "medclaro"
    jwt_secret: str = "change-me"
    jwt_algorithm: str = "HS256"
    jwt_expiry_minutes: int = 60
    app_encryption_key: str = Field(
        default="AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=",
        description="Base64 url-safe 32-byte key for AES-256-GCM",
    )
    gemini_api_key: str = ""
    gemini_model_text: str = "gemini-1.5-flash"
    gemini_model_vision: str = "gemini-1.5-flash"
    aws_access_key_id: str = ""
    aws_secret_access_key: str = ""
    aws_region: str = "ap-south-1"
    aws_bucket_name: str = ""
    storage_backend: Literal["s3", "r2"] = "s3"
    storage_endpoint_url: str | None = None
    allowed_file_types: tuple[str, ...] = ("application/pdf", "image/jpeg", "image/png")
    max_upload_size_bytes: int = 10 * 1024 * 1024
    upload_limit_per_day: int = 5
    chat_limit_per_day: int = 20
    frontend_url: str = "http://localhost:3000"
    google_client_id: str = ""
    google_client_secret: str = ""


@lru_cache
def get_settings() -> Settings:
    return Settings()
