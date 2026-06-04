# Aufgabenliste — Claude Code Arbeitsanleitung

> Dieses Beispielprojekt zeigt wie ein fertig eingerichtetes Framework-Projekt aussieht.
> Alle Platzhalter sind bereits ausgefüllt. Dient als Referenz für neue Projekte.

---

## Pflicht-Lektüre zu Beginn jeder Session

1. `CLAUDE.md` — diese Datei
2. `docs/brief.md` — was das Produkt macht und für wen
3. `docs/STATUS.md` — aktueller Stand und offene Punkte
4. `features/INDEX.md` — Feature-Übersicht

---

## Projekt-Übersicht

| Feld | Wert |
|------|------|
| **Name** | Aufgabenliste |
| **Stack** | Python |
| **Deployment** | Lokal, kein Server |
| **Zusammenfassung** | CLI-Tool zum Verwalten persönlicher Aufgaben |
| **Nutzer** | Einzelperson, Eigengebrauch |

---

## Befehle

```bash
make dev          # Startet die App interaktiv
make test         # Führt alle Tests aus
make precommit    # Prüfungen vor jedem Commit
make lint         # Code-Stil prüfen
make format       # Code automatisch formatieren
```

---

## Planmodus — erst planen, dann coden

**Shift+Tab** beim Schreiben des Prompts → Claude zeigt Plan, wartet auf Freigabe.

Oder explizit:
```
Erstelle zuerst einen Plan für Feature PROJ-2.
Zeige mir was du ändern würdest und warte auf meine Freigabe.
```

---

## Code-Regeln

### Muss-Regeln
1. Erst lesen, dann coden — betroffene Dateien vor jeder Änderung lesen
2. Minimal-Prinzip — nur was für den Task nötig ist
3. Tests müssen grün bleiben
4. `make precommit` vor jedem Commit

### Verbote
1. Kein `any`-Äquivalent — Type Hints überall
2. Kein nacktes `except:` — immer expliziten Exception-Typ
3. Keine neuen Dependencies ohne Rückfrage
4. Maximal 5 Dateien pro Task

---

## Stack-Regeln: Python

- Immer im virtualenv arbeiten — niemals global `pip install`
- Type Hints für alle Funktions-Signaturen
- `pathlib.Path` statt String-Pfade
- Tests in `tests/`, Dateiname `test_*.py`
- Kein `print()` im Produktionscode — `logging` verwenden

---

## Git-Workflow

```bash
git checkout -b feature/PROJ-2-aufgabe-erledigen
make precommit
git add src/ tests/
git commit -m "feat: Aufgabe als erledigt markieren"
git checkout main
git merge feature/PROJ-2-aufgabe-erledigen
```

---

## Wenn etwas schiefläuft

```bash
git diff                          # Was wurde geändert?
git checkout -- pfad/zur/datei    # Einzelne Datei zurücksetzen
make test                         # Welcher Test schlägt fehl?
```

---

## Meta

Claude darf diese Datei nicht selbstständig ändern.
