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
