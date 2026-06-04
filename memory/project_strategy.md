---
name: project-strategy
description: Kerntentscheidungen zu Produkt, Strategie und Compliance bei KlarAmt — nicht erneut diskutieren
metadata:
  type: project
---

KlarAmt macht deutsche Behördenpost verständlich: Foto/PDF → PII-Strip → Vorklassifikation → Claude → Ampel + Frist + Erklärung + Antwortvorlage. Ziel: unter 3 Minuten vom Briefkasten zum Verstehen.

**Zwei-Gruppen-Strategie:**
- Gruppe A ("Will nicht"): gebildete Berufstätige, zahlen für Komfort
- Gruppe B ("Kann nicht"): Migranten, ältere Menschen, prekäre Lagen — existenzieller Bedarf
- Für B optimieren, mit A monetarisieren.

**Why:** Ohne diese Trennung baut man ein Premium-Produkt das die dringendste Zielgruppe ausschließt.

**Kern-Commitments (nicht neu diskutieren):**
- Rote Ampel immer kostenlos, auch nach Kontingent-Erschöpfung. Immer.
- Kein begründeter Widerspruch (RDG-Risiko zu hoch)
- Hochrisiko-Bescheide (Asyl, Strafbefehl, Zwangsvollstreckung): nur Erklärung + Beratungsstellenverweis, kein Antwortgenerator
- Dreifach-Disclaimer: vor Nutzung, im Ergebnis, vor Export
- Mehrsprachiger Output (Türkisch, Arabisch, Ukrainisch, Englisch) ist Kernfeature — UI bleibt Deutsch

**Monetarisierung (Post-MVP, erst nach Validierung):**
- localStorage-Counter (3 Analysen frei) von Anfang an als Kostenschutz
- Dann: 0,99€/Antwortvorlage (Micro-Payment) + 10er-Pack 4,99€
- Kein Abo zum Start

**Sackgassen (nie wieder vorschlagen):**
- Native App (iOS/Android)
- On-Device-KI
- Eigener Server (erst ab ~5.000 Analysen/Monat)
- Manueller PII-Review vor Analyse im MVP
- Abo-Modell zum Start
