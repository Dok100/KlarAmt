# KlarAmt — Projektstatus

**Letzte Aktualisierung:** 2026-06-12

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

## Modell-Entscheidung (wichtig)

- **Live läuft auf Haiku 4.5** — in Vercel ist KEIN `CLAUDE_MODEL` gesetzt, also Code-Default Haiku. Bewusste Kosten-Entscheidung des Nutzers.
- **Lokale `.env.local` ebenfalls auf Haiku** gestellt (war Sonnet 4.6), damit Tests = Live. **Prompt-Tuning IMMER auf Haiku verifizieren.**
- Haiku lässt häufiger Felder weg als Sonnet → Schema muss defensiv bleiben.

## Bekannte offene Punkte

- **§-Filter und Datums-Backstop wirken nur im Text-Modus** — beide brauchen Quelltext zum Abgleich; bei Scans/Fotos (Vision) gibt es keinen, dort schützt nur die Prompt-Regel. Gemeinsam mit dem Vision-Umbau lösbar (gelesenen Text zurückgeben).
- Haiku lässt gelegentlich `fristen`-Array ganz weg (kein Crash dank Schema-Default, aber Countdown fehlt dann).
- `console.error` Debug-Logs noch im Code (vor öffentlichem Launch entfernen)
- Domain klaramt.app noch nicht registriert
- Anthropic DPA vor öffentlichem Launch abschließen

---

## Was als nächstes kommt

1. **§-Filter + Datums-Backstop für Scans/Fotos** — gelesenen Vision-Text zurückgeben, damit beide Text-Leitplanken auch im Vision-Modus greifen (größerer Umbau)
2. **Launch-Vorbereitung**: Debug-Logs entfernen, Domain klaramt.app, Anthropic DPA

### Verworfen

- **Sprachwahlschalter auf der Ergebnis-Seite** — nicht nötig. Die Sprachauswahl auf dem Einstiegsbildschirm bestimmt bereits die Erklärungssprache. Ein zweiter Schalter würde nur einen erneuten kostenpflichtigen API-Call zum Neu-Übersetzen auslösen. Der Antwortbrief bleibt bewusst deutsch (Brief an deutsche Behörde).

### Erledigt

- **Tatdatum nicht als „Bescheiddatum" in Freitexten** ✓ (2026-06-13) — der deterministische Backstop nullt nur das strukturierte Feld; Haikus Prosa (`ampel.begruendung`, Handlungshinweise) nannte das Tatdatum weiter „Bescheiddatum ist 12.05.2026". Prompt entschärft: JSON-Feld `ampel.begruendung` und Regel 9 verlangen ein Bescheiddatum nur noch, wenn ein echtes vorhanden ist; neue Regel verbietet in ALLEN Freitexten, ein Datum als „Bescheiddatum" zu bezeichnen, wenn keins existiert (Tatdatum heißt „Tatdatum"). **Prompt-only — auf Haiku zu verifizieren.**
- **Aktenzeichen-Kürzung durch PII-Filter** ✓ (2026-06-13) — die `0`-Alternative der Telefon-Regex in `lib/pii.ts` griff mitten in `OWi-2026/55418` und ersetzte `026/55418` durch `[TELEFON]` → Haiku transkribierte das gekürzte `32.4-OWi-2`. Negative-Lookbehind `(?<!\d)` verhindert den Treffer innerhalb von Ziffern; echte Telefonnummern werden weiter maskiert (verifiziert). Nur Text-Modus (Vision scrubbt nicht).
- **Datums-Backstop + Frist-Box** ✓ (2026-06-12) — `verwerfeTatdatumAlsBescheiddatum()` in `lib/fristen.ts` erkennt im Quelltext Tatdaten anhand von Kontextwörtern („zur Last gelegt", „am … um … Uhr", „begangen", „Tatzeit") und verwirft ein `bescheid_datum`, das mit einem Tatdatum übereinstimmt → kein erfundenes Fristende mehr. Läuft in der Pipeline nach `entferneErfundeneParagraphen`, vor `pruefeBetragssumme`. Auf echter Testdatei verifiziert (Tatdatum `12.05.2026` korrekt erkannt). **Text-Modus only** (braucht Quelltext). Frist-Box (`ergebnis/page.tsx`): Label jetzt per `fristTitel(typ)` nach Fristtyp statt fest „Einspruchsfrist"; ohne berechenbares Fristende rendert `FristHinweis` (Dauer als Text) statt eines erfundenen Countdowns; `zahlung`-Fristen erscheinen nur in der Zahlungstabelle, nicht mehr als doppelte Box.
- **Summen-Prüfung (Leitplanke 3)** ✓ (2026-06-12) — neues Prompt-Feld `betragspruefung` (ausgewiesener Gesamtbetrag + wörtlich transkribierte Einzelposten). `pruefeBetragssumme()` in `lib/fristen.ts` vergleicht deterministisch: ergeben die Einzelposten nicht den Gesamtbetrag (>1 Cent Abweichung), wird der Befund in `betragspruefung.warnung` geschrieben. Funktioniert in Text- UND Vision-Modus (Selbstkonsistenz-Check der LLM-Transkription). **Auf Haiku verifiziert** (Bußgeld 100+25+3,50 vs. ausgewiesene 143,50 → Warnung erschien korrekt). Nebenbei: arithmetisch falsches Bußgeld-Beispiel im Prompt korrigiert (Geldbuße 380→360).
- **Summen-Warnung-UX** ✓ (2026-06-12) — Befund war anfangs in `ocr_qualitaet` eingehängt → stand unscheinbar am Seitenende und hieß irreführend „Texterkennung eingeschränkt". Jetzt eigene Box (`betragspruefung.warnung`) direkt über der Zahlungstabelle. Zusätzlich Frist-Beschreibungszeile lesbarer (Grauton #9c9087→#5e564d, größer).
- **Paragraphen-Leitplanke** ✓ (2026-06-12) — `entferneErfundeneParagraphen()` verwirft im Text-Modus jedes §/Aktenzeichen, das nicht wörtlich im Bescheidtext steht (gefährlichste Fehlerklasse, von größeren Modellen NICHT lösbar). Prompt: strikte Quellenbindung. Auf Haiku an 5 Bescheiden geprüft: echte §§ behalten, erfundene (§ 4 RStV, § 70 EStG, falsch gelabelter § 122 AO) entfernt.
- **Datums-Regel** ✓ (2026-06-12) — bescheid_datum nur aus echtem Bescheiddatum, niemals Tatdatum/Zeitraum; kein Datum → null statt erfundenem Fristende (Prompt-seitig).
- **Schema-Robustheit** ✓ (2026-06-12) — `eskalation` und `ocr_qualitaet` bekamen Defaults; Haiku ließ sie weg → vorher ZodError-Crash (Nutzer sah Fehler statt Ergebnis).
- **Ampel-Regel präzisiert** ✓ (2026-06-12) — manuelle Überweisung mit komfortabler Frist = GELB (Hinweis "selbst überweisen" im Text), ROT nur bei akuter Frist/Maßnahmen. Deterministisch über beide Modelle.
- **Zugangsfiktion für Zahlungsfristen** ✓ (2026-06-12) — relative Zahlungsfristen ("einen Monat nach Bekanntgabe") rechnen jetzt mit 3-Tage-Fiktion (vorher ab Druckdatum).
- **PII-Datums-Bug** ✓ (2026-06-12) — Geburtsdatum-Regel löschte JEDES Datum (auch Bescheiddatum/Fälligkeiten) → "OCR-Fehler". Jetzt nur mit Kontextwort (geboren am, geb.).
- **Rohtext-Eingabe + .txt-Upload** ✓ (2026-06-12) — `/api/analyse` nimmt `text`-Feld; Upload akzeptiert .txt/.md (UTF-8 mit Windows-1252-Fallback). Schnelles, billiges Prompt-Testen ohne Vision.
- **Persönlicher Rate-Limit-Bypass** ✓ (2026-06-12) — `RATE_LIMIT_BYPASS` (Env) + Cookie via `?frei=<geheimnis>` hebt das IP-Limit nur für den Inhaber auf.
- **Upstash-Env in Vercel gesetzt** ✓ (2026-06-12) — `UPSTASH_REDIS_REST_URL` + `_TOKEN` in Production aktiv, Rate-Limit greift live.
- **Globale Tages-Notbremse `/api/antwort`** ✓ — 500 Briefe/Tag.
- **Rate-Limiting (Stufe A)** ✓ — serverseitig in `/api/analyse` VOR dem Claude-Call. Per-IP 3/Tag + globales Tageslimit (Budget-Notbremse) via Upstash Redis. Rote Ampel zählt nicht gegen das IP-Kontingent (Erstattung). Fail-open ohne Upstash (Dev). Logik getestet (3 erlaubt, 4. blockiert, Rot erstattet). **Wichtig: Env-Variablen in Vercel setzen, sonst kein Schutz.**

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
