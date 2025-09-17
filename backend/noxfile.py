import nox

@nox.session(python="3.12")
def lint(session):
    session.install(".[dev]")
    session.run("ruff", "check", ".")
    session.run("ruff", "format", "--check", ".")

@nox.session(python="3.12")
def typecheck(session):
    session.install(".[dev]")
    session.run("pyright")

@nox.session(python="3.12")
def tests(session):
    session.install(".[dev]")
    session.run("pytest")
