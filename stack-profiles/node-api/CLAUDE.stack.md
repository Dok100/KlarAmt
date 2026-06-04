
---

## Stack-Regeln: Node API

Diese Regeln gelten zusätzlich zu den allgemeinen Code-Regeln oben.
Sie sind bewusst prinzipbasiert formuliert — unabhängig vom genutzten Framework.

### Sicherheits-Header (nicht entfernen!)

- Die konfigurierten Security-Header in `src/server.js` bleiben immer vollständig erhalten
- CORS nur so weit öffnen wie zwingend nötig — niemals Wildcard `*` in Produktion
- Neue Endpunkte erhalten dieselben Header wie bestehende

### API-Struktur

- Input-Validierung an jedem Endpunkt am Eingang — vor jeder Verarbeitung
- Einheitliches Fehler-Response-Format verwenden: was im Projekt bereits existiert, weiterführen
- Keine synchronen Datei-Operationen in Request-Handlern (`fs.readFileSync` etc.)
- Routing-Logik in eigene Handler-Dateien auslagern — nicht alles in einer Datei

### Umgebungsvariablen

- Port immer aus `process.env.PORT` lesen (Fallback: 3000)
- Alle genutzten Variablen in `.env.example` dokumentieren (ohne echten Wert)
- Keine Secrets direkt im Code

### Projektstruktur: Folge was bereits da ist

- Neue Endpunkte dort anlegen wo gleichartige Endpunkte liegen
- Kein zweites Framework einführen wenn bereits eines im Projekt ist
- Dependencies nur ergänzen wenn sie wirklich fehlen — kein Doppeln
