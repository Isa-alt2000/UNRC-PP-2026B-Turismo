# Instalación local

Todos los comandos parten de la raíz del repositorio.

## 1. Dependencias
Instalación de librerías y dependiencias.

```bash
# python para el back y para data_science
uv sync --all-packages

# frontend
cd frontend && npm install && cd ..
```

## 2. Configuración
Copiar formato de .env y llenar con keys y secretos.

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

## 3. Base de datos
Creación de tablas y preparación de datos

```bash
# crea las tablas
cd backend && uv run alembic upgrade head && cd ..

# copia de los .csv para poblar bases de datos
python3 copiar_al_backend.py datos

# carga los .csv a la base:puntos de partida, recintos y hoteles
cd backend && uv run python -m app.cargas && cd ..
```

## 4. Modelos entrenados
Entrenamiento y generación de .joblib con sus json. Se copian al backend para que los pueda interpretar

```bash
cd data_science
uv run python -m ml.regresion_logistica
uv run python -m ml.arbol_regresion
cd ..
python3 copiar_al_backend.py modelos
```

## 5. Servidores
Levantar el back y el front
Back :8000
Front :5173

```bash
cd backend && uv run fastapi dev app/main.py
cd frontend && npm run dev
```
