
---

## Stack-Regeln: Go

Diese Regeln gelten zusätzlich zu den allgemeinen Code-Regeln oben.
Sie sind bewusst prinzipbasiert formuliert — unabhängig von Go-Minor-Versionen.

### Struktur: Folge was bereits da ist

- `src/` für Quellcode — nicht reorganisieren
- Paket-Namen kurz, lowercase, kein Unterstrich (`userstore`, nicht `user_store`)
- Eine Datei pro fachliche Einheit — keine Mega-Dateien mit 500+ Zeilen
- Build-Artefakte landen in `bin/` — niemals im Root oder in `src/`

### Fehlerbehandlung

- Fehler immer explizit behandeln — kein `_` für Error-Returns bei wichtigen Operationen
- Kein `panic()` in Bibliothekscode — nur in `main()` bei wirklich nicht behebbaren Fehlern
- Fehlermeldungen lowercase, kein Punkt am Ende (Go-Konvention)

### Interfaces und Typen

- Interfaces klein halten — lieber mehrere kleine als eine große
- Interface-Namen enden auf `-er` wenn sie eine einzelne Aktion beschreiben (`Reader`, `Writer`)
- Kein Interface definieren wenn es nur einen konkreten Typ gibt — erst bei Bedarf

### Concurrency

- Goroutines nur wenn Parallelität wirklich nötig ist — nicht als Default
- Channels explizit schließen wenn der Sender fertig ist
- Race-Conditions mit `go test -race ./...` prüfen

### Abhängigkeiten

- Nach jedem neuen Import `go mod tidy` ausführen
- Keine `vendor/` ohne expliziten Grund
- Externe Packages sparsam einsetzen — Go-Standardbibliothek ist sehr vollständig

### Tests

- Test-Dateien direkt neben dem getesteten Code (`dateiname_test.go`)
- Table-driven Tests für Funktionen mit mehreren Input/Output-Kombinationen
- Kein globaler State in Tests — jeder Test läuft isoliert
