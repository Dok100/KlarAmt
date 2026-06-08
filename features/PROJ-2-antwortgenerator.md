# PROJ-2: Antwortgenerator

## Ziel

Der Nutzer kann zu einem analysierten Bescheid einen fristwahrenden Standard-Antwortbrief
erzeugen, bearbeiten und als PDF herunterladen — ohne juristische Begründung, RDG-konform.

## Nutzerproblem

Nach der Analyse weiß der Nutzer, dass er z.B. fristwahrend Einspruch einlegen oder Unterlagen
nachreichen kann — aber nicht, wie er das formuliert. Ein leeres Blatt vor einer Behörde ist eine
echte Hürde. KlarAmt liefert die formale Hülle, die der Nutzer nur noch ausfüllen muss.

## Scope

- Neue API-Route `/api/antwort`: zweiter Claude-Call, erzeugt einen formalen Brief aus
  Analyse-Kontext + gewähltem Antworttyp
- Antworttypen werden aus den Handlungshinweisen (`antworttyp`) der Analyse abgeleitet,
  gefiltert auf die generierbaren: fristverlaengerung, unterlagen_nachreichen,
  einspruch_einfach, widerspruch_einfach, informationsanfrage
- Gate: nur bei Risikokategorie niedrig/mittel (Hochrisiko blockt schon `istAntwortgenerierungErlaubt`)
- Persönliche Daten als Platzhalter (`[DEIN NAME]`, `[DEINE ADRESSE]`) — Nutzer füllt im Textfeld aus
- Editierbares Textfeld mit dem generierten Brief
- Disclaimer direkt über dem Ergebnis (dritte Disclaimer-Ebene: vor Export)
- Export: "In Zwischenablage kopieren" + "Als PDF herunterladen" (jsPDF, client-seitig)

## Out-of-scope

- Kein begründeter Widerspruch / keine inhaltliche Argumentation (RDG-Risiko)
- Keine Bewertung, ob ein Einspruch Aussicht auf Erfolg hat
- Kein Versand (nur Erzeugung + Download)
- Keine Speicherung des Briefs
- Hochrisiko-Bescheide bekommen keinen Generator (Beratungsempfehlung stattdessen)

## Akzeptanzkriterien

- [ ] Bei Risiko niedrig/mittel erscheinen wählbare Antworttypen passend zu den Handlungshinweisen
- [ ] Auswahl eines Typs erzeugt einen formalen, fristwahrenden Brief ohne Begründung
- [ ] Brief enthält Behörde, Aktenzeichen, Datum, Platzhalter für persönliche Daten
- [ ] Brief ist im Textfeld editierbar
- [ ] Disclaimer steht über dem Brief
- [ ] Kopieren und PDF-Download funktionieren, Umlaute korrekt im PDF
- [ ] Bei Hochrisiko erscheint kein Generator, sondern die Beratungsempfehlung (unverändert)

## Edge Cases

- Keine generierbaren Antworttypen in den Handlungshinweisen → Generator nicht anzeigen
- API-Fehler → Fehlermeldung, Auswahl bleibt erhalten
- Sehr langer Brief → PDF mehrseitig (jsPDF splitTextToSize + Seitenumbruch)

## Technische Notizen

- `/api/antwort`: nicht-streamend (Brief ist kurz, weit unter Timeout). JSON `{ brief: string }`
- Eigener RDG-sicherer System-Prompt mit Prompt Caching
- jsPDF client-seitig, StandardFont Helvetica (WinAnsi → Umlaute ok)
- Antwortgenerator-Block ersetzt den bisherigen "kommt bald"-Button auf der Ergebnis-Seite
