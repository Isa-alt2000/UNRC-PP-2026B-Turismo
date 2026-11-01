from sqlmodel import SQLModel


class GustoPublico(SQLModel):
    """Un gusto tal como lo recibe el frontend para armar las preguntas del 1 al 5"""
    codigo: str
    nombre: str
    pregunta: str
