from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    # MQTT Settings
    MQTT_BROKER: str = "localhost"
    MQTT_PORT: int = 1900
    MQTT_USERNAME: str = "bunker"
    MQTT_PASSWORD: str = "bunker"
    
    # Server Settings
    APP_PORT: int = 1001
    APP_HOST: str = "0.0.0.0"
    
    # CORS Settings
    ALLOWED_ORIGINS: str = "http://localhost:2000,http://127.0.0.1:2000"
    
    # Optional Debug Settings
    DEBUG: bool = False
    LOG_LEVEL: str = "INFO"
    
    class Config:
        env_file = ".env"
        # Allow any case for env variables
        case_sensitive = False
        # Only use declared fields
        extra = "ignore"

settings = Settings()