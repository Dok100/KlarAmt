# PROJ-1: Aufgabe hinzufügen und auflisten

## Ziel

Der Nutzer kann über die Kommandozeile eine neue Aufgabe speichern und alle offenen Aufgaben anzeigen lassen.

## Nutzerproblem

Ich muss Aufgaben schnell notieren können ohne eine App zu öffnen oder einen Browser zu starten.

## Scope

- Befehl `add "Text der Aufgabe"` speichert eine neue Aufgabe
- Befehl `list` zeigt alle gespeicherten Aufgaben nummeriert an
- Aufgaben werden in einer JSON-Datei im aktuellen Verzeichnis gespeichert

## Out-of-scope

- Fälligkeitsdaten
- Prioritäten
- Kategorien
- Erledigungsstatus (kommt in PROJ-2)

## Akzeptanzkriterien

- `python src/app.py add "Milch kaufen"` fügt eine Aufgabe hinzu und bestätigt es
- `python src/app.py list` zeigt alle Aufgaben mit Nummer, z.B. `1. Milch kaufen`
- Nach Programmende sind die Aufgaben in `aufgaben.json` gespeichert
- Beim nächsten Start sind die gespeicherten Aufgaben noch da
- Bei leerem Zustand gibt `list` eine freundliche Meldung aus, keinen Fehler

## Edge Cases

- Leerer Text bei `add ""` → Fehlermeldung, keine leere Aufgabe speichern
- `aufgaben.json` existiert noch nicht → wird automatisch angelegt
- `aufgaben.json` ist beschädigt → Fehlermeldung statt Absturz

## Abhängigkeiten

- Keine externen Packages — nur Python-Standardbibliothek

## Test-Hinweise

- Test: add speichert korrekt in die JSON-Datei
- Test: list gibt leere Liste korrekt aus
- Test: Beschädigte JSON-Datei wird abgefangen
