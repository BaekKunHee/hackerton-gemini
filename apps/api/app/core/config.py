from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "Flipside API"
    app_version: str = "0.1.0"
    cors_allow_origins: list[str] = ["http://localhost:3000"]

    # Gemini API settings
    gemini_api_key: str = ""

    # Default model (used for most agents)
    gemini_model: str = "gemini-3-flash-preview"

    # Pro model (for complex reasoning - Agent A, D)
    gemini_model_pro: str = "gemini-3.1-pro-preview"

    # Flash model (for fast search-based tasks - Agent B, C)
    gemini_model_flash: str = "gemini-3-flash-preview"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )


settings = Settings()
