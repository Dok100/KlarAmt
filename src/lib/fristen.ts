import { z } from 'zod';

// Defensives Schema: LLM-Ausgabe variiert von Lauf zu Lauf. Ein einzelnes fehlendes/null Feld
// darf NIEMALS die ganze Analyse verwerfen — jedes Feld hat einen sinnvollen Default.
const text = z.string().nullish().transform((v) => v ?? '');
// Enums tolerant: unbekannter/fehlender Wert fällt auf sicheren Default zurück
const enumMit = <T extends [string, ...string[]]>(werte: T, fallback: T[number]) =>
  z.enum(werte).catch(fallback).default(fallback);

export const ZahlungSchema = z.object({
  zeitraum: text,
  betrag: z.number().catch(0).default(0),
  empfaenger: text,
  // Richtung erzwingt eine explizite Entscheidung pro Zeile — verhindert widersprüchliche Aussagen
  richtung: enumMit(['du_zahlst', 'du_bekommst'], 'du_zahlst'),
  hinweis: text.optional().default(''),
});

export type Zahlung = z.infer<typeof ZahlungSchema>;

// Strukturierte Basis für die deterministische Summen-Prüfung: der vom Dokument
// AUSGEWIESENE Gesamtbetrag plus die wörtlich transkribierten Einzelposten.
// Beide Werte stammen direkt aus dem Bescheid (nicht gerechnet) — der Code prüft,
// ob sie zusammenpassen, und deckt so OCR-/Vision-Lesefehler auf.
const betragspruefung = z.object({
  gesamtbetrag: z.number().nullable().catch(null).default(null),
  einzelposten: z.array(z.object({
    bezeichnung: text,
    betrag: z.number().catch(0).default(0),
  })).optional().default([]),
}).nullish().transform((v) => v ?? { gesamtbetrag: null, einzelposten: [] });

// Zod-Schema für die Claude-Antwort
export const AnalyseSchema = z.object({
  analyse: z.object({
    absender: z.object({
      behoerde: text,
      abteilung: text,
      aktenzeichen: text,
    }),
    dokumenttyp: text,
    risikokategorie: enumMit(['niedrig', 'mittel', 'hoch'], 'mittel'),
    ampel: z.object({
      status: enumMit(['rot', 'gelb', 'gruen'], 'rot'),
      begruendung: text,
    }),
    zusammenfassung: text,
    erklaerung: z.object({
      sachverhalt: text,
      begruendung_behoerde: text,
      bedeutung_fuer_dich: text,
      rechtsgrundlagen: z.array(z.object({
        paragraph: text,
        erklaerung: text,
      })).optional().default([]),
    }),
    fristen: z.array(z.object({
      typ: text,
      beschreibung: text,
      frist_tage: z.number().nullable().catch(null).default(null),
      frist_berechnung: text,
      bescheid_datum: z.string().nullable().catch(null).default(null),
      rechtsgrundlage_frist: text.optional(),
    })).optional().default([]),
    handlungshinweise: z.array(z.object({
      prioritaet: z.number().catch(99).default(99),
      aktion: text,
      dringlichkeit: enumMit(['sofort', 'innerhalb_der_frist', 'optional'], 'innerhalb_der_frist'),
      antworttyp: text,
      erklaerung: text,
    })).optional().default([]),
    eskalation: z.object({
      beratung_empfohlen: z.boolean().catch(false).default(false),
      begruendung: text,
      beratungsstellen: text,
    }).optional().default({ beratung_empfohlen: false, begruendung: '', beratungsstellen: '' }),
    ocr_qualitaet: z.object({
      confidence: enumMit(['hoch', 'mittel', 'niedrig'], 'mittel'),
      probleme: text,
    }).optional().default({ confidence: 'mittel', probleme: '' }),
    zahlungen: z.array(ZahlungSchema).optional().default([]),
    betragspruefung,
  }),
});

export type Analyse = z.infer<typeof AnalyseSchema>;

export interface FristErgebnis {
  bekanntgabe: string;
  fristende: string;
  verbleibende_tage: number;
  abgelaufen: boolean;
  hinweis: string;
}

function wochenendeKorrigieren(datum: Date): Date {
  const tag = datum.getDay();
  if (tag === 6) datum.setDate(datum.getDate() + 2); // Samstag → Montag
  if (tag === 0) datum.setDate(datum.getDate() + 1); // Sonntag → Montag
  return datum;
}

export function berechneFristende(
  bescheidDatum: string | null,
  fristTage: number | null,
  bekanntgabeFiktion: number = 3
): FristErgebnis | null {
  if (!bescheidDatum || fristTage === null) return null;

  const datum = new Date(bescheidDatum);
  if (isNaN(datum.getTime())) return null;

  const bekanntgabe = new Date(datum);
  bekanntgabe.setDate(bekanntgabe.getDate() + bekanntgabeFiktion);

  const fristende = new Date(bekanntgabe);
  fristende.setDate(fristende.getDate() + fristTage);
  wochenendeKorrigieren(fristende);

  const verbleibend = Math.ceil((fristende.getTime() - Date.now()) / (1000 * 60 * 60 * 24));

  return {
    bekanntgabe: bekanntgabe.toISOString().split('T')[0],
    fristende: fristende.toISOString().split('T')[0],
    verbleibende_tage: verbleibend,
    abgelaufen: verbleibend < 0,
    hinweis: 'Geschätztes Fristende. Bitte prüfe Bescheiddatum und Zugangsdatum auf deinem Bescheid.',
  };
}

// Bekanntgabe-Fiktion nach Fristtyp
const BEKANNTGABE_FIKTION: Record<string, number> = {
  einspruch: 3,
  widerspruch: 3,
  klage: 0,
  einspruch_bussgeld: 0,
  // Relative Zahlungsfristen ("einen Monat nach Bekanntgabe") laufen ebenfalls ab
  // Bekanntgabe — also mit Zugangsfiktion. Feste Zahltermine haben frist_tage=null
  // und werden hiervon nicht berührt.
  zahlung: 3,
};

export function verarbeiteFristen(analyse: Analyse): Analyse & { berechnete_fristen: (FristErgebnis | null)[] } {
  const berechnete_fristen = analyse.analyse.fristen.map((frist) => {
    const fiktion = BEKANNTGABE_FIKTION[frist.typ] ?? 3;
    return berechneFristende(frist.bescheid_datum, frist.frist_tage, fiktion);
  });

  return { ...analyse, berechnete_fristen };
}

// Architektonische Leitplanke gegen erfundene Gesetzeszitate: das gefährlichste
// Fehlermuster bei rechtsnahen Texten, weil falsche §§ Autorität vortäuschen.
// Behalte nur §§/Aktenzeichen, die WÖRTLICH im Bescheidtext stehen. Greift nur im
// Text-Modus — bei Scans (Vision) liegt kein verlässlicher Quelltext vor.
function istParagraphZitat(text: string): boolean {
  return /§|nr\.\s*\d/i.test(text);
}

function zitatImText(zitat: string, textLower: string): boolean {
  const gesetz = zitat.match(/([a-zäöü]{2,})\s*$/i);
  if (!gesetz) return false;
  if (!new RegExp(`\\b${gesetz[1].toLowerCase()}\\b`).test(textLower)) return false;
  const nummer = zitat.match(/(?:§|nr\.?)\s*(\d+)/i);
  if (!nummer) return true;
  return new RegExp(`(?:§|nr\\.?)\\s*${nummer[1]}(?!\\d)`, 'i').test(textLower);
}

export function entferneErfundeneParagraphen(analyse: Analyse, quelltext: string | null): Analyse {
  if (!quelltext) return analyse;
  const textLower = quelltext.toLowerCase();

  analyse.analyse.erklaerung.rechtsgrundlagen = analyse.analyse.erklaerung.rechtsgrundlagen.filter(
    (rg) => !istParagraphZitat(rg.paragraph) || zitatImText(rg.paragraph, textLower),
  );

  for (const frist of analyse.analyse.fristen) {
    const rgf = frist.rechtsgrundlage_frist;
    if (rgf && istParagraphZitat(rgf) && !zitatImText(rgf, textLower)) {
      frist.rechtsgrundlage_frist = '';
    }
  }

  return analyse;
}

// Deterministische Leitplanke gegen Lesefehler bei Beträgen: ergeben die wörtlich
// transkribierten Einzelposten NICHT den ausgewiesenen Gesamtbetrag, ist mindestens
// eine Zahl falsch erkannt. Statt dem Laien einen stimmigen, aber falschen Betrag zu
// zeigen, senken wir die Confidence und weisen auf die Abweichung hin (Prompt allein
// reicht nicht — Haiku übernimmt die Selbstkontrolle nicht zuverlässig).
function formatEuro(betrag: number): string {
  return betrag.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function pruefeBetragssumme(analyse: Analyse): Analyse {
  const { gesamtbetrag, einzelposten } = analyse.analyse.betragspruefung;
  if (gesamtbetrag === null || einzelposten.length < 2) return analyse;

  const summe = einzelposten.reduce((s, posten) => s + posten.betrag, 0);
  // 1 Cent Toleranz fängt Gleitkomma-Rauschen ab; echte Lesefehler sind deutlich größer
  if (Math.abs(summe - gesamtbetrag) <= 0.01) return analyse;

  const hinweis = `Die Einzelbeträge ergeben zusammen ${formatEuro(summe)} €, der Bescheid weist aber ${formatEuro(gesamtbetrag)} € als Gesamtbetrag aus. Bitte prüfe die Beträge am Original — ein Lesefehler ist möglich.`;

  const ocr = analyse.analyse.ocr_qualitaet;
  if (ocr.confidence === 'hoch') ocr.confidence = 'mittel';
  ocr.probleme = [ocr.probleme, hinweis].filter(Boolean).join(' ');

  return analyse;
}

export function istAntwortgenerierungErlaubt(analyse: Analyse): { erlaubt: boolean; grund?: string; beratungsstellen?: string; } {
  if (analyse.analyse.risikokategorie === 'hoch') {
    return {
      erlaubt: false,
      grund: 'Bei diesem Dokumenttyp empfehlen wir professionelle Beratung. KlarAmt erstellt hierfür keine Antwortvorlage.',
      beratungsstellen: analyse.analyse.eskalation.beratungsstellen,
    };
  }
  return { erlaubt: true };
}
