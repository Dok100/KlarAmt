# KlarAmt — Projektstatus

**Letzte Aktualisierung:** 2026-06-08

---

## Aktueller Stand

**PROJ-1 abgeschlossen und live.** `klaramt-murex.vercel.app` läuft in Production mit GitHub Auto-Deploy (Push auf `main` → Vercel deployed automatisch).

Intensives Prompt-Tuning über mehrere Sessions: Analyse-Qualität getestet mit Einkommensteuerbescheid (Finanzamt Heilbronn), Bürgergeldbescheid (SGB II, Jobcenter Nürnberg) und Bußgeldbescheid mit Fahrverbot. Alle drei Dokumenttypen funktionieren fachlich korrekt.

---

## Was fertig ist

- Analyse-Pipeline: Upload → Claude Vision/pdf-parse → Zod-Validierung → Ergebnis
- Ergebnis-Seite: Ampel, Zahlungstabelle ("Zahlungen laut Bescheid"), Fristen-Countdown, Erklärung, Handlungshinweise, Eskalationsbox
- Prompt-Regeln für: Steuerbescheide (Vorauszahlung vs. Erstattung), Bürgergeld (Auszahlungslogik, Direktzahlung an Vermieter, SGB II §§), Bußgeld (Fristlogik ab Rechtskraft, Viermonatsfrist, Beifahrer)
- GitHub → Vercel Auto-Deploy aktiv
- Scanner-Hinweis für mehrseitige Dokumente (mobil)
- Kontingent-Logik (3 kostenlose Analysen, ROT immer frei)

## Bekannte offene Punkte

- Bürgergeld-Zahlungstabelle erscheint nur wenn Claude das `= X Euro`-Format im Fristen-Eintrag einhält — gelegentlich inkonsistent
- Streaming (PROJ-3) noch nicht implementiert — auf Vercel Hobby kann es bei langen Dokumenten zu Timeouts kommen
- `console.error` Debug-Logs noch im Code (vor öffentlichem Launch entfernen)
- Domain klaramt.app noch nicht registriert
- Anthropic DPA vor öffentlichem Launch abschließen

---

## Was als nächstes kommt

1. **PROJ-2: Antwortgenerator** — zweiter API-Call, Disclaimer, Antwortvorlage für einfache Fälle
2. **Sprachwahlschalter** auf der Ergebnis-Seite verdrahten (Button sichtbar, aber kein erneuter API-Call)

### Erledigt

- **PROJ-3: Streaming** ✓ — `/api/analyse` gibt NDJSON-Stream zurück (progress/done/error Events). Hält Vercel-Verbindung offen, kein Timeout mehr. Lokal getestet: 89 Progress-Events + done.
- **Strukturiertes `zahlungen`-Feld** ✓ — Zahlungstabelle ohne Regex
- **Defensives Zod-Schema** ✓ — fehlende/null-Felder von Claude crashen nicht mehr die ganze Analyse (alle Freitext-Felder nullish→'', Arrays default [], Enums mit catch-Fallback). Hat realen Crash-Bug behoben (Bescheid ohne Abteilung)

---

## Letzte Entscheidungen

- Scan-PDFs und Bilder direkt als `document`/`image`-Block an Claude Vision — kein pdftoppm, kein tesseract.js
- `pdf-parse` v1.1.1, Direktimport von `lib/pdf-parse` (Haupteinstieg lädt Test-PDF die auf Vercel fehlt)
- Haiku als Standardmodell + Prompt Caching → ~6-8x günstiger als Sonnet
- Ampel ROT: nur bei aktiver Handlungspflicht (manuelle Zahlung ohne Lastschrift, kurzlaufende Frist)
- Ampel GELB bei Steuerbescheid mit Lastschrift, Bürgergeld-Bewilligung
- Zahlungsfilter: Claude entscheidet per Prompt welche Termine in fristen erscheinen (kein Frontend-Datumsfilter mehr)
