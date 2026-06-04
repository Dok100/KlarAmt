# Stack Guide

Diese Datei hilft bei der Wahl eines sinnvollen Start-Stacks fuer neue Projekte im Claude-Framework.

## Was ist ein Stack

Ein Stack ist die Kombination der wichtigsten Technologien eines Projekts, typischerweise:

- Programmiersprache
- Framework
- Laufzeitumgebung
- Datenbank
- Hosting oder Deployment
- Build-, Test- und Entwicklungswerkzeuge

Der Stack beeinflusst, wie schnell ein Projekt startet, wie gut es skaliert und wie leicht es weiterentwickelt werden kann.

## Schnelle Entscheidungsregel

- Wenn das Projekt eine starke Browser-Oberflaeche braucht: `nextjs`
- Wenn APIs, Automatisierung, Daten oder AI im Vordergrund stehen: `python`
- Wenn ein schlankes Backend im JavaScript-Umfeld gebraucht wird: `node-api`
- Wenn du eine native Mac-App in Swift bauen willst: `swift-macos`
- Wenn die Entscheidung noch offen ist: `generic`

## Profile im Framework

### `generic`

Gut fuer:

- unklare oder noch offene technische Richtung
- sehr fruehe Produktfindung
- Projekte, bei denen zuerst Anforderungen vor Technik kommen sollen

Staerken:

- maximale Offenheit
- kein frueher Tooling-Lock-in

Grenzen:

- keine konkreten Stack-Hinweise ausser Grundstruktur

### `nextjs`

Gut fuer:

- Web-Apps
- SaaS-Produkte
- Dashboards
- Kundenportale
- Marketingseiten mit App-Anteil

Staerken:

- sehr gut fuer UI-lastige Produkte
- starkes TypeScript- und React-Oekosystem
- gute Preview- und Deploy-Workflows mit Vercel

Grenzen:

- fuer kleine Tools manchmal zu schwer
- nicht die beste Wahl, wenn fast nur Backend- oder Datenlogik noetig ist

Vorbereitet durch Bootstrap:

- `package.json`
- `src/app/`
- Next.js-Konfiguration
- Node-basierte CI
- ESLint, TypeScript-Pruefung, Vitest und `npm audit`

### `python`

Gut fuer:

- interne Tools
- Automatisierung
- Datenverarbeitung
- AI-nahe Anwendungen
- APIs mit viel Business-Logik

Staerken:

- sehr hohe Produktivitaet
- starkes Oekosystem fuer Daten, Integrationen und AI
- gut fuer FastAPI, Skripte und Services

Grenzen:

- fuer komplexe Browser-UIs meist zusaetzliches Frontend noetig

Vorbereitet durch Bootstrap:

- `pyproject.toml`
- `requirements-dev.txt`
- `src/app.py`
- `tests/test_smoke.py`
- Python-CI
- Ruff, Pytest, Bandit und `pip-audit`

### `node-api`

Gut fuer:

- APIs
- Backends fuer Webprojekte
- Integrationen
- leichte Services im TypeScript-Umfeld

Staerken:

- durchgaengig JavaScript oder TypeScript
- schneller Einstieg fuer Webteams
- gut fuer Fastify oder Express

Grenzen:

- bei wachsender Komplexitaet braucht die Codebasis frueh klare Struktur

Vorbereitet durch Bootstrap:

- `package.json`
- `src/index.js`
- `tests/health.test.js`
- Node-basierte CI
- ESLint, Node-Tests und `npm audit`

### `go`

Gut fuer:

- performante APIs
- Infrastruktur-Tools
- robuste Hintergrunddienste

Staerken:

- einfache Deployments
- gute Performance
- klare, reduzierte Sprache

Grenzen:

- weniger geeignet fuer schnelle UI-Produktiteration
- weniger bequem fuer datenlastige oder AI-nahe Workflows als Python

### `swift-macos`

Gut fuer:

- native macOS-Apps
- interne Tools fuer den Mac
- Desktop-Produkte mit tiefer Betriebssystem-Integration
- SwiftUI- oder AppKit-nahe Anwendungen

Staerken:

- nativer Look and Feel
- gute Integration mit macOS-APIs
- starke Story fuer lokale Desktop-Workflows

Grenzen:

- Xcode, Signierung und Notarisierung machen den Release-Prozess komplexer
- CI braucht macOS-Runner
- Sandbox und Entitlements muessen frueh bewusst geplant werden

Vorbereitet durch Bootstrap:

- SwiftUI-Starter unter `Sources/App/`
- `project.yml` fuer XcodeGen
- `xcodebuild`-basierte Makefile-Targets
- macOS-CI und CodeQL
- Basischecks fuer Sandbox und hardcoded Secrets

## Empfehlung nach Projektart

| Projektart | Empfehlung |
| --- | --- |
| Landingpage oder Website | `nextjs` |
| SaaS, Dashboard, Web-App | `nextjs` |
| internes Tool | `python` oder `nextjs` |
| API oder Integrationsservice | `node-api` oder `python` |
| Daten- oder AI-Workflow | `python` |
| native macOS-App | `swift-macos` |
| performanter technischer Service | `go` |
| Richtung noch offen | `generic` |

## Praktische Standardempfehlung

Wenn keine harte Vorgabe existiert:

- fuer Produkte mit Benutzeroberflaeche: `nextjs`
- fuer Automatisierung, Daten und AI: `python`
- fuer reine APIs im JS-Umfeld: `node-api`
- fuer native Mac-Apps: `swift-macos`

## Naechster Schritt

Lege den Stack spaetestens in `docs/architecture.md` fest und richte danach `Makefile`, Tests und CI konsequent auf diesen Stack aus.
