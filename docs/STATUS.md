# KlarAmt — Projektstatus

**Letzte Aktualisierung:** 2026-06-05

---

## Aktueller Stand

**PROJ-1 abgeschlossen und live auf Vercel.** `klaramt-murex.vercel.app` läuft in Production. Analyse-Flow getestet mit echtem Einkommensteuerbescheid Finanzamt Heilbronn — Ergebnis korrekt (Ampel ROT, Fristen, Erklärung, Handlungshinweise).

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

1. **PROJ-2: Antwortgenerator** — zweiter API-Call, Dreifach-Disclaimer, PDF-Export, Bearbeitungsmöglichkeit
2. **Sprachwahlschalter auf der Ergebnis-Seite** verdrahten (Button ist sichtbar, löst aber noch keinen erneuten API-Call aus)
3. **GitHub → Vercel Auto-Deploy verbinden** — Vercel Dashboard → Settings → Git → GitHub autorisieren → Dok100/KlarAmt

---

## Offene Punkte

- Domain klaramt.app noch nicht registriert
- Anthropic DPA vor öffentlichem Launch abschließen
- Debug-Logs (`console.error` für Zod-Fehler) noch im Code — vor öffentlichem Launch entfernen
- GitHub → Vercel Auto-Deploy noch nicht verbunden (manueller Deploy per CLI funktioniert)
- Domain klaramt.app noch nicht registriert
- Anthropic DPA vor öffentlichem Launch abschließen

---

## Letzte Entscheidungen

- Scan-PDF und Bilder: direkt als `document`/`image`-Block an Claude Vision API — kein pdftoppm, kein tesseract.js
- `pdf-parse` auf v1.1.1 gepinnt (v2 hat inkompatible class-basierte API)
- `pdf-parse/lib/pdf-parse` direkt laden (Haupteinstieg lädt Test-PDF die auf Vercel fehlt)
- Claude-Antwort: Backtick-Stripping nötig, weil Claude trotz Prompt-Anweisung manchmal Markdown-Wrapper setzt
