# Produkt-Brief: Aufgabenliste

## Hintergrund

Ich vergesse Aufgaben die ich mir notieren will wenn ich keinen Stift zur Hand habe.
Ein einfaches CLI-Tool soll das lösen — schneller als jede App zu öffnen.

## Nutzer

Ich selbst, auf meinem Mac, im Terminal.

## Zielzustand

Ich kann Aufgaben über die Kommandozeile hinzufügen, auflisten und als erledigt markieren.
Die Aufgaben bleiben gespeichert wenn ich das Terminal schliesse.

## Primärer Stack

Python, läuft lokal, keine externen Services.

## MVP-Scope

- Aufgabe hinzufügen (`add "Einkaufen gehen"`)
- Alle offenen Aufgaben auflisten (`list`)
- Aufgabe als erledigt markieren (`done 1`)
- Daten werden in einer JSON-Datei gespeichert

## Nicht im Scope

- Sync zwischen Geräten
- Fälligkeitsdaten oder Prioritäten
- Grafische Oberfläche
- Kategorien oder Tags

## Erfolgskriterien

- Aufgabe hinzufügen dauert unter 3 Sekunden
- Aufgaben bleiben nach Neustart des Terminals erhalten
- Keine Abstürze bei leerem Zustand oder ungültiger Eingabe
