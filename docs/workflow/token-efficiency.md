# Token Efficiency

Diese Checkliste hilft, mit Claude fokussiert zu arbeiten und unnötigen Kontextverbrauch zu vermeiden.

## Grundregeln

- kleine, klar abgegrenzte Aufgaben statt Sammelauftraege geben
- betroffene Dateien oder Ordner explizit nennen
- zuerst Problem und Ziel, dann Umsetzung anfordern
- fuer neue Themen lieber neuen Thread als endlose Historie nutzen

## Gute Prompt-Struktur

Ein guter Arbeitsauftrag enthaelt:

- Ziel
- Scope
- betroffene Dateien
- Fertigkriterium
- was explizit nicht geaendert werden soll

## Beim Arbeiten im Repository

- nicht das ganze Repository auf einmal analysieren lassen
- breite Suchen nur bei echtem Bedarf
- grosse Logs oder Build-Ausgaben nicht unnoetig in den Kontext ziehen
- bei Reviews Fokus benennen, z. B. Security, Regressionen oder Tests

## Terminal und Tooling

- gezielte Suchbefehle wie `rg` statt breite Vollsuchen
- nur relevante Dateibereiche lesen
- grosse Kommandoausgaben moeglichst kurz halten
- bei Debugging zuerst den wahrscheinlich betroffenen Bereich eingrenzen

## Agentische Arbeit

- nur getrennte, wirklich parallele Aufgaben parallelisieren
- keine Agenten fuer unklaren oder zu grossen Scope starten
- Zwischenziele klein halten, damit nicht immer wieder derselbe Kontext aufgebaut wird

## Wann Verbrauch typischerweise steigt

- viele gelesene Dateien
- grosse Diffs
- lange Terminal-Outputs
- parallele Agenten
- unklar formulierte Aufgaben mit viel Exploration

## Faustregel

Je klarer Scope, Dateien und Fertigkriterium sind, desto effizienter arbeitet Claude.
