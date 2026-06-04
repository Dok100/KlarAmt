# Projektbriefing KlarAmt

## Ausgangslage

Millionen Menschen in Deutschland bekommen Behördenpost, die sie nicht verstehen. Steuerbescheide, Bußgeldbescheide, Jobcenter-Schreiben — geschrieben in Amtsdeutsch, vollgepackt mit Paragrafen, versteckte Fristen. Wer zu lange wartet oder falsch reagiert, riskiert Nachzahlungen, Fahrverbote oder den Verlust von Sozialleistungen.

Gleichzeitig gibt es längst KI die solche Texte erklären kann. Aber „Foto an ChatGPT schicken" löst das Problem nicht: kein Ampelsystem, keine Fristberechnung, kein strukturierter Handlungshinweis, kein Antwortgenerator, kein Datenschutz-Konzept.

KlarAmt schließt diese Lücke.

## Nutzer

**Zwei Gruppen, bewusst unterschiedlich behandelt:**

**Gruppe A — „Will nicht":** Gebildete Berufstätige, die ihren Steuerbescheid verstehen könnten, aber keine Lust haben, die Erläuterungen zu lesen. Zahlen für Komfort und Zeitersparnis.

**Gruppe B — „Kann nicht":** Menschen mit Sprachbarriere (Migranten), ältere Menschen, Personen in prekären Situationen (Bürgergeld, Schulden, Aufenthaltsrecht). Für sie ist eine verpasste Frist keine Unannehmlichkeit, sondern eine existenzielle Bedrohung.

**Strategie: Für Gruppe B optimieren, mit Gruppe A monetarisieren.**

## Zielbild

Nutzer öffnen KlarAmt auf dem Handy, fotografieren den Brief oder laden die PDF hoch, tippen auf „Analysieren" — und sehen nach maximal 3 Minuten:

- Eine Ampel (rot/gelb/grün) mit sofortiger Einschätzung
- Einen Frist-Countdown in Tagen
- Eine Erklärung in einfacher Alltagssprache (auf Wunsch auf Türkisch, Arabisch, Ukrainisch oder Englisch)
- Konkrete Handlungsoptionen (sachlich, keine Rechtsberatung)
- Einen fertigen Formulierungsvorschlag wenn nötig

Das ist spürbar besser als „Foto an ChatGPT schicken" — weil die Struktur (Ampel, Countdown, Antwortvorlage, mehrsprachig) kein generischer Chatbot liefert.

## Primärer Stack

`Next.js + Tailwind CSS + Vercel + Claude API`

## MVP-Scope

Was muss unbedingt funktionieren:

1. Foto-Upload (Kamera auf Handy) und PDF-Upload mit OCR-Fallback
2. PII-Stripping (IBAN, Steuernummer, SVN, Geburtsdatum, Telefon, E-Mail per Regex)
3. Regelbasierte Vorklassifikation (Dokumenttyp + Schlüsselbegriffe) vor dem LLM-Call
4. Drei-Ebenen-Analyse via Claude API mit Zod-Validierung
5. Ampel + deterministisch berechneter Frist-Countdown
6. Erklärung in 5 Sprachen (Deutsch, Türkisch, Arabisch, Ukrainisch, Englisch)
7. Antwortgenerator (4 Typen, nur bei Risiko niedrig/mittel)
8. localStorage-Counter (3 kostenlose Analysen, rote Ampel immer frei)
9. Vertrauens-UX im Upload-Flow: „Was passiert mit deinem Brief?"
10. Dreifach-Disclaimer (vor Nutzung, im Ergebnis, vor Export)

## Nicht im Scope

- Kein Account / kein Login im MVP (kommt danach: Clerk)
- Kein Payment im MVP (kommt danach: Stripe)
- Kein begründeter Widerspruch (RDG-Risiko)
- Keine native App
- Kein On-Device-KI
- Kein eigener Server (erst ab ~5.000 Analysen/Monat sinnvoll)
- Keine Cloud-Speicherung von Dokumenten
- Keine automatisierte Übersetzung der UI (nur Analyse-Output mehrsprachig)

## Erfolgskriterien

- Analyse-Ergebnis in unter 3 Minuten auf einem Handy
- Ampel-Genauigkeit: >90% korrekte Ampelfarbe bei 50 Testdokumenten
- Frist-Erkennung: 100% korrekte Berechnung bei bekannten Bescheidtypen
- RDG-Compliance: Kein Output enthält Bewertungen, Empfehlungen oder Erfolgseinschätzungen
- Vertrauens-UX: Jeder sieht vor dem ersten Upload was mit dem Dokument passiert

## Einschränkungen

- Solo-Entwickler ohne Programmierkenntnisse (Vibecoding)
- Budget: < 5 €/Monat für Hosting und Infrastruktur im MVP
- Kein App-Store (Web-App, keine native App)
- PII-Stripping: Namen und Adressen werden nicht per Regex entfernt (bewusste Einschränkung, transparent kommuniziert). Post-MVP: Inkognitos PII-Engine.
- RDG: KlarAmt erklärt und formuliert, berät nicht. Hochrisiko-Bescheide (Asyl, Strafbefehl, Zwangsvollstreckung) ohne Antwortgenerator.
