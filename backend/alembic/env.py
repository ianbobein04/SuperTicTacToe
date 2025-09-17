from logging.config import fileConfig
from typing import Any, cast
from sqlalchemy import engine_from_config, pool
from alembic import context
from app.db.session import Base
from app.db import models  # noqa

config = context.config
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

section = config.get_section(config.config_ini_section)
if section is None:
    raise RuntimeError(
        f"Alembic config section '{config.config_ini_section}' not found. "
        "Check your alembic.ini."
    )
# Pyright/mypy want Dict[str, Any], so cast explicitly:
section_any = cast(dict[str, Any], section)

target_metadata = Base.metadata

def run_migrations_offline():
    url = config.get_main_option("sqlalchemy.url")
    context.configure(url=url, target_metadata=target_metadata, literal_binds=True)
    with context.begin_transaction():
        context.run_migrations()

def run_migrations_online():
    connectable = engine_from_config(
        section_any,
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )
    with connectable.connect() as connection:
        context.configure(connection=connection, target_metadata=target_metadata)
        with context.begin_transaction():
            context.run_migrations()

if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
