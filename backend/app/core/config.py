import os
from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional

ENV_PATH = Path(__file__).resolve().parent.parent.parent / ".env"

class Settings(BaseSettings):
    PROJECT_NAME: str = "Second Voice AI Backend"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    
    # Host & Port
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    DEBUG: bool = True

    # AI Keys
    GROQ_API_KEY: str = ""
    GEMINI_API_KEY: str = ""
    DEEPGRAM_API_KEY: str = ""

    # Model Defaults
    DEFAULT_AI_PROVIDER: str = "groq"
    GROQ_LLM_MODEL: str = "openai/gpt-oss-120b"
    GROQ_STT_MODEL: str = "whisper-large-v3-turbo"
    DEFAULT_TTS_VOICE: str = "en-US-GuyNeural"

    model_config = SettingsConfigDict(
        env_file=str(ENV_PATH),
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()
