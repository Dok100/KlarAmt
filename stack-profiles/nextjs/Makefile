SHELL := /bin/sh

.PHONY: help bootstrap check precommit install lint typecheck test security format dev build clean

ensure-install:
	@test -d node_modules || (printf "Abhaengigkeiten fehlen. Bitte zuerst 'make install' ausfuehren.\n" >&2; exit 1)

help:
	@printf "Verfuegbare Targets:\n"
	@printf "  make bootstrap  - initialisiert die Arbeitsumgebung\n"
	@printf "  make install    - installiert Node-Abhaengigkeiten\n"
	@printf "  make check      - prueft die Framework-Basis\n"
	@printf "  make precommit  - lokale Commit-Pruefungen ohne Netz-Audit\n"
	@printf "  make lint       - fuehrt das Projekt-Linting aus\n"
	@printf "  make typecheck  - fuehrt TypeScript-Pruefungen aus\n"
	@printf "  make test       - fuehrt Tests aus\n"
	@printf "  make security   - fuehrt Security-Basischecks aus\n"
	@printf "  make format     - fuehrt Code-Formatierung aus\n"
	@printf "  make dev        - startet die lokale Entwicklung\n"
	@printf "  make build      - baut die Anwendung\n"
	@printf "  make clean      - entfernt Build-Artefakte\n"

bootstrap:
	@PROJECT_NAME="$(PROJECT_NAME)" STACK="$(STACK)" sh ./scripts/bootstrap.sh

install:
	@npm install

check:
	@printf "package.json vorhanden ... "
	@test -f package.json && printf "ok\n"
	@printf "Next app entry vorhanden ... "
	@test -f src/app/page.tsx && printf "ok\n"
	@printf "Layout vorhanden ... "
	@test -f src/app/layout.tsx && printf "ok\n"
	@printf "Dependabot vorhanden ... "
	@test -f .github/dependabot.yml && printf "ok\n"
	@printf "CodeQL vorhanden ... "
	@test -f .github/workflows/codeql.yml && printf "ok\n"

precommit:
	@./scripts/check-secrets.sh
	@make check
	@make ensure-install
	@make lint
	@make typecheck
	@make test

lint:
	@npm run lint

typecheck:
	@npm run typecheck

test:
	@npm run test

security:
	@npm run security

format:
	@npm run format

dev:
	@npm run dev

build:
	@npm run build

clean:
	@rm -rf .next node_modules coverage
