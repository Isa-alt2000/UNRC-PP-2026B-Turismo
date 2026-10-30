from pathlib import Path
from typing import Literal

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict
from sqlalchemy.engine import make_url

BACKEND = Path(__file__).resolve().parents[2]

NivelLog = Literal["DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL"]


class Settings(BaseSettings):

    model_config = SettingsConfigDict(env_file=BACKEND / ".env", env_ignore_empty=True, extra="ignore")
    app_name: str = "API Turismo Michoacán"

    api_prefix: str
    database_url: str
    cors_origins: list[str]
    log_level: NivelLog = "INFO"
    log_file: Path

    @field_validator("api_prefix")
    @classmethod
    def prefijo_valido(cls, prefijo: str) -> str:
        if not prefijo.startswith("/") or prefijo.endswith("/"):
            raise ValueError("debe empezar con '/' y no terminar en '/', por ejemplo /api/v1")
        return prefijo

    @field_validator("log_file")
    @classmethod
    def log_relativo_a_backend(cls, archivo: Path) -> Path:
        return archivo if archivo.is_absolute() else BACKEND / archivo

    @field_validator("database_url")
    @classmethod
    def sqlite_relativa_a_backend(cls, url: str) -> str:
        partes = make_url(url)
        archivo = partes.database
        if partes.get_backend_name() != "sqlite" or not archivo or archivo == ":memory:":
            return url
        if Path(archivo).is_absolute():
            return url
        return partes.set(database=str(BACKEND / archivo)).render_as_string(hide_password=False)

    @field_validator("log_level", mode="before")
    @classmethod
    def nivel_en_mayusculas(cls, valor: object) -> object:
        return valor.upper() if isinstance(valor, str) else valor


settings = Settings()
