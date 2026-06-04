# Runbook

Schlankes Solo-Runbook fuer Betrieb, Fehlerbehebung und schnelle Orientierung.

## Systemueberblick

- Anwendung:
- Hauptzweck:
- Primaerer Stack:
- Deployment-Ziel:
- wichtigste externen Systeme:

## Wichtige Zugaenge

- Produktions-URL:
- Hosting:
- Datenbank:
- Auth:
- Logs:
- Monitoring:
- Incident-Kanal:

## Standardbefehle

- lokal starten:
- Tests ausfuehren:
- Build:
- Deployment:
- Rollback:

## Erste Hilfe fuer Anfaenger

### make precommit schlaegt fehl

Einzelne Checks isoliert ausfuehren um den Fehler einzugrenzen:

```bash
make lint       # Zeigt welche Zeile einen Stil-Fehler hat
make test       # Zeigt welcher Test fehlschlaegt und warum
make security   # Zeigt ob ein Secret oder unsicheres Muster gefunden wurde
```

Fehlermeldung lesen, nur den genannten Punkt beheben, dann nochmal `make precommit`.

### Claude hat zu viel geaendert

```bash
git diff                          # Zeigt alle ungespeicherten Aenderungen
git checkout -- pfad/zur/datei    # Setzt eine einzelne Datei zurueck
git checkout -- .                 # Setzt ALLE Aenderungen zurueck (Vorsicht!)
```

Tipp: Erst `git diff` lesen, dann gezielt einzelne Dateien zuruecksetzen – nicht alles auf einmal.

### Ich verstehe nicht mehr was passiert ist

```bash
git log --oneline -10             # Letzte 10 Commits als Uebersicht
git show abc1234                  # Was hat dieser Commit geaendert?
git diff HEAD~1                   # Unterschied zum letzten Commit
```

Dann Claude fragen: *"Erklaere mir was in `src/datei.ts` Zeile 42-58 passiert, ohne etwas zu aendern."*

### Das Projekt startet nicht

```bash
make clean      # Temporaere Dateien loeschen
make dev        # Neu starten
```

Falls noch immer kaputt: `git log --oneline -5` anschauen was zuletzt geaendert wurde, dann den letzten Commit rueckgaengig machen:

```bash
git revert HEAD   # Macht den letzten Commit rueckgaengig (sicher, kein Datenverlust)
```

### Ein Secret wurde versehentlich committed

```bash
git log --oneline -5              # Commit-Hash des betroffenen Commits notieren
```

Dann sofort:
1. Das Secret (API-Key, Passwort) beim Anbieter widerrufen und neu generieren
2. Den neuen Wert in `.env` eintragen (nie in den Code!)
3. Claude fragen: *"Hilf mir den Commit `abc1234` rueckgaengig zu machen ohne weitere Commits zu beschaedigen."*

### make check meldet fehlende Dateien

```bash
make check    # Zeigt welche Dateien fehlen
```

Fehlende Datei aus dem Template kopieren, z. B.:

```bash
cp templates/feature-spec.md features/PROJ-1-mein-feature.md
cp templates/status.md docs/STATUS.md
```

## Typische Stoerungen

### App startet nicht

- Logs pruefen
- Environment-Variablen pruefen
- letzte Aenderungen oder Deployments pruefen

### Login oder Auth kaputt

- Auth-Provider oder Session-Konfiguration pruefen
- Redirects, Cookies oder Token-Gueltigkeit pruefen
- betroffene Nutzer und Scope eingrenzen

### Daten fehlen oder sind falsch

- betroffene Tabellen oder APIs eingrenzen
- Migrationsstand pruefen
- Loesch- oder Synchronisationsjobs pruefen

### Externer Dienst ausgefallen

- Vendor-Status pruefen
- Fallback oder degradierter Modus dokumentieren
- Auswirkungen auf Nutzer und Datenfluss pruefen

## Rollback

- letzter stabiler Stand:
- technischer Rollback-Weg:
- Datenbank-Risiken:
- manuelle Nacharbeiten:

## Nachbearbeitung

- Ursache dokumentieren
- Schutzmassnahme oder Test nachziehen
- falls relevant `docs/decision-log.md` aktualisieren
