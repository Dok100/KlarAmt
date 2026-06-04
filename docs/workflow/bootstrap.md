# Bootstrap

Der Befehl `make bootstrap` initialisiert ein frisch kopiertes Projekt.

## Was passiert

1. Fehlende Standardordner werden angelegt.
2. Falls vorhanden, wird ein passendes Stack-Profil in das Projekt kopiert.
3. `.env` wird aus `.env.example` erzeugt, falls noch keine `.env` existiert.
4. Der Projektname wird gesetzt oder interaktiv abgefragt.
5. Der Stack wird gesetzt oder interaktiv abgefragt.
6. Der Setup-Assistent fragt weitere Basisdaten wie Kurzbeschreibung, Nutzer, Deployment-Ziel, Sichtbarkeit, Datenschutzrelevanz, Security-Kontakt und erstes Feature ab.
7. Platzhalter in den wichtigsten Dateien werden ersetzt und in `README.md`, `docs/brief.md`, `docs/architecture.md`, `SECURITY.md` und `features/` eingetragen.
8. Git wird initialisiert, falls noch kein Repository existiert.
9. Ein Pre-Commit-Hook fuer Secret- und Basischecks wird installiert.
10. Eine Strukturpruefung und eine Start-Checkliste werden ausgegeben.
11. Es werden die naechsten Schritte fuer den GitHub-Publish genannt.

## Nicht-interaktive Nutzung

```bash
make bootstrap PROJECT_NAME="Mein Projekt" STACK=nextjs
```

Optionale weitere Variablen:

- `PROJECT_SUMMARY`
- `PRIMARY_USERS`
- `DEPLOY_TARGET`
- `REPO_VISIBILITY`
- `PERSONAL_DATA_PROCESSING`
- `SECURITY_CONTACT`
- `FIRST_FEATURE_TITLE`

## Unterstuetzte Stack-Werte

- `generic`
- `nextjs`
- `node-api`
- `python`
- `swift-macos`
- `go`

## Entscheidungshilfe

Wenn der passende Stack noch unklar ist, nutze `docs/stack-guide.md` als kurze Auswahlhilfe und halte die Entscheidung anschliessend in `docs/architecture.md` fest.

## Profile mit konkreter Vorbereitung

- `nextjs`: legt `package.json`, App Router Grundgeruest, Next-Konfiguration und Node-CI an
- `node-api`: legt ein minimales API-Startgeruest mit `package.json`, Einstiegspunkt und Tests an
- `python`: legt `pyproject.toml`, Dev-Requirements, App-Datei, Tests und Python-CI an
- `swift-macos`: legt ein SwiftUI-Startgeruest, `project.yml` fuer XcodeGen, macOS-CI und Basis-Sicherheitschecks an
- `generic` und `go`: geben aktuell nur Leitplanken und naechste Schritte aus

## GitHub

Das Bootstrap erzeugt kein Repository auf GitHub. Es initialisiert nur lokales Git und verweist anschliessend auf `docs/workflow/github-publish.md`.
