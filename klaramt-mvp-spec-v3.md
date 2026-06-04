# KlarAmt – MVP Feature-Spezifikation v3.0

**Szenario:** Solo-Entwickler, Vibecoding, Web-App  
**Version:** 3.0 | 17. Mai 2026  
**Domain:** klaramt.app  
**Änderungen gegenüber v2.1:** Umbenennung AmtPilot → KlarAmt, Zwei-Gruppen-Strategie, Vertrauens-UX, Micro-Payment, localStorage-Counter, mehrsprachiger Output, erweiterte regelbasierte Vorklassifikation, Positionierung gegen generische Chatbots, Hybrid-Server als Upgrade-Pfad.

---

## 1. Produktvision

**KlarAmt** macht Behördenpost verständlich. Die App erklärt amtliche Schreiben in einfacher Sprache, erkennt Fristen, priorisiert den Handlungsbedarf und erstellt bei Bedarf eine Antwortvorlage.

**Kernversprechen:** Vom Briefkasten zum Verstehen in unter 3 Minuten.

**Positionierung:** KlarAmt ist keine allgemeine KI, die Behördendeutsch übersetzt. KlarAmt ist strukturierte Navigation durch die Bürokratie: Ampel-System für sofortigen Überblick, Frist-Countdown statt vager Hinweise, fertige Antwortvorlagen statt leere Textfelder. Das unterscheidet KlarAmt von „Foto an ChatGPT schicken": Nicht die KI ist der Wert, sondern die behördenspezifische Struktur, die kein generischer Chatbot liefert.

**Was KlarAmt tut:** Erklären, priorisieren, formulieren.  
**Was KlarAmt nicht tut:** Rechtlich beraten, bewerten, entscheiden.

**Distributionsmodell:** Web-App unter klaramt.app. Kein App-Store, kein Download. Link per WhatsApp teilen, sofort nutzbar auf jedem Gerät mit Browser. Installierbar als PWA.

---

## 2. Zielgruppen-Strategie

KlarAmt adressiert zwei fundamental verschiedene Nutzergruppen und behandelt sie bewusst unterschiedlich.

### Gruppe A: „Will nicht" (Komfort-Nutzer)

Gebildete Berufstätige, die ihren Steuerbescheid verstehen könnten, aber keine Lust haben, die Erläuterungen zu lesen. Der Wert von KlarAmt ist Zeitersparnis und Komfort. Diese Gruppe hat eine höhere Zahlungsbereitschaft, braucht das Produkt aber nicht dringend.

### Gruppe B: „Kann nicht" (existenzieller Bedarf)

Menschen, die den Brief tatsächlich nicht verstehen: Migranten mit Sprachbarriere, ältere Menschen, Personen in prekären Lebenssituationen (Bürgergeld, Schulden, Aufenthaltsrecht). Der Wert ist existenziell: Eine verpasste Frist kann Leistungsentzug, Vollstreckung oder Abschiebung bedeuten. Diese Gruppe braucht KlarAmt dringend, zahlt aber seltener.

### Produktkonsequenz

**Für Gruppe B optimieren, mit Gruppe A monetarisieren.**

Konkret: Rote Ampel (Frist läuft, existenzielle Konsequenz) ist immer kostenlos, auch nach Erschöpfung des Freikontingents, auch ohne Account. Kein Mensch soll wegen einer Paywall eine Widerspruchsfrist verpassen. Die Paywall greift bei Komfort-Features: Antwortgenerator, wiederholte Nutzung über das Freikontingent hinaus, Archiv. Gruppe B braucht in der Regel eine Analyse und eine schnelle Orientierung. Gruppe A will den Komfort regelmäßig.

Der mehrsprachige Output (Türkisch, Arabisch, Ukrainisch, Englisch) ist ein Kernfeature für Gruppe B und ein sichtbares Differenzierungsmerkmal gegenüber generischen Chatbots.

---

## 3. Technischer Stack

### Frontend
- **Framework:** Next.js (React-basiert, Vibecoding-tauglich)
- **Styling:** Tailwind CSS
- **Hosting:** Vercel (kostenloser Tier für den Start)
- **Domain:** klaramt.app (registriert bei Cloudflare Domains oder vergleichbar)
- **Kamera-Zugriff:** HTML5 `<input type="file" accept="image/*" capture="environment">`

### Backend
- **API-Route:** Next.js API Routes (Serverless Functions auf Vercel)
- **LLM:** Anthropic Claude API. Modell per Environment-Variable (`CLAUDE_MODEL`), nicht hartcodiert.
- **OCR:** Tesseract.js (serverseitig), Timeout 30 Sekunden. Upgrade-Pfad: Google Cloud Vision API.
- **PDF-Textextraktion:** pdf-parse. Fallback: Wenn kein Text gefunden (gescanntes PDF) → automatisch OCR.
- **PII-Stripping:** Serverseitiges Regex-Modul (IBAN, Steuernummer, Sozialversicherungsnummer, Geburtsdatum, Telefon, E-Mail). Bewusste Einschränkung: Namen und Adressen werden nicht per Regex erkannt (transparent kommuniziert).
- **Regelbasierte Vorklassifikation:** Zwei Stufen vor dem LLM-Call:
  1. **Dokumenttyp-Erkennung:** Absenderangaben + Strukturkeywords → deterministischer Dokumenttyp (Finanzamt → Steuerbescheid, Familienkasse → Kindergeld, Jobcenter → SGB II, etc.)
  2. **Keyword-Erkennung:** Frist-relevante Begriffe, Dringlichkeits-Begriffe, Eskalations-Begriffe
  Ergebnisse werden als strukturierte Hinweise an den Prompt übergeben.
- **Deterministische Fristberechnung:** LLM erkennt Bescheiddatum. Code berechnet Frist anhand fester Regeln (Bekanntgabe-Fiktion, Fristdauer pro Dokumenttyp, Wochenendkorrektur).
- **JSON-Schema-Validierung:** Zod. Bei ungültigem JSON: Fehlermeldung, kein halbfertiger Output.
- **Nutzungszählung:** localStorage-Counter (3 kostenlose Analysen). Rote Ampel von der Begrenzung ausgenommen.

### Auth & Payment (Should Have)
- **Authentifizierung:** Clerk oder Supabase Auth
- **Payment:** Stripe Checkout. Micro-Payment (0,99 € pro Antwortvorlage) und/oder 10er-Pack (4,99 €).

### Upgrade-Pfad: Eigener Server (Post-MVP)
Ab circa 5.000 Analysen/Monat wird ein eigener Server (z. B. Hetzner mit GPU) günstiger als die Claude API. Zusätzlicher Vorteil: „Dein Dokument verlässt nie unseren Server in Deutschland" als Datenschutz-USP. Voraussetzung: Open-Source-Modelle müssen die Qualitätslücke zu Claude bei deutschem Verwaltungsrecht schließen. Aktuell nicht gegeben, in 12 Monaten möglicherweise.

### Was NICHT gebraucht wird
- Kein eigener Server (für den Start)
- Keine Datenbank für Dokumente
- Kein App-Store-Account
- Kein Push-Notification-System
- Kein Offline-Modus
- Keine native Kamera-UI

---

## 4. Nutzer-Flows

### Flow 1: Brief fotografieren (Primär)

1. Nutzer öffnet klaramt.app auf dem Handy
2. **Vertrauens-UX** (beim ersten Besuch): Visuelles Element „Was passiert mit deinem Brief?" – drei Schritte als einfache Grafik:
   - 📸 „Dein Brief wird gelesen"
   - 🔒 „Persönliche Daten werden entfernt"
   - 🤖 „Die KI erklärt den Inhalt"
   - 🗑️ „Alles wird sofort gelöscht"
   Plus Consent-Button: „Verstanden, Brief analysieren"
3. Großer Button: „Brief fotografieren"
4. Browser öffnet die Kamera
5. Bild → Serverside OCR (Tesseract.js, Timeout 30s) → Text
6. Bei OCR-Fehler: „Text konnte nicht vollständig erkannt werden. Bitte als PDF hochladen oder erneut fotografieren."
7. PII-Stripping → Regelbasierte Vorklassifikation (Dokumenttyp + Keywords)
8. Anonymisierter Text + Klassifikationshinweise → Claude API → JSON
9. Deterministische Fristberechnung
10. Ergebnis: Ampel, Zusammenfassung, Erklärung, Handlungshinweise
11. **Sprachwahlschalter:** „In anderer Sprache erklären" (Deutsch, Türkisch, Arabisch, Ukrainisch, Englisch). Löst einen erneuten API-Call aus mit dem Zusatz „Formuliere die Erklärung auf [Sprache]."
12. Optional: „Antwortvorlage erstellen" → Antwortgenerator

### Flow 2: PDF hochladen

1. „PDF hochladen" → Datei auswählen
2. pdf-parse → Text extrahieren
3. **Fallback:** Kein Text gefunden (Scan-PDF) → automatisch OCR
4. Ab hier identisch mit Flow 1

### Flow 3: Mehrseitige Dokumente

1. Mehrere Seiten fotografieren oder mehrseitiges PDF hochladen
2. Gesamttext zusammenführen
3. Analyse über Gesamttext

**Multi-Dokument-Kontext: Post-MVP.**

---

## 5. Die Drei-Ebenen-Analyse (Kern-Feature)

Die Analyse-Intelligenz verteilt sich auf drei Schichten: Regelbasierte Vorklassifikation (Code), LLM-Analyse (Prompt), deterministische Nachverarbeitung (Code). Details im Prompt-System-Dokument.

### Ebene 1: Sofort-Überblick (immer sichtbar)
- Absender (Behörde)
- Dokumenttyp (regelbasiert erkannt, vom LLM bestätigt/korrigiert)
- Ein-Satz-Zusammenfassung (max. 25 Worte)
- **Ampel** (🔴 / 🟡 / 🟢) mit Begründung. Unsicherheit im Begründungstext: „Frist erkannt (Bescheiddatum: 15.04.2026). Bitte prüfe das Datum auf deinem Bescheid."
- Risikokategorie (niedrig / mittel / hoch)
- **Frist-Countdown** (deterministisch berechnet, prominent angezeigt: „Noch X Tage bis zum geschätzten Fristende")

### Ebene 2: Verständliche Erklärung (aufklappbar)
- Sachverhalt in Alltagssprache
- Begründung der Behörde, vereinfacht
- Konkrete Auswirkung für den Nutzer
- Erklärung zitierter Paragraphen
- **Sprachwahlschalter** für Output in Türkisch, Arabisch, Ukrainisch, Englisch

### Ebene 3: Handlungshinweise (aufklappbar)
- Priorisierte Handlungsoptionen (sachlich, keine rechtliche Bewertung)
- CTA „Antwortvorlage erstellen" (nur bei Risikokategorie niedrig/mittel)
- Bei hohem Risiko: nur Erklärung + Fristwarnung + Verweis auf Beratungsstelle

**Sprachliche Grundregel (RDG-konform):**
- Erlaubt: „Du kannst fristwahrend Einspruch einlegen."
- Erlaubt: „Einspruch ist innerhalb der Frist möglich."
- Nicht erlaubt: „Lege Einspruch ein, weil der Bescheid falsch ist."
- Nicht erlaubt: „Der Einspruch lohnt sich."

---

## 6. Antwortgenerator

### Bezeichnung
Generierte Schreiben heißen „Formulierungsvorschlag" oder „bearbeitbare Vorlage".

### Antworttypen im MVP

| Antworttyp | RDG-Risiko |
|------------|-----------|
| Informationsanfrage | Keines |
| Unterlagen nachreichen | Keines |
| Fristverlängerung beantragen | Keines |
| Fristwahrender Einspruch/Widerspruch (ohne Begründung) | Gering |

### Nicht im MVP
- Begründeter Widerspruch
- Automatisiertes Versenden
- Antwortgenerierung bei Risikokategorie „hoch"

### Flow
1. „Antwortvorlage erstellen"
2. **Disclaimer vor Nutzung:** „KlarAmt erstellt einen Formulierungsvorschlag. Dies ist keine Rechtsberatung."
3. System schlägt Antworttyp vor
4. Maximal 2 sachliche Rückfragen (keine Frage: „Möchtest du inhaltlich begründen?")
5. Generiertes Schreiben
6. **Disclaimer im Ergebnis**
7. Nutzer kann Text bearbeiten
8. **Disclaimer vor Export:** „Hast du den Text geprüft und ggf. angepasst?"
9. Download als PDF oder Copy-to-Clipboard

### RDG-Disclaimer (eingebettet in jedes Schreiben)
„Dieses Schreiben wurde KI-gestützt erstellt und dient als Formulierungshilfe. Es ersetzt keine Rechtsberatung."

---

## 7. Datenschutz

### Grundprinzip: So wenig wie möglich speichern, so transparent wie möglich kommunizieren

- **Dokumente:** Werden NICHT gespeichert. Nach Analyse sofort gelöscht.
- **Analyse-Ergebnisse:** Nur bei eingeloggten Nutzern gespeichert, nur strukturierter Output.
- **PII-Stripping:** Automatisch (Regex). Bewusste Einschränkung bei Namen/Adressen transparent kommuniziert.
- **API-Datenverarbeitung:** DPA mit Anthropic vor öffentlichem Launch abschließen. API-Retention-Modus klären.

### Vertrauens-UX: „Was passiert mit deinem Brief?"

Kein juristischer Text, sondern eine einfache visuelle Darstellung des Datenflusses, direkt im Upload-Flow:

1. 📸 Dein Brief wird eingelesen
2. 🔒 Steuernummern, IBANs und ähnliche Daten werden automatisch entfernt
3. 🤖 Der anonymisierte Text wird analysiert (Anthropic Claude API)
4. 🗑️ Nach der Analyse wird alles gelöscht. Wir speichern nichts.

Dieses Element ist nicht in der Datenschutzerklärung versteckt, sondern Teil der Hauptoberfläche. Es adressiert die Vertrauenshürde direkt, insbesondere für Gruppe B.

### Post-MVP
- Manuelle PII-Kontrolle (Nutzer schwärzt vor Analyse)
- Inkognitos PII-Engine als serverseitige Bibliothek
- Eigener Server in Deutschland als Datenschutz-USP

---

## 8. Monetarisierung

### Reihenfolge: Erst Validierung, dann Payment

Im MVP keine Bezahlung. Aber: localStorage-Counter (3 kostenlose Analysen) von Anfang an, um unkontrollierte API-Kosten zu vermeiden.

**Ausnahme: Rote Ampel ist immer kostenlos, auch nach Erschöpfung des Kontingents.** Kein Mensch soll wegen einer Paywall eine Frist verpassen.

### Geplantes Modell (nach Validierung)

**Kostenlos (ohne Account):**
- 3 Analysen (localStorage-Counter)
- Rote Ampel immer frei (auch nach Kontingent)
- Kein Antwortgenerator

**Mit kostenlosem Account:**
- 3 Analysen pro Monat
- Antwortgenerator

**Bezahlt (Stripe):**
- Micro-Payment: 0,99 € pro Antwortvorlage (situationsbasiert, im Moment des Bedarfs)
- 10er-Pack: 4,99 € (für Wiederkehr-Nutzer)
- Später optional: Monatsabo

### Warum Micro-Payment vor 10er-Pack?

Der Moment, in dem jemand einen bedrohlichen Brief bekommt und sofort Hilfe braucht, ist der Moment höchster Zahlungsbereitschaft. „Dieser Brief braucht eine Antwort. Für 0,99 € erstelle ich dir einen Formulierungsvorschlag." Das liegt näher am Bedarf als ein Prepaid-Modell. Das 10er-Pack ist für Gruppe A (regelmäßige Nutzer), die Micro-Transaction für den Spontan-Bedarf.

---

## 9. MoSCoW-Priorisierung

### Must Have (Launch)

- Responsive Web-App (Mobile-first) unter klaramt.app
- Vertrauens-UX: „Was passiert mit deinem Brief?" im Upload-Flow
- Consent vor erstem Upload
- Foto-Upload mit Kamera-Auslöser
- PDF-Upload mit Scan-Fallback (kein Text → OCR)
- OCR mit Timeout und Fehlermeldung
- PII-Stripping (Regex)
- Regelbasierte Vorklassifikation (Dokumenttyp + Keywords)
- Drei-Ebenen-Analyse via Claude API
- Risikokategorie pro Dokument
- Ampel-System mit deterministischer Fristberechnung und prominentem Countdown
- JSON-Schema-Validierung (Zod)
- **Sprachwahlschalter** (Deutsch, Türkisch, Arabisch, Ukrainisch, Englisch)
- Antwortgenerator (4 Basis-Typen, nur bei niedrigem/mittlerem Risiko)
- Dreifach-Disclaimer
- PDF-Download der Antwortvorlage
- **localStorage-Counter** (3 Analysen frei, rote Ampel immer kostenlos)
- Impressum und Datenschutzerklärung
- Hosting auf Vercel (EU-Region)

### Should Have (2–4 Wochen nach Launch)

- Auth (Clerk, Google-Login)
- Payment (Stripe: Micro-Payment 0,99 € + 10er-Pack 4,99 €)
- Analyse-Historie
- PWA-Manifest
- DPA mit Anthropic

### Could Have (Monat 2–3)

- Manuelle PII-Kontrolle
- Chat-Rückfragen zum Dokument
- Mehrseitige Foto-Uploads
- Teilen-Funktion
- Frist-Erinnerung per E-Mail
- Google Cloud Vision als OCR-Upgrade
- Weitere Sprachen

### Won't Have

- Native App
- Offline-Modus
- Cloud-Dokumenten-Archiv
- Automatisierter Versand an Behörden
- Eigenständige Rechtsberatung / rechtliche Bewertung
- Begründeter Widerspruch
- Antwortgenerierung bei Hochrisiko-Bescheiden
- On-Device-KI

---

## 10. Kosten

| Posten | Kosten | Anmerkung |
|--------|--------|-----------|
| Vercel Hosting | 0 € | Hobby-Tier |
| Domain klaramt.app | ~12–15 €/Jahr | Cloudflare Domains |
| Claude API | ~0,03–0,05 € pro Analyse | Modellabhängig |
| Clerk Auth | 0 € | Bis 10.000 MAU |
| Supabase | 0 € | Free Tier |
| Stripe | 2,9% + 0,30 € pro Transaktion | Nur bei Bezahlung |
| **Gesamt Start** | **< 5 €/Monat** | Bei 0–500 Analysen |
| **Break-Even** | **~5–8 zahlende Nutzer** | 5 × 0,99 € + 1 × 4,99 € |

### Ab wann eigener Server?

| Analysen/Monat | Claude API Kosten | Eigener Server (Hetzner GPU) |
|----------------|-------------------|------------------------------|
| 1.000 | ~30–50 € | ~150–300 € |
| 5.000 | ~150–250 € | ~150–300 € |
| 10.000 | ~300–500 € | ~150–300 € |

Kipppunkt: circa 5.000–8.000 Analysen/Monat. Voraussetzung: Open-Source-Modell mit ausreichender Qualität für deutsches Verwaltungsrecht.

---

## 11. Zeitplan

### Phase 1: Prototyp (Woche 1–4)

**Woche 1–2: Kern validieren**
- Prompt-System testen (direkt in Claude.ai)
- 50 Testdokumente (synthetisch + echt aus eigenem Netzwerk)
- Regelbasierte Vorklassifikation entwickeln
- Deterministische Fristberechnung implementieren
- Ampel-Genauigkeit und Frist-Erkennung validieren
- Mehrsprachigen Output testen (5 Sprachen)
- Prompt iterativ verbessern

**Woche 3–4: Web-App bauen**
- Next.js aufsetzen, klaramt.app verbinden
- Upload-Seite: Foto / PDF, Vertrauens-UX, Consent
- API-Route: Upload → OCR/PDF-Parse → PII-Strip → Vorklassifikation → Claude → Zod-Validierung → Fristberechnung → Response
- Ergebnis-Anzeige: Ampel, Countdown, Zusammenfassung, Sprachwahlschalter
- localStorage-Counter
- Deploy auf Vercel, 5 Tester

### Phase 2: Beta (Woche 5–8)

**Woche 5: Antwortgenerator**
- Zweiter API-Call
- Dreifach-Disclaimer
- PDF-Export
- Bearbeitungsmöglichkeit

**Woche 6–7: Polish**
- Mobile-Optimierung
- Impressum, Datenschutzerklärung
- Fehlerbehandlung, Ladeanimation
- 20–30 Tester

**Woche 8: Stabilisierung**
- Bug-Fixes, Prompt-Verfeinerung
- PWA-Manifest
- Vorbereitung Payment (Stripe + Clerk anbinden)

---

## 12. Risiken

### Risiko 1: Falsche Frist-Erkennung (kritischstes Risiko)
Dreistufige Absicherung: Regelbasierte Vorklassifikation → LLM erkennt Bescheiddatum → deterministische Fristberechnung im Code. Plus Nutzer-Hinweis und Disclaimer. Im Zweifel immer rot.

### Risiko 2: RDG-Verstoß
Keine rechtliche Bewertung, keine Erfolgseinschätzung, keine begründeten Widersprüche. Dreifach-Disclaimer. Hochrisiko-Bescheide: kein Antwortgenerator. Sprachliche Regeln im Prompt verankert.

### Risiko 3: Datenschutz
Vertrauens-UX im Upload-Flow. PII-Stripping. Sofortige Löschung. DPA mit Anthropic. Transparent kommunizierte Einschränkungen. Post-MVP: eigener Server in DE.

### Risiko 4: Differenzierung gegen generische Chatbots
Die Ampel, der Frist-Countdown, die Risikokategorie, der Antwortgenerator und der Sprachwahlschalter müssen im ersten Nutzungsmoment spürbar besser sein als „Foto an ChatGPT schicken". Wenn das nicht der Fall ist, gibt es keinen Grund, KlarAmt zu nutzen.

### Risiko 5: Cold-Start / Kundenakquise
Kein bezahltes Marketing geplant. Wachstum über: Mundpropaganda (WhatsApp-Link teilen), B2B-Multiplikatoren (Beratungsstellen, Sozialarbeiter), Content-Marketing (Social Media). Web-App-Modell (kein Download nötig) senkt die Einstiegshürde maximal.

---

*Begleitdokument: `klaramt-prompt-system.md` enthält die vollständigen System-Prompts, die Vorklassifikation, die Fristberechnung und die Schema-Definition.*
