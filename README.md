# <PROJECT_NAME>

<PROJECT_SUMMARY>

## Zweck

Dieses Framework trennt vier Dinge sauber:

- Produkt- und Feature-Definition
- technische Entscheidungen
- Claude-Arbeitsregeln
- projektspezifische Implementierung

Es ist fuer neue Projekte gedacht, bei denen Claude nicht nur Code erzeugen, sondern entlang eines klaren Arbeitsprozesses arbeiten soll.

## Kernidee

Claude arbeitet nicht direkt auf vagen Ideen, sondern auf kleinen, pruefbaren Artefakten:

1. `docs/brief.md` beschreibt Ziel, Nutzer und Scope.
2. `features/INDEX.md` listet Features und Status.
3. Jedes Feature hat eine eigene Spezifikation in `features/`.
4. `docs/architecture.md` haelt die technischen Leitplanken fest.
5. `AGENTS.md` und `docs/workflow/` steuern die Arbeitsweise von Claude.

## Schnellstart

1. Diese Vorlage kopieren oder als neues Repository verwenden.
2. `make bootstrap` ausfuehren.
3. Feature-Ideen in `docs/brief.md` und `features/INDEX.md` eintragen.
4. Das erste Feature anhand von `templates/feature-spec.md` ausformulieren.
5. Claude mit Verweis auf das Feature implementieren lassen.

Optional:

- `make bootstrap PROJECT_NAME="Mein Projekt"` fuer nicht-interaktive Benennung
- `make bootstrap STACK=nextjs` fuer vorbereitete Stack-Hinweise
- Stack-Wahl siehe `docs/stack-guide.md`
- sparsamer Claude-Einsatz siehe `docs/workflow/token-efficiency.md`
- Agenten nur gezielt nach `docs/workflow/agent-strategy.md`
- GitHub-Publish siehe `docs/workflow/github-publish.md`

## Schnellstart mit GitHub CLI

Typischer Solo-Startfall mit lokalem Setup und direktem Publish nach GitHub:

```bash
cp -R Claude-Projekt-Framework MeinProjekt
cd MeinProjekt
make bootstrap PROJECT_NAME="Mein Projekt" STACK=nextjs
make install
make precommit
git add .
git commit -m "Initiales Projekt-Setup"
gh repo create mein-projekt --private --source=. --remote=origin --push
```

Hinweise:

- vorab einmal `gh auth login` ausfuehren
- `STACK=nextjs` bei Bedarf durch `python`, `node-api` oder `generic` ersetzen
- fuer ein oeffentliches Repository `--private` durch `--public` ersetzen

## Projektstruktur

```text
.
|-- .github/workflows/        # Basis-CI
|-- assets/                   # Bilder, Rohmaterial
|-- config/                   # Projektkonfiguration
|-- docs/
|   |-- workflow/             # Claude-Arbeitsprozess
|   |-- architecture.md       # technische Leitplanken
|   |-- brief.md              # Produktbriefing
|   |-- data-classification.md # Schutzklassen fuer Daten
|   |-- privacy/              # Datenschutz- und DSGVO-Artefakte
|   |-- release-checklist.md  # schlanke Solo-Release-Pruefung
|   |-- runbook.md            # Betrieb und Fehlerbehebung
|   `-- decision-log.md       # Architektur- und Produktentscheidungen
|-- features/
|   |-- INDEX.md              # Priorisierung und Status
|   `-- README.md             # Umgang mit Feature-Spezifikationen
|-- scripts/
|   `-- bootstrap.sh          # lokales Initialisieren
|-- templates/
|   |-- feature-spec.md       # Vorlage fuer Features
|   |-- task-brief.md         # Vorlage fuer einzelne Claude-Arbeitsauftraege
|   `-- pr-checklist.md       # Vorlage fuer Reviews und Releases
|-- tests/
|-- src/
|-- AGENTS.md                 # Claude-spezifische Regeln und Arbeitsmodus
|-- docs/security-baseline.md # Secrets-, Audit- und Hook-Basis
|-- SECURITY.md              # Responsible-Disclosure-Vorlage
|-- Makefile
`-- README.md
```

## Wann dieses Framework sinnvoll ist

- neue Produkte oder interne Tools mit mehreren Features
- Projekte, bei denen Anforderungen haeufig weiterentwickelt werden
- Arbeit mit Claude in wiederkehrenden Schleifen statt Einmal-Prompts
- kleine Teams, die nachvollziehbare Artefakte statt Chat-Historien brauchen

## Wann du es verschlanken solltest

- Landingpages oder Microsites
- Wegwerf-Prototypen
- einzelne Bugfixes in bestehenden Repositories

## Basisablauf

1. Briefing schaerfen
2. Feature klein schneiden
3. Architekturgrenzen festlegen
4. Task-brief an Claude geben
5. implementieren und pruefen
6. Erkenntnisse dokumentieren

## Anpassung

- `AGENTS.md` an Teamkonventionen anpassen
- `Makefile` auf den echten Stack mappen
- CI-Checks in `.github/workflows/ci.yml` erweitern
- `templates/` um projektspezifische Formate ergaenzen
- Stack-Auswahl mit `docs/stack-guide.md` absichern
- Security-Regeln mit `docs/security-baseline.md` aktiv nutzen
- Meldeprozess in `SECURITY.md` auf reale Kontakte anpassen
- Datenschutz-Doku in `docs/privacy/` fuellen, sobald echte Nutzerdaten verarbeitet werden
- Arbeitsauftraege mit `docs/workflow/token-efficiency.md` bewusst klein halten
- fuer Solo-Betrieb `docs/release-checklist.md` und `docs/runbook.md` frueh ausfuellen
- eigene Agenten erst nach echten Wiederholungsmustern einfuehren

## Definition of Ready

Ein neues Projekt ist mit diesem Framework startklar, wenn:

- `make bootstrap` gelaufen ist
- `README.md`, `AGENTS.md` und `docs/brief.md` angepasst sind
- der primaere Stack in `docs/architecture.md` festgelegt ist
- `make install` und `make precommit` erfolgreich laufen
- `SECURITY.md` und relevante Dateien in `docs/privacy/` bei Bedarf angepasst sind
- das erste echte Feature in `features/` beschrieben ist

## Projekt-Metadaten

- Projektname: `<PROJECT_NAME>`
- Primaerer Stack: `<STACK>`
- Primaere Nutzer: `<PRIMARY_USERS>`
- Deployment-Ziel: `<DEPLOY_TARGET>`
- Repository-Sichtbarkeit: `<REPO_VISIBILITY>`
- Personenbezogene Daten: `<PERSONAL_DATA_PROCESSING>`
