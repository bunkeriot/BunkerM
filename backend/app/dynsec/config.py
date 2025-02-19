from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    # Mosquitto admin credentials
    MOSQUITTO_ADMIN_USERNAME: str
    MOSQUITTO_ADMIN_PASSWORD: str
    
    # API authentication
    API_KEY: str
    
    # Frontend URL
    VUEJS_FRONTEND: str
    
    # CORS settings
    ALLOWED_ORIGINS: str
    
    class Config:
        env_file = ".env"