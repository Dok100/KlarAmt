import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
// pdf-parse v1: lib direkt laden — Haupteinstieg lädt eine Test-PDF die auf Vercel fehlt
// eslint-disable-next-line @typescript-eslint/no-require-imports
const pdfParse = require('pdf-parse/lib/pdf-parse') as (buf: Buffer) => Promise<{ text: string }>;
import { stripPII } from '@/lib/pii';
import { erkenneDokumenttyp, classifyKeywords, formatVorklassifikation } from '@/lib/classifier';
import { AnalyseSchema, verarbeiteFristen, istAntwortgenerierungErlaubt } from '@/lib/fristen';

export const maxDuration = 60;

const ANALYSE_SYSTEM_PROMPT = `Du bist KlarAmt, ein Experte für deutsche Behördenkorrespondenz. Du machst Behördenbriefe für Laien verständlich.

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
      "beratung_empfohlen": true,
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
   * Feste Zahlungstermine (z.B. "fällig am 23.06.2025"): frist_tage auf null setzen, Datum in bescheid_datum eintragen

4. HANDLUNGSHINWEISE (RDG-konform):
   - ERLAUBT: "Du kannst fristwahrend Einspruch einlegen." / "Einspruch ist möglich."
   - VERBOTEN: "Lege Einspruch ein." / "Der Einspruch lohnt sich." / "Die Behörde hat einen Fehler gemacht."
   - Du zeigst Möglichkeiten auf. Du empfiehlst NICHT.

5. ESKALATION (immer bei risikokategorie "hoch"):
   - Asyl/Aufenthalt → Migrationsberatung oder Anwalt Migrationsrecht
   - Strafbefehle → Anwalt Strafrecht
   - Zwangsvollstreckung → Schuldnerberatung oder Anwalt
   - Widerspruchsbescheide → Anwalt (nächster Schritt: Klage)
   - SGB-Leistungsentzug → Sozialberatung, Verbraucherzentrale, Anwalt Sozialrecht
   - Fahrverbot → Anwalt Verkehrsrecht

6. SPRACHE:
   - Einfache deutsche Alltagssprache. Duze den Empfänger.
   - Fachbegriffe nur mit sofortiger Erklärung.
   - Wenn eine Zielsprache angegeben ist: Alle Freitextfelder in der Zielsprache formulieren. Strukturfelder bleiben auf Deutsch.

7. KEIN BEHÖRDENSCHREIBEN:
   - dokumenttyp = "kein_behoerdenschreiben"
   - ampel.status = "gruen", risikokategorie = "niedrig"

8. ZAHLUNGSTYPEN (häufigste Fehlerquelle — sorgfältig unterscheiden):
   - ERSTATTUNG/GUTHABEN: Zu viel gezahlte Steuer wird zurücküberwiesen. Nutzer bekommt Geld.
   - NACHZAHLUNG: Fehlbetrag für abgelaufenes Steuerjahr. Nutzer muss aktiv zahlen.
   - VORAUSZAHLUNG: Abschlagszahlung auf künftige Steuer. Wird separat festgesetzt, oft per SEPA automatisch eingezogen.

   Enthält ein Bescheid GLEICHZEITIG eine Erstattung (Vorjahr) UND Vorauszahlungen (Folgejahr):
   - Zusammenfassung MUSS beide Vorgänge nennen — klar getrennt, ohne zu saldieren.
   - Korrekt: "Für 2024 bekommst du 99 Euro zurück. Gleichzeitig werden für 2025 Vorauszahlungen fällig: am 10.06. werden 391 Euro abgebucht."
   - Falsch: "Du musst 362 Euro zahlen" ohne zu erklären, dass es sich um eine Vorauszahlung handelt.
   - Falsch: Erstattung und Vorauszahlung gegeneinander aufrechnen — das sind zwei getrennte Vorgänge.
   - Bei SEPA-Mandat: Erwähnen, dass kein manuelles Überweisen nötig ist — nur Kontodeckung prüfen.
   - bedeutung_fuer_dich muss beide Flows getrennt benennen: was kommt rein (Erstattung), was geht raus (Vorauszahlung), wann.
   - Beträge immer direkt aus dem Dokument übernehmen — NIEMALS "ca.", NIEMALS schätzen oder runden. Wenn Beträge nicht lesbar sind, schreibe das explizit ("der genaue Betrag ist im Dokument nicht lesbar"). 362 + 29 = 391, nicht "ca. 391".
   - Nullbeträge (0 Euro) in der Zusammenfassung NICHT erwähnen. "0 Euro Solidaritätszuschlag" weglassen — nur Beträge > 0 nennen.

9. FRISTDARSTELLUNG (Vorsicht — Fehler hier haben rechtliche Konsequenzen):
   - Bekanntgabefiktion: Bescheid gilt 3 Tage nach Aufgabe als zugegangen (§ 122 Abs. 2 AO) — nicht am Druckdatum.
   - Das tatsächliche Zugangsdatum ist unbekannt. Fristen können nur geschätzt werden.
   - ampel.begruendung bei möglichem Fristablauf: NIEMALS kategorisch behaupten, die Frist sei abgelaufen. Stattdessen: "Das Bescheiddatum ist [Datum]. Die Einspruchsfrist beträgt einen Monat ab Bekanntgabe. Bitte prüfe das genaue Zugangsdatum."
   - Vorauszahlungs-Fälligkeiten (z. B. "fällig am 10.06.2025") sind KEINE Einspruchsfristen — sie sind Zahlungstermine, kein Rechtsbehelf. Nicht als Einspruchsfrist codieren.
   - Alle Fälligkeitstermine einzeln als separate Einträge in "fristen" erfassen. Wenn ein Bescheid 4 Quartalstermine enthält (März, Juni, September, Dezember), müssen alle 4 als eigene Fristen-Objekte erscheinen — nicht zusammenfassen, nicht nur den ersten nennen.`;

type VisionBlock =
  | { type: 'document'; source: { type: 'base64'; media_type: 'application/pdf'; data: string } }
  | { type: 'image'; source: { type: 'base64'; media_type: 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp'; data: string } };

type Extraktion =
  | { modus: 'text'; text: string }
  | { modus: 'vision'; block: VisionBlock };

async function extrahiereInhalt(file: File): Promise<Extraktion> {
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  if (file.type === 'application/pdf') {
    try {
      const result = await pdfParse(buffer);
      if (result.text && result.text.trim().length > 50) {
        return { modus: 'text', text: result.text };
      }
    } catch {
      // Scan-PDF → kein eingebetteter Text
    }

    // Scan-PDF → direkt als Dokument an Claude Vision
    return {
      modus: 'vision',
      block: {
        type: 'document',
        source: { type: 'base64', media_type: 'application/pdf', data: buffer.toString('base64') },
      },
    };
  }

  // Bild (JPEG, PNG, etc.) → direkt an Claude Vision
  const mediaType = file.type as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp';
  return {
    modus: 'vision',
    block: {
      type: 'image',
      source: { type: 'base64', media_type: mediaType, data: buffer.toString('base64') },
    },
  };
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const sprache = (formData.get('sprache') as string) || 'Deutsch';

    if (!file) {
      return NextResponse.json({ fehler: 'Keine Datei übermittelt.' }, { status: 400 });
    }

    const extraktion = await extrahiereInhalt(file);

    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const model = process.env.CLAUDE_MODEL || 'claude-haiku-4-5-20251001';

    let userMessageContent: Anthropic.MessageParam['content'];
    let textGekuerzt = false;

    if (extraktion.modus === 'text') {
      const saubererText = stripPII(extraktion.text);
      const dokumenttyp = erkenneDokumenttyp(saubererText);
      const keywords = classifyKeywords(saubererText);
      const vorklassifikation = formatVorklassifikation(dokumenttyp, keywords);

      const woerter = saubererText.split(/\s+/);
      textGekuerzt = woerter.length > 8000;
      const textFuerAnalyse = woerter.slice(0, 8000).join(' ');

      userMessageContent = `Analysiere das folgende behördliche Dokument.

VORKLASSIFIKATION (regelbasiert):
${vorklassifikation}

ZIELSPRACHE FÜR ERKLÄRUNG: ${sprache}

DOKUMENTTEXT:
---
${textFuerAnalyse}
---`;
    } else {
      userMessageContent = [
        extraktion.block as Anthropic.ImageBlockParam | Anthropic.DocumentBlockParam,
        {
          type: 'text' as const,
          text: `Analysiere das beigefügte behördliche Dokument.\n\nZIELSPRACHE FÜR ERKLÄRUNG: ${sprache}`,
        },
      ];
    }

    const message = await client.messages.create({
      model,
      max_tokens: 4000,
      temperature: 0.1,
      system: [{ type: 'text', text: ANALYSE_SYSTEM_PROMPT, cache_control: { type: 'ephemeral' } }],
      messages: [{ role: 'user', content: userMessageContent }],
    });

    const claudeAntwort = message.content[0].type === 'text' ? message.content[0].text : '';
    // Claude wickelt manchmal JSON in ```json ... ``` ein — Backticks entfernen
    const rawJson = claudeAntwort.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '').trim();

    let parsed;
    try {
      parsed = AnalyseSchema.parse(JSON.parse(rawJson));
    } catch (e) {
      console.error('Zod/JSON-Fehler:', e);
      console.error('Claude raw response (first 500 chars):', rawJson.slice(0, 500));
      return NextResponse.json({
        fehler: 'Die Analyse hat kein auswertbares Ergebnis geliefert. Bitte versuche es erneut.',
      }, { status: 500 });
    }

    const mitFristen = verarbeiteFristen(parsed);
    const antwortGate = istAntwortgenerierungErlaubt(parsed);

    return NextResponse.json({
      analyse: mitFristen,
      antwortgenerierung: antwortGate,
      meta: { ocrVerwendet: extraktion.modus === 'vision', textGekuerzt },
    });
  } catch (e) {
    console.error('Analyse-Fehler:', e);
    return NextResponse.json({ fehler: 'Ein unerwarteter Fehler ist aufgetreten. Bitte versuche es erneut.' }, { status: 500 });
  }
}
