SHELL := /bin/sh

.PHONY: help bootstrap check precommit lint test format clean

help:
	@printf "Verfuegbare Targets:\n"
	@printf "  make bootstrap  - initialisiert die Arbeitsumgebung\n"
	@printf "                     optional: PROJECT_NAME=\"Mein Projekt\" STACK=nextjs\n"
	@printf "  make check      - prueft die Framework-Basis\n"
	@printf "  make precommit  - lokale Basischecks fuer Commits\n"
	@printf "  make lint       - projektspezifisch zu ergaenzen\n"
	@printf "  make test       - projektspezifisch zu ergaenzen\n"
	@printf "  make format     - projektspezifisch zu ergaenzen\n"
	@printf "  make clean      - temporaere Dateien entfernen\n"

bootstrap:
	@PROJECT_NAME="$(PROJECT_NAME)" STACK="$(STACK)" sh ./scripts/bootstrap.sh

check:
	@printf "AGENTS.md vorhanden ... "
	@test -f AGENTS.md && printf "ok\n"
	@printf "docs/brief.md vorhanden ... "
	@test -f docs/brief.md && printf "ok\n"
	@printf "docs/security-baseline.md vorhanden ... "
	@test -f docs/security-baseline.md && printf "ok\n"
	@printf "docs/privacy/README.md vorhanden ... "
	@test -f docs/privacy/README.md && printf "ok\n"
	@printf "SECURITY.md vorhanden ... "
	@test -f SECURITY.md && printf "ok\n"
	@printf "features/INDEX.md vorhanden ... "
	@test -f features/INDEX.md && printf "ok\n"
	@printf "templates/feature-spec.md vorhanden ... "
	@test -f templates/feature-spec.md && printf "ok\n"
	@printf "Secret-Check vorhanden ... "
	@test -f scripts/check-secrets.sh && printf "ok\n"

precommit:
	@make check

lint:
	@printf "Kein projektspezifisches Linting definiert. Makefile anpassen.\n"

test:
	@printf "Keine projektspezifischen Tests definiert. Makefile anpassen.\n"

format:
	@printf "Kein projektspezifisches Formatting definiert. Makefile anpassen.\n"

clean:
	@rm -rf .cache coverage dist build tmp .tmp
