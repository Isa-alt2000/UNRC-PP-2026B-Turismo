"""catalogo de gustos

Revision ID: 0ef38b53932f
Revises: 0fd4b8ab65a6
Create Date: 2026-11-16 02:17:33.695103

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
import sqlmodel


# revision identifiers, used by Alembic.
revision: str = '0ef38b53932f'
down_revision: Union[str, Sequence[str], None] = '0fd4b8ab65a6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


# Copia fija de la tabla: la migración no debe cambiar si mañana cambia el modelo en app/models.
gustos = sa.table(
    "gustos",
    sa.column("codigo", sa.String),
    sa.column("nombre", sa.String),
    sa.column("pregunta", sa.String),
    sa.column("orden", sa.Integer),
)

# Sección 2 de data_science/docs/encuesta.md.
CATALOGO = [
    {
        "codigo": "historia",
        "nombre": "Historia",
        "pregunta": "¿Cuánto te interesa conocer la historia detrás de los lugares que visitas?",
        "orden": 1,
    },
    {
        "codigo": "artes_artesanias",
        "nombre": "Artes y artesanías",
        "pregunta": "¿Cuánto te interesan el arte, las artesanías y los oficios tradicionales durante un viaje?",
        "orden": 2,
    },
    {
        "codigo": "arquitectura",
        "nombre": "Arquitectura",
        "pregunta": "¿Cuánto disfrutas observar edificios, templos o construcciones con valor arquitectónico?",
        "orden": 3,
    },
    {
        "codigo": "gastronomia",
        "nombre": "Gastronomía",
        "pregunta": "¿Cuánto te interesa probar la comida típica de los lugares que visitas?",
        "orden": 4,
    },
    {
        "codigo": "naturaleza",
        "nombre": "Naturaleza",
        "pregunta": "¿Cuánto disfrutas estar en contacto con la naturaleza durante un viaje?",
        "orden": 5,
    },
    {
        "codigo": "aventura",
        "nombre": "Aventura",
        "pregunta": (
            "¿Cuánto disfrutas actividades que impliquen esfuerzo físico o algo de riesgo, "
            "como caminatas largas, cabalgatas o tirolesas?"
        ),
        "orden": 6,
    },
]


def upgrade() -> None:
    """Inserta los 6 gustos."""
    op.bulk_insert(gustos, CATALOGO)


def downgrade() -> None:
    """Borra solo los gustos que insertó esta migración."""
    op.execute(gustos.delete().where(gustos.c.codigo.in_([g["codigo"] for g in CATALOGO])))
