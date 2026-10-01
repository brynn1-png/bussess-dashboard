# syntax=docker/dockerfile:1

# ---------- Stage 1: build the single-page app ----------
FROM node:22-alpine AS web
WORKDIR /web

# Lockfile-only layer first so npm ci is cached until dependencies actually change.
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci

COPY frontend/ ./
# Runs `tsc --noEmit` first, so a type error fails the deploy rather than shipping.
RUN npm run build

# ---------- Stage 2: runtime - API and SPA from one process, one origin ----------
FROM python:3.12-slim AS runtime

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1

WORKDIR /app/backend

COPY backend/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

COPY backend/ ./
# Lands where app.core.config expects it: <root>/frontend/dist
COPY --from=web /web/dist /app/frontend/dist

EXPOSE 8000

# Migrate before serving, so a fresh database reaches head on first boot.
# exec hands the process PID 1 so the platform can stop it cleanly.
CMD ["sh", "-c", "alembic upgrade head && exec uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
