.PHONY: bootstrap check precommit lint test format security dev build clean

bootstrap:
	sh ./scripts/bootstrap.sh

# Prüft ob die wichtigsten Projektdateien vorhanden sind
check:
	@test -f CLAUDE.md         || (echo "[missing] CLAUDE.md" && exit 1)
	@test -f docs/brief.md     || (echo "[missing] docs/brief.md" && exit 1)
	@test -f docs/STATUS.md    || (echo "[missing] docs/STATUS.md" && exit 1)
	@test -f features/INDEX.md || (echo "[missing] features/INDEX.md" && exit 1)
	@test -f .github/workflows/ci.yml || (echo "[missing] .github/workflows/ci.yml" && exit 1)
	@echo "[ok] Projektstruktur vollständig"

# Vor jedem Commit ausführen
precommit: check
	@sh ./scripts/check-secrets.sh

# Diese Targets mit dem gewählten Stack-Tooling befüllen
lint:
	@echo "Kein Linter konfiguriert – nach Stack-Wahl ergänzen"

test:
	@echo "Kein Testrunner konfiguriert – nach Stack-Wahl ergänzen"

format:
	@echo "Kein Formatter konfiguriert – nach Stack-Wahl ergänzen"

security:
	@sh ./scripts/check-secrets.sh

dev:
	@echo "Kein Dev-Server konfiguriert – nach Stack-Wahl ergänzen"

build:
	@echo "Kein Build konfiguriert – nach Stack-Wahl ergänzen"

clean:
	@echo "Kein Clean-Target konfiguriert – nach Stack-Wahl ergänzen"
