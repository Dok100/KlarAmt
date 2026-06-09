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

- `console.error` Debug-Logs noch im Code (vor öffentlichem Launch entfernen)
- Domain klaramt.app noch nicht registriert
- Anthropic DPA vor öffentlichem Launch abschließen

---

## Was als nächstes kommt

1. **Launch-Vorbereitung**: Debug-Logs entfernen, Domain klaramt.app, Anthropic DPA

### Verworfen

- **Sprachwahlschalter auf der Ergebnis-Seite** — nicht nötig. Die Sprachauswahl auf dem Einstiegsbildschirm bestimmt bereits die Erklärungssprache. Ein zweiter Schalter würde nur einen erneuten kostenpflichtigen API-Call zum Neu-Übersetzen auslösen. Der Antwortbrief bleibt bewusst deutsch (Brief an deutsche Behörde).

### Erledigt

- **Sprachen erweitert** ✓ — 7 Sprachen: Deutsch, Türkisch, Arabisch, Ukrainisch, Russisch, Polnisch, Englisch

- **PROJ-2: Antwortgenerator** ✓ — `/api/antwort` (zweiter Claude-Call, RDG-sicher, nur fristwahrende Vorlagen ohne Begründung). Antworttypen aus Handlungshinweisen abgeleitet, nur bei Risiko niedrig/mittel. Editierbares Textfeld, Disclaimer, Kopieren + PDF-Download (jsPDF, DIN-5008-Layout, Umlaute verifiziert). Eingabemaske für Absender (clientseitige Platzhalter-Ersetzung, localStorage, verlässt das Gerät nie) und editierbaren Empfänger. Hochrisiko bekommt weiter keine Vorlage.
- **PROJ-3: Streaming** ✓ — `/api/analyse` gibt NDJSON-Stream zurück (progress/done/error Events). Hält Vercel-Verbindung offen, kein Timeout mehr. Lokal getestet: 89 Progress-Events + done.
- **Strukturiertes `zahlungen`-Feld** ✓ — Zahlungstabelle ohne Regex, mit `richtung`-Feld (du_zahlst/du_bekommst), UI zeigt +/− und grün/dunkel
- **Defensives Zod-Schema** ✓ — fehlende/null-Felder von Claude crashen nicht mehr die ganze Analyse (alle Freitext-Felder nullish→'', Arrays default [], Enums mit catch-Fallback). Hat realen Crash-Bug behoben (Bescheid ohne Abteilung)
- **Zahlungsrichtung** ✓ — Erstattung vs. Nachzahlung sicher unterschieden ("einziehen"-Definition, Richtungsregel per Verb statt Vorzeichen). Getestet mit Steuer-, Bürgergeld-, Bußgeld- und Stromrechnung

---

## Letzte Entscheidungen

- Scan-PDFs und Bilder direkt als `document`/`image`-Block an Claude Vision — kein pdftoppm, kein tesseract.js
- `pdf-parse` v1.1.1, Direktimport von `lib/pdf-parse` (Haupteinstieg lädt Test-PDF die auf Vercel fehlt)
- Haiku als Standardmodell + Prompt Caching → ~6-8x günstiger als Sonnet
- Ampel ROT: nur bei aktiver Handlungspflicht (manuelle Zahlung ohne Lastschrift, kurzlaufende Frist)
- Ampel GELB bei Steuerbescheid mit Lastschrift, Bürgergeld-Bewilligung
- Zahlungsfilter: Claude entscheidet per Prompt welche Termine in fristen erscheinen (kein Frontend-Datumsfilter mehr)
