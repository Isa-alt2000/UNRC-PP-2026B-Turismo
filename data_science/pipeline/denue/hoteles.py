"""Extrae los establecimientos de hospedaje de Michoacán del DENUE, listos para cargarse a la base.

Lee datos/crudos/inegi/denue_inegi_16_.csv (todos los negocios de Michoacán, en latin-1) y escribe
datos/procesados/hoteles.csv con las mismas columnas que la tabla hoteles del backend:

    id, nombre, tipo, codigo_scian, tamano, telefono, sitio_web, direccion, localidad,
    municipio, latitud, longitud

Solo se conserva el hospedaje (SCIAN 7211, 7212 y 7213). Los nombres y direcciones pasan de
MAYÚSCULAS a mayúsculas iniciales, los teléfonos quedan en 10 dígitos y los sitios web con
https://. El correo no se conserva: en muchos casos es personal de quien atiende el negocio.

Desde data_science/:
    uv run python -m pipeline.denue.hoteles
"""

import re

import pandas as pd

from config import CRUDOS, PROCESADOS

ENTRADA = CRUDOS / "inegi" / "denue_inegi_16_.csv"
SALIDA = PROCESADOS / "hoteles.csv"

# Código SCIAN de 6 dígitos -> tipo que se muestra al turista
TIPOS = {
    "721111": "Hotel",  # con otros servicios integrados
    "721112": "Hotel",  # sin otros servicios integrados
    "721113": "Motel",
    "721190": "Cabañas",
    "721210": "Campamento",
    "721311": "Casa de huéspedes",
    "721312": "Departamento amueblado",
}
# Rango de personal ocupado del DENUE (lo define INEGI) -> tamaño de empresa. Es la estratificación
# por personal para servicios que usa INEGI en los Censos Económicos: micro 0 a 10, pequeña 11 a 50,
# mediana 51 a 100 y grande 101 o más. El acuerdo del DOF de 2009 combina personal y ventas, pero
# el DENUE no trae ventas, así que se usa solo el personal.
TAMANOS = {
    "0 a 5 personas": "micro",
    "6 a 10 personas": "micro",
    "11 a 30 personas": "pequena",
    "31 a 50 personas": "pequena",
    "51 a 100 personas": "mediana",
    "101 a 250 personas": "grande",
    "251 y más personas": "grande",
}
COLUMNAS = [
    "id", "nombre", "tipo", "codigo_scian", "tamano", "telefono", "sitio_web", "direccion",
    "localidad", "municipio", "latitud", "longitud",
]
# Palabras que van en minúscula dentro de un nombre propio
MINUSCULAS = {"a", "al", "con", "de", "del", "e", "el", "en", "la", "las", "los", "o", "para", "por", "y"}
# Números romanos que se dejan en mayúsculas (Lago II, Fraccionamiento III)
ROMANOS = {"ii", "iii", "iv", "vi", "vii", "viii", "ix", "xi", "xii"}
# Valores de relleno del DENUE que significan "sin dato"
VACIOS = {"", "NINGUNO", "SN", "S/N", "0"}


def vacio(valor):
    return pd.isna(valor) or str(valor).strip().upper() in VACIOS


def capitalizar(texto):
    """HOTEL DE LA PLAZA -> Hotel de la Plaza. Respeta signos como paréntesis o comillas al inicio."""
    if vacio(texto):
        return None
    palabras = str(texto).strip().lower().split()
    resultado = []
    for i, palabra in enumerate(palabras):
        if i > 0 and palabra in MINUSCULAS:
            resultado.append(palabra)
        elif palabra in ROMANOS:
            resultado.append(palabra.upper())
        else:
            resultado.append(re.sub(r"[^\W\d_]", lambda letra: letra.group().upper(), palabra, count=1))
    return " ".join(resultado)


def telefono(valor):
    digitos = re.sub(r"\D", "", str(valor)) if not vacio(valor) else ""
    return digitos if len(digitos) == 10 else None


def sitio_web(valor):
    if vacio(valor):
        return None
    sitio = str(valor).strip().lower()
    if "." not in sitio or " " in sitio:
        return None
    return sitio if sitio.startswith(("http://", "https://")) else f"https://{sitio}"


def direccion(fila):
    """Calle Ponce de León 12, Centro. None si no hay calle."""
    if vacio(fila["nom_vial"]):
        return None
    calle = f"{capitalizar(fila['tipo_vial']) or ''} {capitalizar(fila['nom_vial'])}".strip()
    numero = "s/n" if vacio(fila["numero_ext"]) else str(fila["numero_ext"]).strip()
    colonia = capitalizar(fila["nomb_asent"])
    return f"{calle} {numero}" + (f", {colonia}" if colonia else "")


def procesar(denue):
    hospedaje = denue[denue["codigo_act"].isin(TIPOS)].copy()
    hoteles = pd.DataFrame(
        {
            "id": hospedaje["id"].astype(int),
            "nombre": hospedaje["nom_estab"].map(capitalizar),
            "tipo": hospedaje["codigo_act"].map(TIPOS),
            "codigo_scian": hospedaje["codigo_act"].astype(int),
            "tamano": hospedaje["per_ocu"].map(TAMANOS),
            "telefono": hospedaje["telefono"].map(telefono),
            "sitio_web": hospedaje["www"].map(sitio_web),
            "direccion": hospedaje.apply(direccion, axis=1),
            "localidad": hospedaje["localidad"].str.strip(),
            "municipio": hospedaje["municipio"].str.strip(),
            "latitud": pd.to_numeric(hospedaje["latitud"], errors="coerce"),
            "longitud": pd.to_numeric(hospedaje["longitud"], errors="coerce"),
        }
    )[COLUMNAS]

    sin_tamano = hoteles["tamano"].isna()
    if sin_tamano.any():
        raise ValueError(f"Rangos de personal sin tamaño: {sorted(hospedaje.loc[sin_tamano, 'per_ocu'].unique())}")

    # Sin nombre o sin coordenadas no se puede mostrar ni ubicar.
    descartados = hoteles["nombre"].isna() | hoteles["latitud"].isna() | hoteles["longitud"].isna()
    if hoteles["id"].duplicated().any():
        raise ValueError("El DENUE trae ids repetidos de hospedaje.")
    return hoteles[~descartados].sort_values("id").reset_index(drop=True), int(descartados.sum())


def main():
    denue = pd.read_csv(ENTRADA, encoding="latin-1", dtype=str)
    hoteles, descartados = procesar(denue)
    hoteles.to_csv(SALIDA, index=False, encoding="utf-8")
    print(f"{SALIDA}: {len(hoteles)} establecimientos de {len(denue)} del DENUE; descartados: {descartados}")
    print(hoteles["tipo"].value_counts().to_string())
    print(hoteles["tamano"].value_counts().to_string())
    print(
        f"Con teléfono: {hoteles['telefono'].notna().sum()} | con sitio web: "
        f"{hoteles['sitio_web'].notna().sum()} | con dirección: {hoteles['direccion'].notna().sum()}"
    )


if __name__ == "__main__":
    main()
