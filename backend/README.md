# Backend

FastAPI app with SQLAlchemy, Alembic, Pydantic v2. Includes pytest, ruff, pyright, nox, and pre-commit.

## Dev
```bash
uv sync --all-extras
uv run pre-commit install
uv run nox -s tests
uv run uvicorn app.main:app --reload
```
