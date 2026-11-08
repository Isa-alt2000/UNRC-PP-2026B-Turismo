from collections.abc import Sequence

from sqlmodel import Session, select

from app.models import PuntoPartida


def listar_puntos_partida(session: Session) -> Sequence[PuntoPartida]:
    """Todos los puntos de partida, en el orden en que se muestran."""
    return session.exec(select(PuntoPartida).order_by(PuntoPartida.orden)).all()
