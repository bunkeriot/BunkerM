from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    TIER: str = "community"
    DATABASE_URL: str = "sqlite+aiosqlite:////nextjs/data/smart-anomaly.db"
    BUNKERM_MONITOR_URL: str = "http://127.0.0.1:1001"
    BUNKERM_CLIENTLOGS_URL: str = "http://127.0.0.1:1002"
    BUNKERM_API_KEY: str = "default_api_key_replace_in_production"
    POLL_INTERVAL_TOPICS: int = 10
    POLL_INTERVAL_EVENTS: int = 30
    ANOMALY_SIGMA_THRESHOLD: float = 3.0

    model_config = {"env_file": ".env", "case_sensitive": True}


settings = Settings()
