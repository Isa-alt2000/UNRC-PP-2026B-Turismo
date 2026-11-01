from collections.abc import Sequence

from sqlmodel import Session, select

from app.models import Gusto


def listar_gustos(session: Session) -> Sequence[Gusto]:
    """Todos los gustos, en el orden en que se muestran."""
    return session.exec(select(Gusto).order_by(Gusto.orden)).all()
