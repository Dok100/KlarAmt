SHELL := /bin/sh

.PHONY: help bootstrap install generate check precommit lint test security format run build clean ensure-tools

help:
	@printf "Verfuegbare Targets:\n"
	@printf "  make bootstrap  - initialisiert die Arbeitsumgebung\n"
	@printf "  make install    - prueft lokale Tools und generiert das Xcode-Projekt\n"
	@printf "  make generate   - erzeugt das Xcode-Projekt via XcodeGen\n"
	@printf "  make check      - prueft die Framework-Basis\n"
	@printf "  make precommit  - lokale Commit-Pruefungen\n"
	@printf "  make lint       - fuehrt SwiftFormat im Lint-Modus aus\n"
	@printf "  make test       - fuehrt Unit-Tests mit xcodebuild aus\n"
	@printf "  make security   - prueft Basis-Sicherheitsregeln fuer macOS-Apps\n"
	@printf "  make format     - formatiert Swift-Dateien mit SwiftFormat\n"
	@printf "  make run        - baut die App fuer Debug\n"
	@printf "  make build      - baut die App fuer Debug\n"
	@printf "  make clean      - entfernt Build-Artefakte\n"

bootstrap:
	@PROJECT_NAME="$(PROJECT_NAME)" STACK="$(STACK)" PROJECT_SUMMARY="$(PROJECT_SUMMARY)" PRIMARY_USERS="$(PRIMARY_USERS)" DEPLOY_TARGET="$(DEPLOY_TARGET)" REPO_VISIBILITY="$(REPO_VISIBILITY)" PERSONAL_DATA_PROCESSING="$(PERSONAL_DATA_PROCESSING)" SECURITY_CONTACT="$(SECURITY_CONTACT)" FIRST_FEATURE_TITLE="$(FIRST_FEATURE_TITLE)" sh ./scripts/bootstrap.sh

ensure-tools:
	@command -v xcodegen >/dev/null 2>&1 || (printf "xcodegen fehlt. Installiere es mit 'brew install xcodegen'.\n" >&2; exit 1)
	@command -v swiftformat >/dev/null 2>&1 || (printf "swiftformat fehlt. Installiere es mit 'brew install swiftformat'.\n" >&2; exit 1)
	@command -v xcodebuild >/dev/null 2>&1 || (printf "xcodebuild fehlt. Xcode Command Line Tools oder Xcode installieren.\n" >&2; exit 1)

install:
	@make ensure-tools
	@make generate

generate:
	@xcodegen generate

check:
	@printf "project.yml vorhanden ... "
	@test -f project.yml && printf "ok\n"
	@printf "SwiftUI App vorhanden ... "
	@test -f Sources/App/AppEntry.swift && printf "ok\n"
	@printf "Unit-Tests vorhanden ... "
	@test -f Tests/AppTests/AppInfoTests.swift && printf "ok\n"
	@printf "Dependabot vorhanden ... "
	@test -f .github/dependabot.yml && printf "ok\n"
	@printf "CodeQL vorhanden ... "
	@test -f .github/workflows/codeql.yml && printf "ok\n"

precommit:
	@./scripts/check-secrets.sh
	@make check
	@make ensure-tools
	@make generate
	@make lint

lint:
	@swiftformat --lint Sources Tests

test:
	@make generate
	@xcodebuild test -scheme App -destination 'platform=macOS' > /tmp/xcodebuild-test.log && tail -n 20 /tmp/xcodebuild-test.log

security:
	@printf "Hardcoded secrets pruefen ... "
	@! rg -n 'AKIA[0-9A-Z]{16}|ghp_[0-9A-Za-z]{36,}|-----BEGIN [A-Z ]*PRIVATE KEY-----' Sources Tests >/dev/null 2>&1
	@printf "ok\n"
	@printf "App Sandbox pruefen ... "
	@rg -q 'ENABLE_APP_SANDBOX: YES' project.yml && printf "ok\n"
	@printf "Code Signing bewusst auf Automatic ... "
	@rg -q 'CODE_SIGN_STYLE: Automatic' project.yml && printf "ok\n"

format:
	@swiftformat Sources Tests

run:
	@make build

build:
	@make generate
	@xcodebuild build -scheme App -destination 'platform=macOS' > /tmp/xcodebuild-build.log && tail -n 20 /tmp/xcodebuild-build.log

clean:
	@rm -rf build *.xcodeproj /tmp/xcodebuild-build.log /tmp/xcodebuild-test.log
