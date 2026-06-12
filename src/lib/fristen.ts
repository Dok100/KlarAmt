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
  // Vom Code (pruefeBetragssumme) gesetzt, nicht vom Modell — der deterministische Befund
  warnung: text.optional(),
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

// Deterministische Leitplanke gegen das Tatdatum als Bescheiddatum: Haiku nimmt bei
// Bußgeldbescheiden gelegentlich den Tattag ("am 12.05. ... begangen") als bescheid_datum
// und rechnet daraus ein konkretes — aber falsches — Fristende. Ein zu früh berechnetes
// Fristende wirkt abgelaufen und ist die rechtlich gefährlichste Fehlerklasse. Erkennt
// das Tatdatum am Kontext im Quelltext; ist bescheid_datum genau dieses Datum, wird es
// verworfen (frist_tage bleibt, der Hinweis nennt weiter die Fristlänge). Nur im
// Text-Modus — bei Scans (Vision) liegt kein Quelltext vor.
const DATUM = String.raw`(\d{1,2})\.(\d{1,2})\.(\d{4})`;
const TAT_MUSTER = [
  new RegExp(String.raw`am\s+${DATUM}\s+um\s+\d{1,2}[:.]\d{2}\s*uhr`, 'gi'),
  new RegExp(String.raw`(?:zur\s+last\s+gelegt|vorgeworfen|begangen|tattag|tatzeit|tatzeitpunkt)[^.]{0,60}?${DATUM}`, 'gi'),
  new RegExp(String.raw`${DATUM}[^.]{0,60}?(?:begangen|zur\s+last\s+gelegt|vorgeworfen)`, 'gi'),
];

function findeTatdaten(textLower: string): Set<string> {
  const treffer = new Set<string>();
  for (const muster of TAT_MUSTER) {
    for (const m of textLower.matchAll(muster)) {
      treffer.add(`${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`);
    }
  }
  return treffer;
}

export function verwerfeTatdatumAlsBescheiddatum(analyse: Analyse, quelltext: string | null): Analyse {
  if (!quelltext) return analyse;
  const tatdaten = findeTatdaten(quelltext.toLowerCase());
  if (tatdaten.size === 0) return analyse;

  for (const frist of analyse.analyse.fristen) {
    if (frist.bescheid_datum && tatdaten.has(frist.bescheid_datum.slice(0, 10))) {
      frist.bescheid_datum = null;
    }
  }

  return analyse;
}

// Deterministische Leitplanke gegen Lesefehler bei Beträgen: ergeben die wörtlich
// transkribierten Einzelposten NICHT den ausgewiesenen Gesamtbetrag, ist mindestens
// eine Zahl falsch erkannt. Der Befund landet in betragspruefung.warnung (eigene,
// prominente Box bei der Zahlungstabelle) — bewusst NICHT in ocr_qualitaet, denn eine
// nicht aufgehende Summe ist keine Texterkennungs-Frage und stünde dort falsch benannt
// und zu unscheinbar am Seitenende.
function formatEuro(betrag: number): string {
  return betrag.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function pruefeBetragssumme(analyse: Analyse): Analyse {
  const bp = analyse.analyse.betragspruefung;
  if (bp.gesamtbetrag === null || bp.einzelposten.length < 2) return analyse;

  const summe = bp.einzelposten.reduce((s, posten) => s + posten.betrag, 0);
  // 1 Cent Toleranz fängt Gleitkomma-Rauschen ab; echte Lesefehler sind deutlich größer
  if (Math.abs(summe - bp.gesamtbetrag) <= 0.01) return analyse;

  bp.warnung = `Die Einzelbeträge ergeben zusammen ${formatEuro(summe)} €, der Bescheid nennt aber ${formatEuro(bp.gesamtbetrag)} € als Gesamtbetrag. Bitte prüfe die Beträge am Original — ein Lesefehler ist möglich.`;
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
