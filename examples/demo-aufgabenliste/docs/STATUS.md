# Projektstatus

## Aktueller Stand

PROJ-1 (Aufgabe hinzufügen und auflisten) ist implementiert und getestet.
App läuft lokal, Daten werden korrekt in `aufgaben.json` gespeichert.

## Zuletzt fertiggestellt

- [x] PROJ-1: Aufgabe hinzufügen (`add`) und auflisten (`list`) — komplett

## In Arbeit

- Keines.

## Als nächstes

1. PROJ-2 definieren: Aufgabe als erledigt markieren (`done <nummer>`)
2. PROJ-3 definieren: Erledigte Aufgaben aus der Liste entfernen (`clear`)

## Offene Fragen

- Soll `list` auch erledigte Aufgaben anzeigen (mit Häkchen) oder nur offene?

## Letzte Entscheidungen

- Speicherformat: JSON statt SQLite — einfacher zu debuggen, keine Abhängigkeit
- Dateiname: `aufgaben.json` im aktuellen Verzeichnis — kein versteckter Ordner

---

_Zuletzt aktualisiert: 2026-04-24_
