import os
from typing import List
from pydantic_settings import BaseSettings
from pydantic import field_validator


class Settings(BaseSettings):
    # App
    APP_NAME: str = "DermatoIA"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = True

    # Database
    DATABASE_URL: str = "postgresql+asyncpg://dermatoai:dermatoai@localhost:5432/dermatoai"
    DATABASE_URL_SYNC: str = "postgresql://dermatoai:dermatoai@localhost:5432/dermatoai"

    # JWT
    JWT_SECRET_KEY: str = "change-this-secret-key-in-production"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # Storage
    STORAGE_TYPE: str = "local"
    STORAGE_LOCAL_PATH: str = "./uploads"
    S3_BUCKET_NAME: str = "dermatoai-images"
    S3_ENDPOINT_URL: str = "http://localhost:9000"
    S3_ACCESS_KEY: str = "minioadmin"
    S3_SECRET_KEY: str = "minioadmin"

    # Model
    MODEL_PATH: str = "../ai_model/models/exported/model.pt"
    MODEL_VERSION: str = "1.0.0"
    INFERENCE_MAX_WORKERS: int = 2

    # CORS
    CORS_ORIGINS: List[str] = ["http://localhost:3000", "http://localhost:8081"]

    # Firebase
    FIREBASE_CREDENTIALS_PATH: str = "./firebase-credentials.json"

    model_config = {"env_file": ".env", "extra": "ignore"}


settings = Settings()
