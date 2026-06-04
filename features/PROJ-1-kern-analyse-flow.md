# PROJ-1 — Kern-Analyse-Flow

**Status:** Planned  
**Priorität:** P0  
**Abhängigkeiten:** Next.js Setup + Vercel Deploy (Voraussetzung, kein eigenes Feature)

---

## Ziel

Ein Nutzer kann auf klaramt.app ein Foto seines Behördenbriefs machen (oder eine PDF hochladen) und bekommt innerhalb von 3 Minuten: Ampelfarbe, Frist-Countdown, eine Erklärung in einfacher Sprache und konkrete Handlungsoptionen — ohne Account, ohne Download.

---

## Nutzerproblem

Ich habe einen Behördenbrief bekommen. Ich verstehe ihn nicht. Ich weiß nicht ob ich etwas tun muss, wie viel Zeit ich noch habe, und was ich tun soll.

---

## Scope (was gehört dazu)

**Upload-Seite:**
- Vertrauens-UX: „Was passiert mit deinem Brief?" als 4-Schritte-Grafik beim ersten Besuch
- Consent-Button vor erstem Upload
- Foto-Upload (Kamera, mobile-first) und PDF-Upload
- localStorage-Counter: nach 3 Analysen Hinweis auf Account (rote Ampel ausgenommen)

**Server-seitige Verarbeitungs-Pipeline (eine API-Route `/api/analyse`):**
1. OCR via Tesseract.js (serverseitig, 30s Timeout) — für Fotos und Scan-PDFs
2. PDF-Parse via pdf-parse — für Text-PDFs; automatischer OCR-Fallback wenn kein Text gefunden
3. PII-Stripping (Regex: IBAN, Steuernummer, SVN, Geburtsdatum, Telefon, E-Mail)
4. Regelbasierte Vorklassifikation (Dokumenttyp-Erkennung + Keyword-Erkennung, Code aus `klaramt-prompt-system-v2.md`)
5. Claude API Call (System-Prompt + User-Prompt aus `klaramt-prompt-system-v2.md`, Modell per `CLAUDE_MODEL` Env-Variable, temperature=0.1)
6. JSON-Validierung via Zod (Schema aus `klaramt-prompt-system-v2.md`)
7. Deterministische Fristberechnung (Code aus `klaramt-prompt-system-v2.md`)
8. Risikokategorie-Gate: gibt zurück ob Antwortgenerator erlaubt

**Ergebnis-Seite:**
- Ampel (rot/gelb/grün) prominent mit Begründung
- Frist-Countdown: „Noch X Tage" (deterministisch berechnet), mit Hinweis zur Selbstprüfung des Datums
- Ein-Satz-Zusammenfassung (max. 25 Worte)
- Aufklappbar: Erklärung in Alltagssprache (Sachverhalt, Behördenbegründung, Bedeutung für mich)
- Aufklappbar: Handlungshinweise (sachlich, RDG-konform, keine Empfehlung)
- Sprachwahlschalter: Deutsch, Türkisch, Arabisch, Ukrainisch, Englisch (löst erneuten API-Call aus mit Sprachparameter)
- Bei hohem Risiko: Eskalationshinweis + Beratungsstellen, kein Antwortgenerator-CTA
- Bei niedrigem/mittlerem Risiko: CTA „Antwortvorlage erstellen" (Button, der zu PROJ-2 führt — in PROJ-1 noch ohne Funktion)

**Fehlerbehandlung:**
- OCR-Fehler (Timeout, unleserlich): klare Fehlermeldung mit Handlungsempfehlung
- Kein JSON vom LLM / Zod-Fehler: Fehlermeldung, kein halbfertiger Output
- API-Fehler: Fehlermeldung

---

## Out-of-scope (was NICHT dazu gehört)

- Antwortgenerator (kommt in PROJ-2)
- Account / Login / Auth
- Payment / Stripe
- Mehrseitige Dokumente (mehrere Fotos)
- Manuelle PII-Kontrolle
- Analyse-Archiv / Verlauf
- PWA-Manifest
- Impressum / Datenschutzerklärung (Platzhalter-Seiten reichen für PROJ-1)
- Mobile-Optimierungspass (kommt nach PROJ-2)

---

## Akzeptanzkriterien

- [ ] Foto-Upload öffnet Kamera auf dem Handy
- [ ] PDF-Upload funktioniert; bei Scan-PDF greift automatisch OCR
- [ ] PII-Stripping entfernt IBAN, Steuernummer, SVN, Geburtsdatum, Telefon, E-Mail
- [ ] Vertrauens-UX erscheint beim ersten Besuch, danach nicht mehr (localStorage-Flag)
- [ ] Ampelfarbe ist bei 90%+ der Testdokumente korrekt (manuell validieren)
- [ ] Frist-Countdown zeigt korrekte verbleibende Tage (deterministisch, mit Bekanntgabe-Fiktion und Wochenendkorrektur)
- [ ] Sprachwahlschalter liefert Output in der gewählten Sprache
- [ ] Bei risikokategorie = hoch: kein Antwortgenerator-CTA, nur Beratungsstellenhinweis
- [ ] localStorage-Counter zählt Analysen; bei 3 erscheint Hinweis; rote Ampel zählt nicht
- [ ] Zod-Validierung schlägt an bei ungültigem JSON; Nutzer sieht Fehlermeldung
- [ ] Gesamtdurchlaufzeit unter 3 Minuten auf mobilem Gerät (reales Netz)

---

## Edge Cases

- **Scan-PDF ohne erkennbaren Text:** OCR-Fallback. Bei < 30% OCR-Confidence: Warnung im Ergebnis.
- **Kein Behördenschreiben hochgeladen** (z.B. Rechnung, Brief vom Verein): `dokumenttyp = "kein_behoerdenschreiben"`, Ampel grün, klare Meldung.
- **Bescheiddatum nicht erkannt:** Fristberechnung gibt null zurück; Ergebnisseite zeigt statt Countdown „Frist nicht erkannt — bitte prüfe den Brief selbst."
- **Claude API antwortet nicht / Timeout:** Klare Fehlermeldung, kein Retry im MVP.
- **localStorage nicht verfügbar** (privates Browserfenster): Jede Analyse wird als erste gezählt (d.h. immer erlaubt); kein Fehler.
- **Sehr langer Text (>10 Seiten):** Erste 8.000 Worte an Claude übergeben, Rest abschneiden. Hinweis im Ergebnis: „Nur die ersten Seiten wurden analysiert."
- **Sprach-Wechsel bei abgelaufenem Kontingent:** Sprachänderung löst neuen API-Call aus — prüfen ob das als neue Analyse zählt. Entscheidung: Sprachänderung zählt nicht gegen Kontingent (es ist die selbe Analyse, nur neu formuliert).

---

## Technische Hinweise

Der gesamte Code für Vorklassifikation, Fristberechnung, Zod-Schema, PII-Stripping und API-Call-Beispiel ist in `klaramt-prompt-system-v2.md` fertig ausgearbeitet. Er muss übernommen und in die Next.js-Struktur eingebaut werden — nicht neu geschrieben.

Die API-Route läuft auf Vercel als Serverless Function. Timeout-Limit bei Vercel Hobby: 10 Sekunden. Tesseract.js hat 30 Sekunden Timeout — das passt nicht zusammen. Lösung für MVP: Tesseract-Timeout auf 8 Sekunden reduzieren, bei Überschreitung Fehlermeldung. Alternative: Vercel Pro (60s Timeout) wenn nötig.
