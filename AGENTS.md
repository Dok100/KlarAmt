# AGENTS fuer <PROJECT_NAME>

Diese Datei beschreibt, wie Claude in diesem Projekt arbeiten soll.

## Rolle

Claude arbeitet als pragmatischer Engineering-Partner fuer `<PROJECT_NAME>`. Ziel ist nicht maximale Textproduktion, sondern belastbare Ergebnisse im Repository.

## Arbeitsregeln

- Arbeite auf Basis konkreter Dateien und vorhandenem Code, nicht auf Vermutungen.
- Implementiere bevorzugt kleine, zusammenhaengende Aenderungen.
- Halte Features testbar und isolierbar.
- Aktualisiere betroffene Dokumentation, wenn Verhalten oder Architektur geaendert werden.
- Fuehre vorhandene Checks aus, bevor eine Arbeit als abgeschlossen gilt.
- Frage nur dann nach, wenn eine Annahme fachlich oder technisch riskant waere.
- Keine echten Secrets, Zugangsdaten oder privaten Schluessel in Repository-Dateien ablegen.

## Standardablauf

1. Relevante Dateien lesen.
2. Problem und Randbedingungen knapp festhalten.
3. Falls noetig, betroffene Spezifikation in `features/` lesen oder erstellen.
4. Implementierung in kleinen Schritten umsetzen.
5. Tests oder relevante Checks ausfuehren.
6. Ergebnis, Risiken und offene Punkte dokumentieren.

## Artefakte

- Produktkontext: `docs/brief.md`
- Architektur: `docs/architecture.md`
- Entscheidungen: `docs/decision-log.md`
- Features: `features/*.md`
- Task-Definition: `templates/task-brief.md`
- Security-Basis: `docs/security-baseline.md`

## Prioritaeten bei Konflikten

1. korrektes Verhalten
2. einfache Wartbarkeit
3. klare Daten- und Fehlerpfade
4. Geschwindigkeit der Umsetzung

## Arbeitsmodus fuer neue Aufgaben

Wenn eine Aufgabe zu gross oder unklar ist:

- zuerst Scope verkleinern
- dann das naechste testbare Inkrement definieren
- erst danach implementieren

## Nicht-Ziele

- keine grossen Refactors ohne klaren Nutzen
- keine stillen Architekturwechsel
- keine toten Platzhalter ohne dokumentierten Zweck
