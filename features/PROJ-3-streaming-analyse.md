# PROJ-3: Streaming-Analyse

## Ziel

Die Analyse-Antwort wird per Server-Sent Events gestreamt, sodass der Nutzer
schon nach wenigen Sekunden erste Ergebnisse sieht — kein Vercel-Timeout mehr
auf dem kostenlosen Hobby-Plan (10s Limit).

## Nutzerproblem

Aktuell wartet der Nutzer 15–30 Sekunden auf eine leere Seite, bevor irgendetwas
erscheint. Auf Vercel Hobby bricht die Verbindung nach 10 Sekunden mit einem
Timeout ab. Das macht die App für reale Nutzer unbrauchbar ohne Pro-Plan.

## Scope

- `/api/analyse` gibt einen `ReadableStream` zurück statt JSON
- Frontend liest den Stream und zeigt die Ergebnis-Seite schrittweise auf
- Ladeindikator mit Fortschrittstext ("Dokument wird erkannt...", "Analyse läuft...")
- Nach vollständigem Empfang: identische Ergebnis-Darstellung wie bisher

## Out-of-scope

- Änderungen am Prompt oder der Analyse-Logik
- Änderungen an der Ergebnis-Seite (Ampel, Fristen, Handlungshinweise)
- Partial rendering (erst Ampel, dann Erklärung) — alles kommt am Stück wenn Claude fertig ist

## Akzeptanzkriterien

- [ ] Auf Vercel Hobby-Plan kein Timeout bei einem typischen 2-seitigen Steuerbescheid
- [ ] Nutzer sieht Ladeindikator mit Textänderung nach spätestens 3 Sekunden
- [ ] Ergebnis-Darstellung identisch mit aktuellem Stand
- [ ] Bei Fehler (Zod, API) erscheint die gleiche Fehlermeldung wie bisher

## Edge Cases

- Stream bricht ab (Netzwerkfehler): Fehlermeldung anzeigen
- Claude streamt ungültiges JSON: Fehler erst nach komplettem Empfang erkennbar — Fallback-Meldung

## Technische Notizen

- Next.js App Router unterstützt `return new Response(stream)` direkt
- Claude SDK: `client.messages.stream()` statt `client.messages.create()`
- JSON erst nach komplettem Stream parsen (kein Partial-JSON-Parsing nötig)
- Vercel Hobby streamt bis zu 25s ohne Timeout solange Bytes fließen
