
---

## Stack-Regeln: Python

Diese Regeln gelten zusätzlich zu den allgemeinen Code-Regeln oben.
Sie sind bewusst prinzipbasiert formuliert — unabhängig von Python-Minor-Versionen.

### Umgebung

- Immer im virtualenv arbeiten — niemals global `pip install` ausführen
- Neue Dependencies in `requirements-dev.txt` oder `pyproject.toml` eintragen, nicht nur installieren
- Python-Version nicht im Quellcode hardcoden — `.python-version` oder `pyproject.toml` nutzen

### Code-Qualität

- Type Hints für alle Funktions-Signaturen: Parameter und Return-Wert
- Kein nacktes `except:` — immer expliziten Exception-Typ angeben
- Konfiguration und Pfade nicht hardcoden — Umgebungsvariablen oder Konfigurationsobjekt
- `pathlib.Path` statt String-Pfade für Dateipfade
- Kein `print()` im Produktionscode — `logging` verwenden

### Tests

- Test-Dateien in `tests/` — Dateiname `test_*.py` pro Modul
- Keine echten Netzwerkaufrufe oder Datenbankzugriffe in Unit-Tests — Mocks oder Fixtures nutzen
- pytest nutzen — kein `unittest` direkt
- Tests müssen ohne Seiteneffekte isoliert laufen können

### Projektstruktur

- Quellcode in `src/` — nicht direkt im Root
- Ein Modul pro fachliche Einheit — keine Mega-Dateien mit 500+ Zeilen
- Öffentliche API eines Moduls in `__init__.py` sichtbar machen
