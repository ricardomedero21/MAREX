# Backend de Marex — Python + FastAPI (ARM64 / Jetson).
FROM python:3.11-slim

WORKDIR /app

# Dependencias del sistema mínimas (sqlite ya viene en la stdlib).
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Instalar dependencias de Python primero (mejor cache de capas).
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copiar el código del backend.
COPY marex ./marex

# El contenedor escucha en 8000.
EXPOSE 8000

# Healthcheck: el endpoint /health.
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
    CMD curl -fsS http://localhost:8000/health || exit 1

CMD ["uvicorn", "marex.api.app:app", "--host", "0.0.0.0", "--port", "8000"]
