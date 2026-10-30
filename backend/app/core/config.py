from pathlib import Path
from typing import Literal

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

BACKEND = Path(__file__).resolve().parents[2]

NivelLog = Literal["DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL"]


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=BACKEND / ".env", extra="ignore")
    app_name: str = "API Turismo Michoacán"
    log_level: NivelLog = "INFO"
    log_file: Path = BACKEND / "logs_backend.log"

    @field_validator("log_level", mode="before")
    @classmethod
    def nivel_en_mayusculas(cls, valor: object) -> object:
        # Acepta "info" o "INFO"; un valor que no sea un nivel válido falla al arrancar.
        return valor.upper() if isinstance(valor, str) else valor


settings = Settings()
