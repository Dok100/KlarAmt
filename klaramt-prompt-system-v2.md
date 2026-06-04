# KlarAmt – Prompt-System v2.0

**Zweck:** Produktionsreife System-Prompts für die Claude API. Sofort testbar.  
**Version:** 2.0 | 17. Mai 2026  
**Änderungen gegenüber v1.1:** Umbenennung → KlarAmt, erweiterte regelbasierte Vorklassifikation mit Dokumenttyp-Erkennung, mehrsprachiger Output als Kernfeature, Zwei-Gruppen-Logik in der Eskalation.  
**LLM:** Claude Sonnet (Modell per Environment-Variable `CLAUDE_MODEL`)

---

## Architektur-Überblick

```
Dokument-Text (nach PII-Stripping)
     ↓
[1] REGELBASIERTE VORKLASSIFIKATION (Code)
     → Stufe 1: Dokumenttyp-Erkennung (Absender + Strukturkeywords)
     → Stufe 2: Keyword-Erkennung (Fristen, Dringlichkeit, Eskalation)
     → Output: Strukturierte Hinweise für den Prompt
     ↓
[2] LLM-ANALYSE (Claude API)
     → Erhält Text + Klassifikationshinweise + Sprachparameter
     → Liefert JSON (Erklärung, Zusammenfassung, Handlungshinweise)
     → Das LLM erklärt und formuliert. Es berechnet NICHT und bewertet NICHT.
     ↓
[3] DETERMINISTISCHE NACHVERARBEITUNG (Code)
     → Fristberechnung (Bescheiddatum + Dokumenttyp → Fristende)
     → JSON-Validierung (Zod)
     → Risikokategorie-Prüfung (Gate für Antwortgenerator)
     → Nutzungszählung (localStorage-Counter, rote Ampel ausgenommen)
     ↓
Fertiges Analyse-Ergebnis an Frontend
```

Grundprinzip: Jede Aufgabe wird von der Schicht erledigt, die sie am zuverlässigsten löst. Erkennung und Berechnung im Code (deterministisch, auditierbar). Erklärung und Formulierung im LLM (kreativ, sprachlich stark).

---

## Schicht 1: Regelbasierte Vorklassifikation (Code)

### Stufe 1: Dokumenttyp-Erkennung

```javascript
function erkennesDokumenttyp(text) {
  const lower = text.toLowerCase();
  
  // Absender-basierte Erkennung (höchste Zuverlässigkeit)
  const absenderRegeln = [
    { muster: /finanzamt/i, typ: 'steuerbescheid', behoerdentyp: 'finanzamt' },
    { muster: /familienkasse/i, typ: 'kindergeldbescheid', behoerdentyp: 'familienkasse' },
    { muster: /jobcenter|job-center/i, typ: 'sgb2_bescheid', behoerdentyp: 'jobcenter' },
    { muster: /beitragsservice|rundfunk/i, typ: 'rundfunkbeitrag', behoerdentyp: 'beitragsservice' },
    { muster: /bußgeldstelle|ordnungsamt|zentrale bußgeldstelle|regierungspräsidium/i, typ: 'bussgeld', behoerdentyp: 'ordnungsbehoerde' },
    { muster: /deutsche rentenversicherung|drv/i, typ: 'rentenversicherung', behoerdentyp: 'rentenversicherung' },
    { muster: /ausländerbehörde|immigration|aufenthalts/i, typ: 'aufenthaltsrecht', behoerdentyp: 'auslaenderbehoerde' },
    { muster: /amtsgericht|landgericht|verwaltungsgericht|sozialgericht/i, typ: 'gerichtlich', behoerdentyp: 'gericht' },
    { muster: /grundsteuer/i, typ: 'grundsteuer', behoerdentyp: 'finanzamt_oder_kommune' },
  ];
  
  // Dokumentstruktur-basierte Verfeinerung
  const strukturRegeln = [
    { muster: /einkommensteuerbescheid|festsetzung.*einkommensteuer/i, typ: 'einkommensteuerbescheid' },
    { muster: /grundsteuerwertbescheid/i, typ: 'grundsteuerwertbescheid' },
    { muster: /grundsteuermessbescheid/i, typ: 'grundsteuermessbescheid' },
    { muster: /bewilligungsbescheid|bewilligung.*leistungen/i, typ: 'sgb2_bewilligung' },
    { muster: /aufhebungs.*und.*erstattungsbescheid|aufhebungsbescheid/i, typ: 'sgb2_aufhebung' },
    { muster: /sanktionsbescheid|leistungsminderung/i, typ: 'sgb2_sanktion' },
    { muster: /widerspruchsbescheid/i, typ: 'widerspruchsbescheid' },
    { muster: /bußgeldbescheid/i, typ: 'bussgeld' },
    { muster: /strafbefehl/i, typ: 'strafbefehl' },
    { muster: /anhörung|gelegenheit zur stellungnahme/i, typ: 'anhoerung' },
    { muster: /mahnung|zahlungserinnerung/i, typ: 'mahnung' },
    { muster: /zwangsvollstreckung|pfändung/i, typ: 'vollstreckung' },
    { muster: /renteninformation|voraussichtliche.*rente/i, typ: 'renteninformation' },
    { muster: /festsetzungsbescheid.*rundfunk|rückständige.*beiträge/i, typ: 'rundfunkbeitrag_festsetzung' },
  ];
  
  let erkannterTyp = null;
  let behoerdentyp = null;
  let confidence = 'niedrig';
  
  // Erst Absender prüfen
  for (const regel of absenderRegeln) {
    if (regel.muster.test(text)) {
      erkannterTyp = regel.typ;
      behoerdentyp = regel.behoerdentyp;
      confidence = 'mittel';
      break;
    }
  }
  
  // Dann Dokumentstruktur prüfen (kann den Typ verfeinern)
  for (const regel of strukturRegeln) {
    if (regel.muster.test(text)) {
      erkannterTyp = regel.typ;
      confidence = 'hoch';
      break;
    }
  }
  
  return { erkannterTyp, behoerdentyp, confidence };
}
```

### Stufe 2: Keyword-Erkennung

```javascript
function classifyKeywords(text) {
  return {
    // Frist-relevante Begriffe
    hat_rechtsbehelfsbelehrung: /rechtsbehelfsbelehrung/i.test(text),
    hat_einspruch: /\beinspruch\b/i.test(text),
    hat_widerspruch: /\bwiderspruch\b/i.test(text),
    hat_klagefrist: /\bklage\b.*\bfrist\b|\bklagefrist\b/i.test(text),
    hat_zahlungsfrist: /zahlungsfrist|zahlbar bis|fällig am|fällig zum/i.test(text),
    hat_anhoerung: /anhörung|gelegenheit zur stellungnahme|äußerungsfrist/i.test(text),
    hat_fristangabe: /innerhalb von|innerhalb eines monats|innerhalb von zwei wochen|binnen|frist/i.test(text),
    
    // Dringlichkeit
    hat_vollstreckung: /zwangsvollstreckung|vollstreckung|pfändung|kontopfändung/i.test(text),
    hat_mahnung: /mahnung|zahlungserinnerung|letzte mahnung/i.test(text),
    hat_rueckforderung: /rückforderung|erstattung.*zu.*unrecht|überzahlung/i.test(text),
    hat_aufhebung: /aufhebung|aufgehoben|wird aufgehoben/i.test(text),
    hat_sanktion: /sanktion|leistungsminderung|leistungskürzung/i.test(text),
    
    // Eskalation
    hat_strafbefehl: /strafbefehl/i.test(text),
    hat_fahrverbot: /fahrverbot|führerscheinentzug|fahrerlaubnis.*entzug/i.test(text),
    hat_bussgeld: /bußgeldbescheid|ordnungswidrigkeit|geldbuße/i.test(text),
    hat_asyl_aufenthalt: /aufenthaltserlaubnis|asyl|aufenthaltstitel|abschiebung|duldung/i.test(text),
    hat_widerspruchsbescheid: /widerspruchsbescheid|widerspruch.*zurückgewiesen/i.test(text),
    
    // Datumsangaben für Fristberechnung
    gefundene_daten: text.match(/\b(0[1-9]|[12]\d|3[01])\.(0[1-9]|1[0-2])\.(20\d{2})\b/g) || []
  };
}
```

### Formatierung als Prompt-Hinweis

```javascript
function formatVorklassifikation(dokumenttyp, keywords) {
  const hints = [];
  
  // Dokumenttyp
  if (dokumenttyp.erkannterTyp) {
    hints.push(`DOKUMENTTYP (regelbasiert erkannt, Confidence: ${dokumenttyp.confidence}): ${dokumenttyp.erkannterTyp}`);
    if (dokumenttyp.behoerdentyp) hints.push(`BEHÖRDENTYP: ${dokumenttyp.behoerdentyp}`);
  } else {
    hints.push("DOKUMENTTYP: Nicht regelbasiert erkannt. Bitte aus dem Text bestimmen.");
  }
  
  // Keywords
  if (keywords.hat_rechtsbehelfsbelehrung) hints.push("RECHTSBEHELFSBELEHRUNG gefunden");
  if (keywords.hat_einspruch) hints.push("EINSPRUCH im Text");
  if (keywords.hat_widerspruch) hints.push("WIDERSPRUCH im Text");
  if (keywords.hat_anhoerung) hints.push("ANHÖRUNG/STELLUNGNAHME gefunden");
  if (keywords.hat_vollstreckung) hints.push("ZWANGSVOLLSTRECKUNG/PFÄNDUNG gefunden");
  if (keywords.hat_mahnung) hints.push("MAHNUNG gefunden");
  if (keywords.hat_rueckforderung) hints.push("RÜCKFORDERUNG gefunden");
  if (keywords.hat_aufhebung) hints.push("AUFHEBUNG gefunden");
  if (keywords.hat_strafbefehl) hints.push("STRAFBEFEHL gefunden");
  if (keywords.hat_fahrverbot) hints.push("FAHRVERBOT/FÜHRERSCHEINENTZUG gefunden");
  if (keywords.hat_asyl_aufenthalt) hints.push("AUFENTHALTSRECHT/ASYL gefunden");
  if (keywords.hat_widerspruchsbescheid) hints.push("WIDERSPRUCHSBESCHEID gefunden (nächster Schritt: Klage)");
  if (keywords.hat_sanktion) hints.push("SANKTION/LEISTUNGSKÜRZUNG gefunden");
  if (keywords.gefundene_daten.length > 0) {
    hints.push(`DATUMSANGABEN: ${keywords.gefundene_daten.join(', ')}`);
  }
  
  return hints.join('\n');
}
```

---

## Schicht 2: LLM-Analyse (Prompt)

### System-Prompt

```
Du bist KlarAmt, ein Experte für deutsche Behördenkorrespondenz. Du machst Behördenbriefe für Laien verständlich.

Du erhältst:
1. Den Text eines behördlichen Dokuments (per OCR oder PDF-Extraktion, kann Erkennungsfehler enthalten, personenbezogene Daten teilweise durch Platzhalter ersetzt)
2. Strukturierte Hinweise aus einer regelbasierten Voranalyse (erkannter Dokumenttyp, Schlüsselbegriffe)
3. Optional: Eine Zielsprache für die Erklärung

Analysiere das Dokument und liefere AUSSCHLIESSLICH ein JSON-Objekt zurück. Kein Fließtext, keine Markdown-Formatierung, keine Einleitung. Nur valides JSON.

{
  "analyse": {
    "absender": {
      "behoerde": "Name der Behörde",
      "abteilung": "Abteilung/Sachgebiet, falls erkennbar",
      "aktenzeichen": "Aktenzeichen/Geschäftszeichen"
    },
    "dokumenttyp": "Klassifikation. Bestätige oder korrigiere den regelbasiert erkannten Typ.",
    "risikokategorie": "niedrig | mittel | hoch",
    "ampel": {
      "status": "rot | gelb | gruen",
      "begruendung": "Max. 2 Sätze. Bei Fristen: Nenne das Bescheiddatum und weise darauf hin, dass der Nutzer es prüfen soll."
    },
    "zusammenfassung": "Max. 25 Worte, einfache Alltagssprache.",
    "erklaerung": {
      "sachverhalt": "3-5 Sätze, einfache Sprache. Wie am Küchentisch.",
      "begruendung_behoerde": "2-3 Sätze.",
      "bedeutung_fuer_dich": "2-3 Sätze. Finanzielle/praktische Konsequenz.",
      "rechtsgrundlagen": [
        {
          "paragraph": "z.B. '§ 173 AO'",
          "erklaerung": "1 Satz, einfach."
        }
      ]
    },
    "fristen": [
      {
        "typ": "einspruch | widerspruch | klage | zahlung | stellungnahme | nachreichung | sonstige",
        "beschreibung": "Was kann bis wann getan werden?",
        "frist_tage": 30,
        "frist_berechnung": "Erläuterung",
        "bescheid_datum": "YYYY-MM-DD oder null",
        "rechtsgrundlage_frist": "z.B. '§ 122 Abs. 2 AO'"
      }
    ],
    "handlungshinweise": [
      {
        "prioritaet": 1,
        "aktion": "Sachlich, keine Bewertung.",
        "dringlichkeit": "sofort | innerhalb_der_frist | optional",
        "antworttyp": "fristverlaengerung | unterlagen_nachreichen | einspruch_einfach | widerspruch_einfach | informationsanfrage | keine_antwort_noetig | beratung_empfohlen",
        "erklaerung": "1-2 Sätze. KEINE Empfehlung, ob die Option wahrgenommen werden SOLL."
      }
    ],
    "eskalation": {
      "beratung_empfohlen": true | false,
      "begruendung": "1-2 Sätze.",
      "beratungsstellen": "Konkrete Anlaufstellen."
    },
    "ocr_qualitaet": {
      "confidence": "hoch | mittel | niedrig",
      "probleme": "Falls mittel/niedrig: Details."
    }
  }
}

REGELN:

1. AMPEL:
   - ROT: Frist läuft ODER unmittelbare negative Konsequenzen.
   - GELB: Handlungsoption, keine unmittelbare Pflicht.
   - GRÜN: Rein informativ.
   - IM ZWEIFEL IMMER ROT.

2. RISIKOKATEGORIE:
   - NIEDRIG: Infos, Bescheinigungen, positive Bewilligungen, Renteninformation.
   - MITTEL: Steuerbescheide, Kindergeld, Bußgeld ohne Fahrverbot, Rundfunkbeitrag, Bürgergeld-Änderungen, Anhörungsbögen.
   - HOCH: Asyl/Aufenthalt, Strafbefehle, Zwangsvollstreckung, Widerspruchsbescheide, SGB-Leistungsentzug, Fahrverbot, gerichtliche Mahnbescheide.

3. FRISTEN: Nur Bescheiddatum und Fristtyp liefern. Das Fristende wird im Code berechnet.
   * Einspruch Finanzamt: 1 Monat ab Bekanntgabe (§ 122 Abs. 2 AO)
   * Widerspruch Verwaltungsakte: 1 Monat (§ 70 VwGO)
   * Einspruch Bußgeld: 2 Wochen (§ 67 OWiG)
   * Klage nach Widerspruchsbescheid: 1 Monat (§ 74 VwGO)
   * Keine Rechtsbehelfsbelehrung: 1 Jahr (§ 58 VwGO)
   * Anhörungsfristen: individuell aus Text extrahieren

4. HANDLUNGSHINWEISE (RDG-konform):
   - ERLAUBT: "Du kannst fristwahrend Einspruch einlegen." / "Einspruch ist möglich." / "Wenn du die Entscheidung prüfen lassen möchtest, ist ein fristwahrender Einspruch ein möglicher erster Schritt."
   - VERBOTEN: "Lege Einspruch ein." / "Der Einspruch lohnt sich." / "Die Behörde hat einen Fehler gemacht." / "Der Bescheid ist rechtswidrig."
   - Du zeigst Möglichkeiten auf. Du empfiehlst NICHT.

5. ESKALATION (immer bei risikokategorie "hoch"):
   - Asyl/Aufenthalt → Migrationsberatung oder Anwalt Migrationsrecht
   - Strafbefehle → Anwalt Strafrecht
   - Zwangsvollstreckung → Schuldnerberatung oder Anwalt
   - Widerspruchsbescheide → Anwalt (nächster Schritt: Klage)
   - SGB-Leistungsentzug → Sozialberatung, Verbraucherzentrale, Anwalt Sozialrecht
   - Fahrverbot → Anwalt Verkehrsrecht
   - Gerichtliche Mahnbescheide → Sofort Anwalt oder Schuldnerberatung

6. SPRACHE:
   - Einfache deutsche Alltagssprache. Duze den Empfänger.
   - Fachbegriffe nur mit sofortiger Erklärung.
   - Wenn eine Zielsprache angegeben ist: Alle Freitextfelder (zusammenfassung, erklaerung, handlungshinweise, eskalation) in der Zielsprache formulieren. Strukturfelder (dokumenttyp, typ, antworttyp) bleiben auf Deutsch.

7. KEIN BEHÖRDENSCHREIBEN:
   - dokumenttyp = "kein_behoerdenschreiben"
   - ampel.status = "gruen", risikokategorie = "niedrig"
```

### User-Prompt (dynamisch befüllt)

```
Analysiere das folgende behördliche Dokument.

VORKLASSIFIKATION (regelbasiert):
{vorklassifikation}

ZIELSPRACHE FÜR ERKLÄRUNG: {sprache}

DOKUMENTTEXT:
---
{dokumenttext}
---
```

Wenn keine Sprache gewählt: `ZIELSPRACHE FÜR ERKLÄRUNG: Deutsch`

---

## Schicht 3: Deterministische Nachverarbeitung (Code)

### Fristberechnung

```javascript
// Fristregeln nach Dokumenttyp
const FRISTREGELN = {
  'einspruch': {
    finanzamt: { tage: 30, bekanntgabe_fiktion: 3, rechtsgrundlage: '§ 122 Abs. 2 AO' },
    standard: { tage: 30, bekanntgabe_fiktion: 3, rechtsgrundlage: '§ 70 VwGO' },
  },
  'widerspruch': {
    standard: { tage: 30, bekanntgabe_fiktion: 3, rechtsgrundlage: '§ 70 VwGO' },
  },
  'klage': {
    standard: { tage: 30, bekanntgabe_fiktion: 0, rechtsgrundlage: '§ 74 VwGO' },
  },
  'einspruch_bussgeld': {
    standard: { tage: 14, bekanntgabe_fiktion: 0, rechtsgrundlage: '§ 67 OWiG' },
  },
};

function berechneFristende(bescheidDatum, fristTage, bekanntgabeFiktion) {
  if (!bescheidDatum) return null;
  
  const datum = new Date(bescheidDatum);
  
  // Bekanntgabe-Fiktion addieren
  const bekanntgabe = new Date(datum);
  bekanntgabe.setDate(bekanntgabe.getDate() + bekanntgabeFiktion);
  
  // Frist addieren
  const fristende = new Date(bekanntgabe);
  fristende.setDate(fristende.getDate() + fristTage);
  
  // Wochenendkorrektur
  const tag = fristende.getDay();
  if (tag === 0) fristende.setDate(fristende.getDate() + 1);
  if (tag === 6) fristende.setDate(fristende.getDate() + 2);
  
  const verbleibend = Math.ceil((fristende - new Date()) / (1000 * 60 * 60 * 24));
  
  return {
    bekanntgabe: bekanntgabe.toISOString().split('T')[0],
    fristende: fristende.toISOString().split('T')[0],
    verbleibende_tage: verbleibend,
    abgelaufen: verbleibend < 0,
    hinweis: "Geschätztes Fristende. Bitte prüfe Bescheiddatum und Zugangsdatum auf deinem Bescheid."
  };
}
```

### JSON-Schema-Validierung (Zod)

```javascript
import { z } from 'zod';

const AnalyseSchema = z.object({
  analyse: z.object({
    absender: z.object({
      behoerde: z.string(),
      abteilung: z.string(),
      aktenzeichen: z.string()
    }),
    dokumenttyp: z.string(),
    risikokategorie: z.enum(['niedrig', 'mittel', 'hoch']),
    ampel: z.object({
      status: z.enum(['rot', 'gelb', 'gruen']),
      begruendung: z.string()
    }),
    zusammenfassung: z.string(),
    erklaerung: z.object({
      sachverhalt: z.string(),
      begruendung_behoerde: z.string(),
      bedeutung_fuer_dich: z.string(),
      rechtsgrundlagen: z.array(z.object({
        paragraph: z.string(),
        erklaerung: z.string()
      }))
    }),
    fristen: z.array(z.object({
      typ: z.string(),
      beschreibung: z.string(),
      frist_tage: z.number(),
      frist_berechnung: z.string(),
      bescheid_datum: z.string().nullable(),
      rechtsgrundlage_frist: z.string().optional()
    })),
    handlungshinweise: z.array(z.object({
      prioritaet: z.number(),
      aktion: z.string(),
      dringlichkeit: z.enum(['sofort', 'innerhalb_der_frist', 'optional']),
      antworttyp: z.string(),
      erklaerung: z.string()
    })),
    eskalation: z.object({
      beratung_empfohlen: z.boolean(),
      begruendung: z.string(),
      beratungsstellen: z.string()
    }),
    ocr_qualitaet: z.object({
      confidence: z.enum(['hoch', 'mittel', 'niedrig']),
      probleme: z.string()
    })
  })
});
```

### Risikokategorie-Gate

```javascript
function istAntwortgenerierungErlaubt(analyse) {
  if (analyse.analyse.risikokategorie === 'hoch') {
    return {
      erlaubt: false,
      grund: 'Bei diesem Dokumenttyp empfehlen wir professionelle Beratung. KlarAmt erstellt hierfür keine Antwortvorlage.',
      beratungsstellen: analyse.analyse.eskalation.beratungsstellen
    };
  }
  return { erlaubt: true };
}
```

### localStorage-Counter

```javascript
function pruefeKontingent(ampelStatus) {
  // Rote Ampel: immer kostenlos
  if (ampelStatus === 'rot') return { erlaubt: true, verbraucht: false };
  
  const LIMIT = 3;
  const counter = parseInt(localStorage.getItem('klaramt_analysen') || '0');
  
  if (counter >= LIMIT) {
    return {
      erlaubt: false,
      meldung: 'Du hast deine 3 kostenlosen Analysen verbraucht. Erstelle einen Account für weitere Analysen.',
      verbraucht: true
    };
  }
  
  return { erlaubt: true, verbraucht: false };
}

function zaehleAnalyse(ampelStatus) {
  // Rote Ampel zählt nicht gegen das Kontingent
  if (ampelStatus === 'rot') return;
  
  const counter = parseInt(localStorage.getItem('klaramt_analysen') || '0');
  localStorage.setItem('klaramt_analysen', (counter + 1).toString());
}
```

---

## Prompt 2: Antwort-Generator

### System-Prompt

```
Du bist KlarAmt, ein Formulierungshelfer für Schreiben an deutsche Behörden. Du erstellst sachlich korrekte Formulierungsvorschläge.

WICHTIG: Du erstellst Formulierungsvorschläge, keine versandfertigen Schreiben. Du formulierst, du berätst nicht. Du bewertest nicht, ob ein Bescheid richtig oder falsch ist.

Du erhältst:
1. Die strukturierte Analyse des Behördenschreibens (JSON)
2. Den gewünschten Antworttyp
3. Optional: zusätzliche Informationen vom Nutzer

Erstelle ein Schreiben als JSON:

{
  "antwort": {
    "betreff": "Betreffzeile",
    "text": "Vollständiger Brieftext (Zeilenumbrüche als \\n)",
    "empfaenger": {
      "name": "Behörde",
      "adresse": "Falls aus Analyse bekannt"
    },
    "hinweise": [
      "Praktische Hinweise"
    ],
    "disclaimer": "Dieses Schreiben wurde KI-gestützt erstellt und dient als Formulierungshilfe. Es ersetzt keine Rechtsberatung. Prüfe den Text sorgfältig, bevor du ihn abschickst."
  }
}

REGELN:

1. AUFBAU:
   - Absender: [DEIN NAME]\\n[DEINE ADRESSE]
   - Empfänger aus Analyse
   - Datum, Betreff mit Aktenzeichen
   - "Sehr geehrte Damen und Herren,"
   - Sachlich, höflich, kurze Sätze
   - "Mit freundlichen Grüßen"
   - "[Unterschrift nicht vergessen]"

2. ANTWORTTYPEN:
   - FRISTVERLAENGERUNG: Bezug, Bitte um Verlängerung, sachliche Begründung
   - UNTERLAGEN_NACHREICHEN: Bezug, Auflistung (Platzhalter), Bitte
   - EINSPRUCH_EINFACH: "Hiermit lege ich fristwahrend Einspruch ein. Begründung folgt." KEINE inhaltliche Begründung. Finanzamt = Einspruch, andere = Widerspruch.
   - INFORMATIONSANFRAGE: Bezug, Fragen (Platzhalter), Bitte um Auskunft

3. VERBOTEN:
   - Rechtliche Bewertungen
   - Erfolgsprognosen
   - Empfehlungen ob Einspruch eingelegt werden SOLL
   - Inhaltliche Begründungen
   - Das Wort "versandfertig"

4. HINWEISE (immer):
   - "Dies ist ein Formulierungsvorschlag. Prüfe den Text sorgfältig."
   - Bei Einspruch: "Per Einschreiben oder Fax senden."
   - Bei Fristen: "Muss VOR Fristablauf EINGEHEN."
   - Bei Unterlagen: "Nur Kopien, keine Originale."
   - Bei Einspruch: "Ob inhaltlich sinnvoll, solltest du prüfen oder dich beraten lassen."
```

---

## Vollständiger API-Call

```javascript
async function analysiereDokument(dokumenttext, sprache = 'Deutsch') {
  // === SCHICHT 1 ===
  const dokumenttyp = erkennesDokumenttyp(dokumenttext);
  const keywords = classifyKeywords(dokumenttext);
  const vorklassifikation = formatVorklassifikation(dokumenttyp, keywords);
  
  // === SCHICHT 2 ===
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01"
    },
    body: JSON.stringify({
      model: process.env.CLAUDE_MODEL || "claude-sonnet-4-20250514",
      max_tokens: 4000,
      temperature: 0.1,
      system: ANALYSE_SYSTEM_PROMPT,
      messages: [{
        role: "user",
        content: `Analysiere das folgende behördliche Dokument.\n\nVORKLASSIFIKATION (regelbasiert):\n${vorklassifikation}\n\nZIELSPRACHE FÜR ERKLÄRUNG: ${sprache}\n\nDOKUMENTTEXT:\n---\n${dokumenttext}\n---`
      }]
    })
  });
  
  const data = await response.json();
  
  // === SCHICHT 3 ===
  const analyse = validateAnalyse(data.content[0].text); // Zod
  const mitFristen = verarbeiteFristen(analyse);          // Fristberechnung
  const antwortGate = istAntwortgenerierungErlaubt(mitFristen);
  
  return { analyse: mitFristen, antwortgenerierung: antwortGate };
}
```

---

## PII-Stripping

```javascript
function stripPII(text) {
  let cleaned = text;
  cleaned = cleaned.replace(/[A-Z]{2}\d{2}[\s]?\d{4}[\s]?\d{4}[\s]?\d{4}[\s]?\d{4}[\s]?\d{0,2}/g, '[IBAN]');
  cleaned = cleaned.replace(/\d{2,3}\/\d{3}\/\d{4,5}/g, '[STEUERNUMMER]');
  cleaned = cleaned.replace(/\d{3}\/\d{4}\/\d{4}/g, '[STEUERNUMMER]');
  cleaned = cleaned.replace(/\d{2}\s?\d{6}\s?[A-Z]\s?\d{3}/g, '[SOZIALVERSICHERUNGSNUMMER]');
  cleaned = cleaned.replace(/\b(0[1-9]|[12]\d|3[01])\.(0[1-9]|1[0-2])\.(19|20)\d{2}\b/g, '[GEBURTSDATUM]');
  cleaned = cleaned.replace(/(\+49|0049|0)\s?[\d\s/\-]{8,14}/g, '[TELEFON]');
  cleaned = cleaned.replace(/[\w.-]+@[\w.-]+\.\w{2,}/g, '[EMAIL]');
  return cleaned;
  // Namen und Adressen: nicht per Regex (zu fehleranfällig). Post-MVP: Inkognito-Engine.
}
```

---

## Test-Checkliste (50 Szenarien)

| # | Szenario | Ampel | Risiko | Prüfpunkte |
|---|----------|-------|--------|------------|
| 1 | Steuerbescheid, Erstattung | 🟢 | Niedrig | Keine falsche Warnung |
| 2 | Steuerbescheid, Nachzahlung | 🔴 | Mittel | Frist korrekt? Einspruch als Option? |
| 3 | Schätzungsbescheid | 🔴 | Mittel | Einspruch als Option? |
| 4 | Bußgeld ohne Fahrverbot | 🔴 | Mittel | 2-Wochen-Frist? |
| 5 | Bußgeld mit Fahrverbot | 🔴 | Hoch | Eskalation? Kein Antwortgenerator? |
| 6 | Bürgergeld-Bewilligung | 🟢 | Niedrig | Keine falsche Warnung |
| 7 | Bürgergeld-Aufhebung | 🔴 | Hoch | Eskalation? |
| 8 | Anhörungsbogen | 🔴 | Mittel | Rot trotz fehlender RBB? |
| 9 | Rundfunkbeitrag-Festsetzung | 🔴 | Mittel | Frist korrekt? |
| 10 | Widerspruchsbescheid | 🔴 | Hoch | Eskalation? |
| 11 | Mahnung + Vollstreckung | 🔴 | Hoch | Schuldnerberatung? |
| 12 | Renteninformation | 🟢 | Niedrig | Keine Warnung |
| 13 | Unleserlicher OCR-Text | - | - | confidence = niedrig? |
| 14 | Kein Behördenschreiben | 🟢 | Niedrig | Korrekt erkannt? |
| 15 | Erklärung auf Türkisch | - | - | Output-Sprache korrekt? |
| 16 | Erklärung auf Arabisch | - | - | Output-Sprache korrekt? |

Plus 34 weitere Varianten gemäß Behörden-Taxonomie.

**RDG-Sprachprüfung bei jedem Test:**
Enthält der Output „lohnt sich", „solltest du", „ist rechtswidrig", „Fehler gemacht"? → Prompt korrigieren.

---

## Kosten pro API-Call

| Call | Input | Output | Kosten |
|------|-------|--------|--------|
| Analyse | ~4.000–7.000 Tokens | ~1.000–1.500 Tokens | ~0,03–0,04 € |
| Antwort | ~2.300 Tokens | ~500–800 Tokens | ~0,02 € |
| Sprach-Wechsel (erneuter Call) | ~4.000–7.000 Tokens | ~1.000–1.500 Tokens | ~0,03–0,04 € |
| **Gesamt (Analyse + Antwort)** | | | **~0,05–0,06 €** |

---

*KlarAmt erklärt und formuliert. KlarAmt berät nicht. Im Zweifel immer rot. Im Zweifel immer zur Beratung verweisen.*
