"""catalogo de puntos de partida

Revision ID: 00d568a735cf
Revises: 6fb8e5da59e8
Create Date: 2026-11-16 08:11:10.151520

"""
from collections.abc import Sequence

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '00d568a735cf'
down_revision: str | Sequence[str] | None = '6fb8e5da59e8'
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


# Copia fija de la tabla: la migración no debe cambiar si mañana cambia el modelo en app/models.
puntos_partida = sa.table(
    "puntos_partida",
    sa.column("id", sa.String),
    sa.column("nombre", sa.String),
    sa.column("latitud", sa.Float),
    sa.column("longitud", sa.Float),
    sa.column("orden", sa.Integer),
)


CATALOGO = [
    {"id": "morelia", "nombre": "Morelia", "latitud": 19.71094, "longitud": -101.20920, "orden": 1},
    {
        "id": "patzcuaro",
        "nombre": "Pátzcuaro",
        "latitud": 19.51134,
        "longitud": -101.61304,
        "orden": 2,
    },
    {"id": "uruapan", "nombre": "Uruapan", "latitud": 19.42443, "longitud": -102.05194, "orden": 3},
]


def upgrade() -> None:
    """Inserta los 3 puntos de partida."""
    op.bulk_insert(puntos_partida, CATALOGO)


def downgrade() -> None:
    """Borra solo los puntos que insertó esta migración."""
    op.execute(
        puntos_partida.delete().where(puntos_partida.c.id.in_([p["id"] for p in CATALOGO]))
    )
