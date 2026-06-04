SHELL := /bin/sh
BIN   := bin/app

.PHONY: help bootstrap install check precommit lint test security format run build clean

help:
	@printf "Verfuegbare Targets:\n"
	@printf "  make bootstrap  - initialisiert die Arbeitsumgebung\n"
	@printf "  make install    - laedt Go-Abhaengigkeiten\n"
	@printf "  make check      - prueft die Framework-Basis\n"
	@printf "  make precommit  - lokale Commit-Pruefungen\n"
	@printf "  make lint       - fuehrt go vet aus\n"
	@printf "  make test       - fuehrt go test aus\n"
	@printf "  make security   - scannt nach Secrets\n"
	@printf "  make format     - formatiert mit gofmt\n"
	@printf "  make run        - startet die Anwendung\n"
	@printf "  make build      - baut die Binaerdatei\n"
	@printf "  make clean      - entfernt Build-Artefakte\n"

bootstrap:
	@PROJECT_NAME="$(PROJECT_NAME)" STACK="$(STACK)" sh ./scripts/bootstrap.sh

install:
	@go mod tidy

check:
	@printf "go.mod vorhanden ... "
	@test -f go.mod && printf "ok\n"
	@printf "Hauptpaket vorhanden ... "
	@test -f src/main.go && printf "ok\n"
	@printf "Tests vorhanden ... "
	@test -f src/main_test.go && printf "ok\n"
	@printf "CI vorhanden ... "
	@test -f .github/workflows/ci.yml && printf "ok\n"

precommit:
	@sh ./scripts/check-secrets.sh
	@make check
	@make lint
	@make test

lint:
	@go vet ./...

test:
	@go test ./...

security:
	@sh ./scripts/check-secrets.sh

format:
	@gofmt -w .

run:
	@go run ./src/

build:
	@mkdir -p bin
	@go build -o $(BIN) ./src/

clean:
	@rm -rf bin/
