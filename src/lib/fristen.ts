import { z } from 'zod';

export const ZahlungSchema = z.object({
  zeitraum: z.string(),
  betrag: z.number(),
  empfaenger: z.string(),
  hinweis: z.string().optional().default(''),
});

export type Zahlung = z.infer<typeof ZahlungSchema>;

// Zod-Schema für die Claude-Antwort
export const AnalyseSchema = z.object({
  analyse: z.object({
    absender: z.object({
      behoerde: z.string(),
      abteilung: z.string(),
      aktenzeichen: z.string(),
    }),
    dokumenttyp: z.string(),
    risikokategorie: z.enum(['niedrig', 'mittel', 'hoch']),
    ampel: z.object({
      status: z.enum(['rot', 'gelb', 'gruen']),
      begruendung: z.string(),
    }),
    zusammenfassung: z.string(),
    erklaerung: z.object({
      sachverhalt: z.string(),
      begruendung_behoerde: z.string(),
      bedeutung_fuer_dich: z.string(),
      rechtsgrundlagen: z.array(z.object({
        paragraph: z.string(),
        erklaerung: z.string(),
      })),
    }),
    fristen: z.array(z.object({
      typ: z.string(),
      beschreibung: z.string(),
      frist_tage: z.number().nullable(),
      frist_berechnung: z.string(),
      bescheid_datum: z.string().nullable(),
      rechtsgrundlage_frist: z.string().optional(),
    })),
    handlungshinweise: z.array(z.object({
      prioritaet: z.number(),
      aktion: z.string(),
      dringlichkeit: z.enum(['sofort', 'innerhalb_der_frist', 'optional']),
      antworttyp: z.string(),
      erklaerung: z.string(),
    })),
    eskalation: z.object({
      beratung_empfohlen: z.boolean(),
      begruendung: z.string(),
      beratungsstellen: z.string(),
    }),
    ocr_qualitaet: z.object({
      confidence: z.enum(['hoch', 'mittel', 'niedrig']),
      probleme: z.string(),
    }),
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
  zahlung: 0,
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
