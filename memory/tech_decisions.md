---
name: tech-decisions
description: Technische Stack-Entscheidungen und Architektur von KlarAmt
metadata:
  type: project
---

**Stack:** Next.js + Tailwind CSS + Vercel (Hobby-Tier) + Claude API (Anthropic). Modell nie hartcoden — immer `process.env.CLAUDE_MODEL`.

**Drei-Schichten-Hybrid-Architektur (zentrale Designentscheidung):**
1. Regelbasierte Vorklassifikation (Code): Dokumenttyp-Erkennung + Keyword-Erkennung. Ergebnis als Prompt-Hinweis.
2. LLM-Analyse (Claude API): Nur Erklärung + Zusammenfassung. Kein Rechnen, kein Bewerten.
3. Deterministische Nachverarbeitung (Code): Fristberechnung, Zod-Validierung, Risikokategorie-Gate.

Why: Jede Aufgabe von der Schicht erledigen die sie am zuverlässigsten löst. LLMs rechnen schlecht, Code erklärt schlecht.

**Wichtige Implementierungsdetails:**
- OCR: Tesseract.js serverseitig, Timeout auf 8s setzen (Vercel Hobby: 10s Limit!)
- PDF: pdf-parse, automatischer OCR-Fallback bei Scan-PDFs
- PII-Stripping: Regex für IBAN, Steuernummer, SVN, Geburtsdatum, Telefon, E-Mail. Namen/Adressen bewusst ausgelassen.
- Sprachwechsel zählt nicht gegen localStorage-Counter (selbe Analyse, neue Sprache)
- Fristberechnung deterministisch: Bekanntgabe-Fiktion (3 Tage) + Fristdauer + Wochenendkorrektur

**Vercel Hobby Timeout-Problem:** Tesseract.js läuft langsam. Timeout muss < 10s bleiben. Bei Überschreitung: Fehlermeldung statt Absturz. Upgrade-Pfad: Vercel Pro (60s).

**Vollständiger Code** für alle Schichten ist in `klaramt-prompt-system-v2.md` — übernehmen, nicht neu schreiben.
