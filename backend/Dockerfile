# syntax=docker/dockerfile:1
FROM python:3.12-slim

ENV PYTHONUNBUFFERED=1 PYTHONDONTWRITEBYTECODE=1
ENV UV_LINK_MODE=copy
WORKDIR /app

# Install uv (the Astral CLI) into ~/.local/bin
RUN apt-get update && apt-get install -y --no-install-recommends curl ca-certificates \
  && rm -rf /var/lib/apt/lists/* \
  && curl -LsSf https://astral.sh/uv/install.sh | sh
ENV PATH="/root/.local/bin:${PATH}"

# Copy only dependency files first (better layer cache)
COPY pyproject.toml /app/
# If you have a lockfile, copy it too and use --frozen for reproducibility:
# COPY uv.lock /app/
# RUN uv sync --frozen
RUN uv sync --no-dev           # omit dev extras in the image; use --extra dev if you want them

# Now copy the rest of the app
COPY . /app

EXPOSE 8000
CMD ["uv", "run", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
