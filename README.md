# Ian
# Software Engineering Capstone Starter

A batteries-included starter repo for teams building a **FastAPI** backend and **React + TypeScript (Vite)** frontend.
It standardizes tooling (lint, type-check, tests, CI, Docker) so teams can focus on features.

## What’s inside

- **Backend**: FastAPI, SQLAlchemy 2.x, Alembic, Pydantic v2, pytest, httpx, ruff, pyright, nox, pre-commit
- **Frontend**: React + TypeScript (Vite), Vitest + React Testing Library, Playwright (E2E)
- **Infra**: Docker & Compose (API, Postgres, Redis, Web), GitHub Actions CI
- **Testing**: Unit + API integration; optional Postgres integration via Testcontainers (skipped by default)

## Quick start

### Prereqs
- Python 3.12+
- Node 20+ and `pnpm` (`npm i -g pnpm`)
- Docker Desktop (for Compose and optional Testcontainers)
- (Optional) `uv` for Python dependency management: https://docs.astral.sh/uv/

### First run (dev)
```bash
# 1) Backend
cd backend
pip install uv
uv sync --all-extras  # or: python -m venv .venv && source .venv/bin/activate && pip install -e .[dev]
uv run pre-commit install  # if in a git repo
uv run nox -s tests
uv run uvicorn app.main:app --reload


# 2) Frontend
cd ../frontend
npm i -g pnpm
pnpm install
pnpm dev  # visit http://localhost:5173

# 3) Full stack via Docker
cd ..
docker compose up --build  # visit http://localhost:5173 and http://localhost:8000/docs
```

### Running tests
```bash
# Backend: lint, typecheck, unit/integration tests
cd backend
uv run nox -s lint typecheck tests

# Frontend: unit tests
cd ../frontend
pnpm test

# E2E (requires the stack running, e.g., docker compose up)
pnpm exec playwright install
pnpm e2e
```

### Migrations
```bash
cd backend
uv run alembic revision -m "init"
uv run alembic upgrade head
```

### Running the system locally
```bash
# 1) Backend
cd backend
uv run uvicorn app.main:app --reload  # visit http://localhost:8000/docs


# 2) Frontend
cd ../frontend
pnpm dev  # visit http://localhost:5173
```


### Cleaning the repository
```bash
git clean -fdX
```
It is VITAL that you have a capital X, not a lowercase X. A lowercase X will remove any untracked files.


### Notes
- The **Testcontainers**-based test is marked with `@pytest.mark.docker` and **skipped by default**. Enable via `-m docker`.
- Edit `docker-compose.yml` to add services (e.g., workers).
- Backend settings live in `backend/app/core/settings.py` and read from `.env`.
