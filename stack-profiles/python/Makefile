SHELL := /bin/sh
VENV := .venv
PYTHON := $(VENV)/bin/python3
PIP := $(VENV)/bin/pip

.PHONY: help bootstrap install check precommit lint test security format run clean

ensure-install:
	@test -x $(PYTHON) || (printf "Virtuelle Umgebung fehlt. Bitte zuerst 'make install' ausfuehren.\n" >&2; exit 1)

help:
	@printf "Verfuegbare Targets:\n"
	@printf "  make bootstrap  - initialisiert die Arbeitsumgebung\n"
	@printf "  make install    - installiert Python-Abhaengigkeiten\n"
	@printf "  make check      - prueft die Framework-Basis\n"
	@printf "  make precommit  - lokale Commit-Pruefungen ohne Netz-Audit\n"
	@printf "  make lint       - fuehrt Ruff aus\n"
	@printf "  make test       - fuehrt Pytest aus\n"
	@printf "  make security   - fuehrt Security-Basischecks aus\n"
	@printf "  make format     - formatiert mit Ruff\n"
	@printf "  make run        - startet das Beispielmodul\n"
	@printf "  make clean      - entfernt Build-Artefakte\n"

bootstrap:
	@PROJECT_NAME="$(PROJECT_NAME)" STACK="$(STACK)" sh ./scripts/bootstrap.sh

install:
	@python3 -m venv $(VENV)
	@$(PIP) install --upgrade pip
	@$(PIP) install -r requirements-dev.txt

check:
	@printf "pyproject.toml vorhanden ... "
	@test -f pyproject.toml && printf "ok\n"
	@printf "App-Modul vorhanden ... "
	@test -f src/app.py && printf "ok\n"
	@printf "Testdatei vorhanden ... "
	@test -f tests/test_smoke.py && printf "ok\n"
	@printf "Dependabot vorhanden ... "
	@test -f .github/dependabot.yml && printf "ok\n"
	@printf "CodeQL vorhanden ... "
	@test -f .github/workflows/codeql.yml && printf "ok\n"

precommit:
	@./scripts/check-secrets.sh
	@make check
	@make ensure-install
	@make lint
	@make test

lint:
	@$(PYTHON) -m ruff check .

test:
	@$(PYTHON) -m pytest

security:
	@mkdir -p .cache
	@$(PYTHON) -m bandit -q -r src
	@XDG_CACHE_HOME="$(PWD)/.cache" $(PYTHON) -m pip_audit --local --progress-spinner off

format:
	@$(PYTHON) -m ruff format .

run:
	@$(PYTHON) src/app.py

clean:
	@rm -rf .venv .pytest_cache .ruff_cache __pycache__
