# <PROJECT_NAME> — Claude Code Arbeitsanleitung

> Dieses Dokument ist die Arbeitsgrundlage für Claude Code in diesem Projekt.
> Es wird bei `make bootstrap` automatisch mit Projektdaten befüllt.
> **Claude darf diese Datei nicht selbstständig ändern.**

---

## Pflicht-Lektüre zu Beginn jeder Session

Claude muss diese Dateien lesen, **bevor** irgendeine Änderung gemacht wird:

1. `CLAUDE.md` — diese Datei (Regeln und Workflow)
2. `docs/brief.md` — was das Produkt macht und für wen
3. `docs/STATUS.md` — aktueller Stand, offene Punkte, letzte Entscheidungen
4. `features/INDEX.md` — welche Features geplant / in Arbeit / fertig sind

Bestätige nach dem Lesen in einem Satz was das Projekt macht, bevor du anfängst.

---

## Projekt-Übersicht

| Feld | Wert |
|------|------|
| **Name** | <PROJECT_NAME> |
| **Stack** | <STACK> |
| **Deployment** | <DEPLOY_TARGET> |
| **Zusammenfassung** | <PROJECT_SUMMARY> |
| **Nutzer** | <PRIMARY_USERS> |

---
## Kommunikationssprache

Claude antwortet immer auf **Deutsch** – auch wenn Fehlermeldungen,
Dokumentation oder Code-Kommentare auf Englisch sind.
Ausnahme: Code-Bezeichner, Commit-Messages und API-Namen bleiben Englisch.
---
## Nutzer-Kontext

| Feld | Wert |
|------|------|
| **Erfahrung mit <STACK>** | <ERFAHRUNGSLEVEL: Anfänger / Fortgeschritten / Experte> |
| **Was erklärt werden soll** | <z.B. Swift Actors, async/await, macOS-APIs> |
| **Was nicht erklärt werden muss** | <z.B. Git, Projektstruktur, Terminal> |
| **Bevorzugter Arbeitsstil** | Plan zuerst besprechen, dann implementieren |
---
## Alle Befehle erklärt

### Einmalig (Projekt initialisieren)

```bash
make bootstrap
```
Erstellt Ordner, befüllt Platzhalter, legt `.env` an, initialisiert Git und installiert Pre-commit Hooks. Nur beim allerersten Start eines neuen Projekts ausführen.

### Täglich

```bash
make dev          # Startet den lokalen Entwicklungsserver (Browser öffnen und testen)
make test         # Führt alle automatischen Tests aus
make check        # Prüft ob die Projektstruktur vollständig ist
make precommit    # Führt ALLE Prüfungen aus — IMMER vor dem Speichern (git commit) ausführen
```

### Code-Qualität

```bash
make lint         # Findet Stil-Fehler und unsauberen Code
make format       # Formatiert Code automatisch korrekt
make security     # Scannt nach Sicherheitsproblemen (Secrets, unsichere Muster)
```

### Aufräumen

```bash
make clean        # Löscht Build-Dateien und temporäre Ordner (node_modules, .next, etc.)
```

---

## Schritt-für-Schritt: Neues Projekt von Null aufsetzen

### Phase 1 — Framework kopieren und initialisieren

**1.** Neuen Projektordner anlegen und Framework hineinkopieren:
```bash
cp -r /pfad/zum/Projekt-Framework /pfad/zum/mein-projekt
cd /pfad/zum/mein-projekt
```

**2.** Bootstrap ausführen und die Fragen beantworten:
```bash
make bootstrap
```
Gefragt wird nach: Projektname, Stack (generic / nextjs / node-api / python / swift-macos), Kurzbeschreibung, Zielgruppe, Deployment-Ziel, Repository-Sichtbarkeit, Datenschutz-Relevanz, Security-Kontakt, erstes Feature.

**3.** Nach dem Bootstrap diese beiden Dateien öffnen und alle Platzhalter ausfüllen:
- `docs/brief.md` — Was macht das Produkt? Für wen? Was gehört ausdrücklich NICHT dazu? Was sind die Erfolgskriterien?
- `docs/architecture.md` — Welche Technologie? Wo wird deployed? Welche Daten werden verarbeitet?

### Phase 2 — Erstes Feature definieren

**4.** Vorlage kopieren und ausfüllen:
```bash
cp templates/feature-spec.md features/PROJ-1-mein-erstes-feature.md
```
Pflichtabschnitte: Ziel, Nutzerproblem, Scope (was gehört dazu), Out-of-scope (was nicht), Akzeptanzkriterien, Edge Cases.

**5.** Feature in der Übersicht eintragen — `features/INDEX.md` öffnen und eine Zeile hinzufügen.

### Phase 3 — Status-Datei anlegen

**6.** `docs/STATUS.md` anlegen:
```bash
cp templates/status.md docs/STATUS.md
```
Eintragen: aktueller Stand, was als nächstes kommt, offene Fragen.

### Phase 4 — Ersten Commit machen

**7.** Alles prüfen und speichern:
```bash
make precommit
git add docs/ features/ CLAUDE.md README.md
git commit -m "chore: Projektstruktur initialisiert"
```

### Phase 5 — Claude beauftragen (Startprompt)

**8.** Claude mit diesem Prompt starten (Template am Ende dieser Datei):
```
Lies CLAUDE.md, docs/brief.md, docs/STATUS.md und features/INDEX.md.
Bestätige in einem Satz was das Projekt macht.
Dann implementiere Feature PROJ-1 aus features/PROJ-1-[name].md.
```

---

## Feature-Workflow: Von der Idee zum fertigen Code

### Schritt 1 — Feature definieren (du, ohne Claude)

1. `templates/feature-spec.md` nach `features/PROJ-X-name.md` kopieren
2. Alle Pflichtabschnitte ausfüllen:
   - **Ziel:** Was kann der Nutzer danach, was vorher nicht?
   - **Nutzerproblem:** Welches konkrete Problem wird gelöst?
   - **Scope:** Was gehört explizit dazu?
   - **Out-of-scope:** Was gehört explizit NICHT dazu? (sehr wichtig!)
   - **Akzeptanzkriterien:** Wie weißt du dass es fertig ist?
   - **Edge Cases:** Was kann schiefgehen?
3. In `features/INDEX.md` eintragen (Status: Planned)

### Schritt 2 — Claude beauftragen

Gib Claude diesen Prompt (anpassen):
```
Lies CLAUDE.md und features/PROJ-X-name.md.
Implementiere das beschriebene Feature.
Ändere nur Dateien die direkt für dieses Feature nötig sind.
Frag nach, bevor du neue Packages installierst oder Dateien außerhalb der normalen Struktur anlegst.
```

### Schritt 3 — Claudes Arbeit prüfen

Bevor du Änderungen akzeptierst:
- Hat Claude mehr gemacht als beauftragt? → Extra-Änderungen zurücksetzen (`git checkout -- datei`)
- Laufen die Tests? (`make test`)
- Gibt es neue Dateien die nicht im Feature-Spec stehen?
- Wurden neue Packages hinzugefügt ohne Rückfrage?

### Schritt 4 — Commit

```bash
make precommit          # IMMER zuerst ausführen!
git add [nur die geänderten Dateien]
git commit -m "feat: kurze Beschreibung"
```

### Schritt 5 — Status aktualisieren

`docs/STATUS.md` aktualisieren: Feature auf "Done" setzen, nächstes Feature oder offene Punkte notieren.

---

## Planmodus — erst planen, dann coden

Claude Code hat einen eingebauten Planmodus: Claude legt einen vollständigen Implementierungsplan vor und **wartet auf deine Freigabe** bevor auch nur eine Datei angefasst wird.

### Wann nutzen

- Vor jedem Feature das mehr als 2–3 Dateien betrifft
- Vor Refactoring-Arbeiten
- Wenn du dir unsicher bist was Claude konkret tun wird
- Bei allem was schwer rückgängig zu machen wäre

### Wie aktivieren

**Option A — Tastenkürzel (empfohlen):**
Shift+Tab drücken während du deinen Prompt schreibst → Claude wechselt automatisch in den Planmodus und zeigt einen Plan bevor er anfängt.

**Option B — In deinem Prompt explizit anfordern:**
```
Erstelle zuerst einen Plan für Feature PROJ-2.
Zeige mir was du ändern würdest und warte auf meine Freigabe bevor du anfängst.
```

**Option C — Nur den Plan sehen, noch gar nichts coden:**
```
Was würdest du für Feature PROJ-2 ändern?
Zeig mir nur die betroffenen Dateien und deine Vorgehensweise — noch keinen Code.
```

### Was im Planmodus passiert

- Claude ändert keine Dateien
- Du siehst welche Dateien betroffen wären und was konkret gemacht würde
- Du kannst den Plan anpassen, ablehnen oder freigeben
- Erst nach deiner Freigabe beginnt die Umsetzung

---

## Code-Regeln — Das sind Gesetze, keine Vorschläge

Diese Regeln gelten für Claude bei **jeder** Änderung in diesem Projekt.

### Muss-Regeln (Pflicht)

| # | Regel |
|---|-------|
| 1 | **Erst lesen, dann coden** — Vor jeder Änderung alle betroffenen Dateien lesen |
| 2 | **Minimal-Prinzip** — Nur den Code schreiben der für den Task nötig ist, nichts mehr |
| 3 | **Bestehende Muster nutzen** — Wenn in der Codebase ein Muster existiert, dieses nutzen, kein neues erfinden |
| 4 | **Tests grün halten** — Nach jeder Änderung müssen alle Tests bestehen |
| 5 | **make precommit muss bestehen** — Kein Commit ohne grüne Prüfung |
| 6 | **Eine Sache pro Commit** — Feature, Bugfix und Refactoring immer in getrennten Commits |
| 7 | **Maximal 5 Dateien pro Task** — Wenn mehr Dateien nötig sind, ist der Task zu groß — aufteilen |

### Verbots-Regeln (Niemals)

| # | Verbot |
|---|--------|
| 1 | **Keine neuen Abstraktionen** ohne expliziten Auftrag — kein "Ich mach das mal generischer" |
| 2 | **Keine neuen Packages/Dependencies** ohne Rückfrage — immer erst fragen |
| 3 | **Kein Cleanup außerhalb des Task-Bereichs** — anderen Code der "verbesserbar" wäre ignorieren |
| 4 | **Keine Kommentare die erklären WAS der Code tut** — Variablen- und Funktionsnamen sollen selbst erklärend sein |
| 5 | **Kein Error-Handling für Fälle die nicht eintreten können** — nur an System-Grenzen (User-Input, externe APIs) |
| 6 | **Keine TODO-Kommentare im Code** — Offene Punkte gehören in `docs/STATUS.md` |
| 7 | **Keine Backwards-Compatibility-Hacks** — Wenn etwas geändert wird, wird es vollständig geändert |
| 8 | **Keine Emojis im Swift/JS/Python-Code oder in Commit-Nachrichten — in Markdown-Dokumenten sparsam erlaubt** |

### Kommentar-Regel

Kommentare nur dann wenn das **WARUM** nicht offensichtlich ist:
- Versteckter Constraint (z.B. "API akzeptiert max. 100 Einträge")
- Workaround für einen bekannten Bug
- Nicht-offensichtliche Invariante

Kein Kommentar der erklärt was der Code tut — dafür sind Variablennamen da.

---

## Git-Workflow

### Branch-Strategie

```
main                    ← Immer lauffähiger, getesteter Code
feature/PROJ-X-name     ← Ein Branch pro Feature
fix/kurze-beschreibung  ← Für Bugfixes
```

**Niemals direkt auf `main` committen.**

### Neues Feature starten

```bash
git checkout -b feature/PROJ-1-login-seite
```

### Während der Arbeit speichern

```bash
make precommit                          # Prüfungen laufen
git add src/app/login/ tests/login/     # Nur betroffene Dateien hinzufügen
git commit -m "feat(auth): Login-Formular mit E-Mail-Validierung"
```

### Feature fertigstellen

```bash
git checkout main
git merge feature/PROJ-1-login-seite
git branch -d feature/PROJ-1-login-seite   # Aufgeräumten Branch löschen
```

### Auf GitHub veröffentlichen

```bash
# Einmalig Repository auf GitHub anlegen:
gh repo create <PROJECT_NAME> --private --source=. --push

# Danach für jeden Push:
git push origin main
```

### Commit-Nachrichten Format

```
typ(bereich): kurze Beschreibung in Kleinbuchstaben
```

Typen:
- `feat` — neues Feature
- `fix` — Bugfix
- `chore` — Maintenance (Dependencies, Konfiguration)
- `docs` — Nur Dokumentation geändert
- `test` — Nur Tests geändert
- `refactor` — Code-Umbau ohne Verhaltensänderung

Beispiele:
```
feat(auth): Login mit E-Mail und Passwort implementiert
fix(api): 404-Fehler bei ungültiger User-ID behoben
chore: ESLint-Konfiguration aktualisiert
docs: Setup-Anleitung in README ergänzt
test(api): Tests für Health-Endpoint hinzugefügt
```

---

## Dateistruktur (Was gehört wohin)

```
<PROJECT_NAME>/
├── CLAUDE.md               ← Diese Datei (Claude's Arbeitsanleitung)
├── AGENTS.md               ← Ergänzende Verhaltensregeln für Claude
├── docs/
│   ├── brief.md            ← Produkt-Brief: WAS und FÜR WEN (wichtig!)
│   ├── architecture.md     ← Technische Entscheidungen
│   ├── STATUS.md           ← Aktueller Stand (nach jeder Session aktualisieren!)
│   ├── decision-log.md     ← Warum wurden wichtige Entscheidungen so getroffen?
│   ├── security-baseline.md← Was ist schon abgesichert?
│   └── privacy/            ← DSGVO-relevante Dokumentation
├── features/
│   ├── INDEX.md            ← Übersicht aller Features mit Status
│   └── PROJ-X-name.md      ← Eine Datei pro Feature (aus template/feature-spec.md)
├── templates/
│   ├── feature-spec.md     ← Vorlage für neue Feature-Dateien
│   ├── task-brief.md       ← Vorlage für einzelne Task-Aufträge an Claude
│   └── status.md           ← Vorlage für docs/STATUS.md
├── src/                    ← Der eigentliche Code (Stack-abhängig)
├── tests/                  ← Tests (immer neben dem Code oder hier)
├── scripts/                ← Automatisierungs-Skripte (nicht verändern!)
├── .env                    ← Geheime Konfiguration (NIEMALS committen!)
└── .env.example            ← Öffentliche Vorlage für .env (ohne echte Werte)
```

**Neue Dateien nur in diesen Ordnern anlegen.** Keine Dateien im Root außer Konfigurationsdateien.

---

## Session-Kontinuität

### Am Ende jeder Session

`docs/STATUS.md` aktualisieren mit:
- Was wurde fertig gestellt?
- Was ist noch in Arbeit (mit Dateinamen)?
- Welche Entscheidungen wurden getroffen?
- Was kommt als nächstes?
- Gibt es Blockaden oder offene Fragen?

### Am Anfang einer neuen Session

Claude mit diesem Einstieg starten:
```
Lies CLAUDE.md und docs/STATUS.md um dich zu orientieren.
[Danach dein eigentlicher Auftrag]
```

---

## Wenn etwas schiefläuft

### `make precommit` schlägt fehl

```bash
make lint       # Zeigt genau welche Zeile einen Stil-Fehler hat
make test       # Zeigt welcher Test fehlschlägt und warum
make security   # Zeigt Security-Probleme (z.B. versehentlich committed Secret)
```
Fehler lesen, beheben, dann nochmal `make precommit`.

### Claudes Änderungen waren zu viel oder falsch

```bash
git diff                        # Zeigt was geändert wurde (vor dem Commit)
git checkout -- pfad/datei.ts   # Setzt eine einzelne Datei zurück
git checkout -- .               # Setzt ALLE ungespeicherten Änderungen zurück (Vorsicht!)
```

### Ich verstehe nicht mehr was passiert ist

```bash
git log --oneline -10           # Letzte 10 Commits als Übersicht
git show abc1234                # Zeigt was in einem bestimmten Commit geändert wurde
git diff HEAD~1                 # Vergleicht aktuellen Stand mit dem letzten Commit
```
Dann Claude fragen: *"Erkläre mir was in `src/app/login.tsx` in Zeile 42–58 passiert, ohne etwas zu ändern."*

### Ein Test läuft nicht mehr

```bash
make test
# Fehlermeldung kopieren und Claude geben:
# "Dieser Test schlägt fehl. Erkläre warum und behebe nur den Fehler."
```

### Das Projekt startet nicht mehr

```bash
make clean      # Temporäre Dateien löschen
make dev        # Neu starten
# Falls noch immer kaputt: git log anschauen was zuletzt geändert wurde
```

---

## Sicherheits-Checkliste (vor jedem Push)

- [ ] `make precommit` ist grün durchgelaufen
- [ ] Keine echten Passwörter, API-Keys oder Tokens im Code
- [ ] `.env` ist in `.gitignore` und erscheint nicht in `git status`
- [ ] Neue Dependencies wurden kurz auf Vertrauenswürdigkeit geprüft (npm/pypi Seite anschauen)
- [ ] Keine persönlichen Daten in Test-Fixtures oder Beispieldaten

---

## Startprompt — Kopiervorlage für neue Sessions

### Startprompt A: Erstes Feature nach Bootstrap

```
Lies bitte diese Dateien in dieser Reihenfolge:
1. CLAUDE.md
2. docs/brief.md
3. docs/STATUS.md
4. features/INDEX.md
5. features/PROJ-1-[name].md

Bestätige danach in einem Satz was das Projekt macht und für wen.

Dann implementiere Feature PROJ-1 aus features/PROJ-1-[name].md.
Halte dich strikt an die Code-Regeln in CLAUDE.md.
Frage nach bevor du neue Packages installierst oder Dateien außerhalb der normalen Struktur anlegst.
```

### Startprompt B: Weiterarbeiten nach Pause

```
Lies CLAUDE.md und docs/STATUS.md um dich zu orientieren.

[Dann dein Auftrag, z.B.:]
Implementiere Feature PROJ-2 aus features/PROJ-2-[name].md.
```

### Startprompt C: Neues Projekt von einer Programmbeschreibung

```
Ich möchte ein neues Projekt mit diesem Vibe-Coding-Framework aufsetzen.

Lies zuerst:
1. CLAUDE.md
2. docs/brief.md (noch leer / nur Platzhalter)
3. features/INDEX.md

Meine Programmbeschreibung:
[HIER DEINE BESCHREIBUNG: Was soll die App machen? Für wen? Auf welchem Gerät?]

Mache folgendes:
1. Fülle docs/brief.md aus (Hintergrund, Nutzer, Zielzustand, MVP-Scope, Out-of-scope, Erfolgskriterien)
2. Definiere das erste Feature in features/PROJ-1-[sinnvoller-name].md basierend auf deiner Einschätzung was das Kern-Feature ist
3. Trage es in features/INDEX.md ein
4. Lege docs/STATUS.md an mit: "Projektstruktur initialisiert. PROJ-1 definiert. Als nächstes: Implementierung von PROJ-1."
5. Frag mich ob die Beschreibungen passen bevor du anfängst zu coden

Halte dich an die Code-Regeln in CLAUDE.md.
```

---

## Meta: Pflege dieser Datei

- **Claude darf CLAUDE.md nicht selbstständig ändern**
- Nur du als Projektinhaber änderst diese Datei
- Wenn Claude eine Ergänzung vorschlägt, prüfe sie und entscheide selbst
- Wenn eine Regel sich im Projekt als unpraktisch erweist, ändere sie hier und teste ob es besser wird
- `docs/STATUS.md` wird von Claude aktualisiert — CLAUDE.md nicht
