import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
// pdf-parse ist ein CommonJS-Modul ohne ESM-Default-Export
// eslint-disable-next-line @typescript-eslint/no-require-imports
const pdfParse = require('pdf-parse') as (buf: Buffer) => Promise<{ text: string }>;
import { stripPII } from '@/lib/pii';
import { erkenneDokumenttyp, classifyKeywords, formatVorklassifikation } from '@/lib/classifier';
import { AnalyseSchema, verarbeiteFristen, istAntwortgenerierungErlaubt } from '@/lib/fristen';

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
   - ampel.status = "gruen", risikokategorie = "niedrig"`;

async function pdfSeitenAlsbilder(pdfBuffer: Buffer): Promise<Buffer[]> {
  const { execFile } = await import('child_process');
  const { promisify } = await import('util');
  const { mkdtemp, readdir, readFile, rm } = await import('fs/promises');
  const { join } = await import('path');
  const { tmpdir } = await import('os');
  const execFileAsync = promisify(execFile);

  const tmpDir = await mkdtemp(join(tmpdir(), 'klaramt-pdf-'));
  const inputPath = join(tmpDir, 'input.pdf');
  const outputPrefix = join(tmpDir, 'seite');

  try {
    await import('fs/promises').then(fs => fs.writeFile(inputPath, pdfBuffer));

    // pdftoppm: PDF-Seiten als PNG, max 6 Seiten, 200 DPI
    await execFileAsync('pdftoppm', [
      '-png', '-r', '200', '-l', '6',
      inputPath, outputPrefix,
    ]);

    const dateien = (await readdir(tmpDir))
      .filter(f => f.endsWith('.png'))
      .sort();

    return await Promise.all(dateien.map(f => readFile(join(tmpDir, f))));
  } finally {
    await rm(tmpDir, { recursive: true, force: true });
  }
}

async function ocrAufBild(bildBuffer: Buffer | Blob, worker: import('tesseract.js').Worker): Promise<string> {
  const { data } = await worker.recognize(bildBuffer);
  return data.text;
}

async function extrahiereText(file: File): Promise<{ text: string; ocrVerwendet: boolean }> {
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  if (file.type === 'application/pdf') {
    // Schritt 1: Text-PDF direkt parsen
    try {
      const result = await pdfParse(buffer);
      if (result.text && result.text.trim().length > 50) {
        return { text: result.text, ocrVerwendet: false };
      }
    } catch {
      // Scan-PDF → kein Text eingebettet
    }

    // Schritt 2: Scan-PDF → Seiten als Bilder rendern → OCR
    try {
      const { createWorker } = await import('tesseract.js');
      const worker = await createWorker('deu');
      try {
        const bilder = await pdfSeitenAlsbilder(buffer);
        const texte = await Promise.all(bilder.map(b => ocrAufBild(b, worker)));
        const gesamtText = texte.join('\n\n');
        if (gesamtText.trim().length > 20) {
          return { text: gesamtText, ocrVerwendet: true };
        }
      } finally {
        await worker.terminate();
      }
    } catch (e) {
      console.error('PDF-Rendering fehlgeschlagen:', e);
    }
  }

  // Fotos: OCR direkt auf das Bild
  const { createWorker } = await import('tesseract.js');
  const worker = await createWorker('deu');

  const ocrTimeout = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error('OCR Timeout')), 8000)
  );

  try {
    const blob = new Blob([buffer], { type: file.type });
    const { data } = await Promise.race([
      worker.recognize(blob),
      ocrTimeout,
    ]);
    return { text: data.text, ocrVerwendet: true };
  } finally {
    await worker.terminate();
  }
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const sprache = (formData.get('sprache') as string) || 'Deutsch';

    if (!file) {
      return NextResponse.json({ fehler: 'Keine Datei übermittelt.' }, { status: 400 });
    }

    // Schicht 1a: Text extrahieren
    let rawText: string;
    let ocrVerwendet: boolean;
    try {
      ({ text: rawText, ocrVerwendet } = await extrahiereText(file));
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Unbekannter Fehler';
      if (msg === 'OCR Timeout') {
        return NextResponse.json({
          fehler: 'Die Texterkennung hat zu lange gedauert. Bitte fotografiere den Brief erneut bei guter Beleuchtung oder lade eine PDF hoch.',
        }, { status: 422 });
      }
      return NextResponse.json({ fehler: 'Der Text konnte nicht erkannt werden. Bitte als PDF hochladen oder erneut fotografieren.' }, { status: 422 });
    }

    if (!rawText || rawText.trim().length < 20) {
      return NextResponse.json({
        fehler: 'Der Text konnte nicht vollständig erkannt werden. Bitte als PDF hochladen oder erneut fotografieren.',
      }, { status: 422 });
    }

    // Schicht 1b: PII entfernen
    const saubererText = stripPII(rawText);

    // Schicht 1c: Vorklassifikation
    const dokumenttyp = erkenneDokumenttyp(saubererText);
    const keywords = classifyKeywords(saubererText);
    const vorklassifikation = formatVorklassifikation(dokumenttyp, keywords);

    // Schicht 2: Claude API
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    // Sehr lange Texte kürzen (ca. 8.000 Wörter)
    const textFuerAnalyse = saubererText.split(/\s+/).slice(0, 8000).join(' ');
    const textGekuerzt = saubererText.split(/\s+/).length > 8000;

    const userPrompt = `Analysiere das folgende behördliche Dokument.

VORKLASSIFIKATION (regelbasiert):
${vorklassifikation}

ZIELSPRACHE FÜR ERKLÄRUNG: ${sprache}

DOKUMENTTEXT:
---
${textFuerAnalyse}
---`;

    const message = await client.messages.create({
      model: process.env.CLAUDE_MODEL || 'claude-sonnet-4-6',
      max_tokens: 4000,
      temperature: 0.1,
      system: ANALYSE_SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userPrompt }],
    });

    const claudeAntwort = message.content[0].type === 'text' ? message.content[0].text : '';
    // Claude wickelt manchmal JSON in ```json ... ``` ein — Backticks entfernen
    const rawJson = claudeAntwort.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '').trim();

    // Schicht 3a: Zod-Validierung
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

    // Schicht 3b: Fristberechnung
    const mitFristen = verarbeiteFristen(parsed);

    // Schicht 3c: Gate für Antwortgenerator
    const antwortGate = istAntwortgenerierungErlaubt(parsed);

    return NextResponse.json({
      analyse: mitFristen,
      antwortgenerierung: antwortGate,
      meta: { ocrVerwendet, textGekuerzt },
    });
  } catch (e) {
    console.error('Analyse-Fehler:', e);
    return NextResponse.json({ fehler: 'Ein unerwarteter Fehler ist aufgetreten. Bitte versuche es erneut.' }, { status: 500 });
  }
}
