# KlarAmt — Projektstatus

**Letzte Aktualisierung:** 2026-06-04

---

## Aktueller Stand

**PROJ-1 abgeschlossen.** Der vollständige Kern-Analyse-Flow läuft lokal: Scan-PDF → pdftoppm → OCR → PII-Strip → Vorklassifikation → Claude API → Zod-Validierung → Fristberechnung → Ergebnis-Seite. Erster echter Test mit Einkommensteuerbescheid erfolgreich.

---

## Was fertig ist

- Next.js-Projekt aufgesetzt, läuft unter localhost:3000
- Alle Lib-Dateien: `src/lib/pii.ts`, `src/lib/classifier.ts`, `src/lib/fristen.ts`
- API-Route: `src/app/api/analyse/route.ts` (komplette Pipeline)
- Upload-Seite mit Vertrauens-UX und Consent: `src/app/page.tsx`
- Ergebnis-Seite mit Ampel, Countdown, Erklärung, Handlungshinweisen: `src/app/ergebnis/page.tsx`
- Getestet mit echtem Einkommensteuerbescheid (Scan-PDF, 8 Seiten)

## Bekannte Fehler / Entscheidungen während PROJ-1

- Claude gibt JSON manchmal in Markdown-Codeblöcken zurück → Backtick-Stripping eingebaut
- Scan-PDFs: pdfjs-dist ist zu fragil für Node.js → stattdessen `pdftoppm` (Poppler-Systemtool) via child_process
- `pdf-parse`, `tesseract.js`, `pdfjs-dist`, `canvas` alle in `serverExternalPackages` — Next.js darf diese Pakete nicht bundeln

---

## Was als nächstes kommt

1. **Vercel-Deployment** — `pdftoppm` ist lokal verfügbar aber nicht auf Vercel. Für Scan-PDFs auf Vercel: entweder Claude Vision API (PDF-Seiten als Bilder direkt an Claude) oder Vercel Pro + `pdftoppm` via Layer. Für text-basierte PDFs (die meisten echten Behörden-PDFs) funktioniert pdf-parse auf Vercel.
2. **PROJ-2: Antwortgenerator** — zweiter API-Call, Dreifach-Disclaimer, PDF-Export, Bearbeitungsmöglichkeit
3. **Sprachwahlschalter auf der Ergebnis-Seite** verdrahten (Button ist sichtbar, löst aber noch keinen erneuten API-Call aus)

---

## Offene Punkte

- Domain klaramt.app noch nicht registriert
- Anthropic DPA vor öffentlichem Launch abschließen
- `pdftoppm` auf Vercel: Lösung offen (Claude Vision API bevorzugt)
- Debug-Logs (`console.error` für Zod-Fehler) noch im Code — vor Production entfernen

---

## Letzte Entscheidungen

- Scan-PDF-Rendering: `pdftoppm` statt pdfjs-dist (zu viele Node.js-Inkompatibilitäten)
- Claude-Antwort: Backtick-Stripping nötig, weil Claude trotz Prompt-Anweisung manchmal Markdown-Wrapper setzt
