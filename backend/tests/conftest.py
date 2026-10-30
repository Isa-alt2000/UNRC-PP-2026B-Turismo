import os

# Valores ficticios para que las pruebas no dependan del .env de cada quien ni toquen la base o los
# logs reales. Se fijan antes de importar la app; las variables de entorno tienen prioridad sobre el .env.
os.environ["API_PREFIX"] = "/prueba"
os.environ["DATABASE_URL"] = "sqlite://"  # base en memoria
os.environ["CORS_ORIGINS"] = '["http://cliente.test"]'  # .test está reservado para pruebas
os.environ["LOG_FILE"] = os.devnull  # descarta lo que se escribe
