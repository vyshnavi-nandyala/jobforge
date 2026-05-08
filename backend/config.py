from pydantic_settings import BaseSettings
from functools import lru_cache
import os

class Settings(BaseSettings):
    database_url: str = "postgresql+asyncpg://jobforge:jobforge123@localhost:5432/jobforgedb"
    anthropic_api_key: str = ""
    frontend_url: str = "http://localhost:3000"
    port: int = 8000
    environment: str = "development"

    smtp_host: str = "smtp.gmail.com"
    smtp_port: int = 587
    smtp_user: str = ""
    smtp_password: str = ""
    notification_email: str = ""

    scrape_delay_min: float = 2.0
    scrape_delay_max: float = 5.0
    max_jobs_per_source: int = 20

    uploads_dir: str = "uploads"
    generated_dir: str = "generated"

    class Config:
        env_file = ".env"
        extra = "ignore"

@lru_cache()
def get_settings() -> Settings:
    return Settings()

settings = get_settings()

os.makedirs(settings.uploads_dir, exist_ok=True)
os.makedirs(settings.generated_dir, exist_ok=True)
os.makedirs("logs", exist_ok=True)
