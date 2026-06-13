export function stripPII(text: string): string {
  let cleaned = text;
  cleaned = cleaned.replace(/[A-Z]{2}\d{2}[\s]?\d{4}[\s]?\d{4}[\s]?\d{4}[\s]?\d{4}[\s]?\d{0,2}/g, '[IBAN]');
  // Steuernummer: XX/XXX/XXXXX oder XXX/XXX/XXXX oder XXXXX/XXXXX
  cleaned = cleaned.replace(/\d{2,3}\/\d{3}\/\d{4,5}/g, '[STEUERNUMMER]');
  cleaned = cleaned.replace(/\b\d{5}\/\d{5}\b/g, '[STEUERNUMMER]');
  // Sozialversicherungsnummer
  cleaned = cleaned.replace(/\d{2}\s?\d{6}\s?[A-Z]\s?\d{3}/g, '[SOZIALVERSICHERUNGSNUMMER]');
  // IdNr: 11-stellig mit optionalen Leerzeichen
  cleaned = cleaned.replace(/\b\d{2}[\s]?\d{3}[\s]?\d{3}[\s]?\d{3}\b/g, '[IDNR]');
  // Geburtsdatum nur mit Kontextwort entfernen — sonst würden Bescheiddatum
  // und Fälligkeitstermine (für die Fristberechnung essenziell) zerstört.
  cleaned = cleaned.replace(
    /\b(geboren am |geb\.? am |geb\. |Geburtsdatum:?\s*|Geburtstag:?\s*)(0[1-9]|[12]\d|3[01])\.(0[1-9]|1[0-2])\.(19|20)\d{2}\b/gi,
    '$1[GEBURTSDATUM]',
  );
  // (?<!\d) verhindert, dass die bare "0"-Alternative mitten in einer Ziffernfolge
  // greift — sonst frisst sie z. B. den Jahresteil eines Aktenzeichens (OWi-2026/55418).
  cleaned = cleaned.replace(/(?<!\d)(\+49|0049|0)\s?[\d\s/\-]{8,14}/g, '[TELEFON]');
  cleaned = cleaned.replace(/[\w.-]+@[\w.-]+\.\w{2,}/g, '[EMAIL]');
  // Namen und Adressen: nicht per Regex (zu fehleranfällig). Post-MVP: Inkognito-Engine.
  return cleaned;
}

// Geschäftszeichen (Aktenzeichen oder Steuernummer) aus dem ROHTEXT lesen — muss VOR
// stripPII laufen, das die Steuernummer sonst durch [STEUERNUMMER] ersetzt. Liefert den
// reinen Wert ohne Label; bleibt clientseitig und wird nicht an die KI gesendet.
export function extrahiereGeschaeftszeichen(text: string): string {
  const muster = [
    /\b(?:Aktenzeichen|Geschäftszeichen|Az\.?)\s*:?\s*([A-Za-z0-9.\-/]{4,40})/i,
    /\bSteuernummer\s*:?\s*([\d/]{8,20})/i,
  ];
  for (const m of muster) {
    const treffer = text.match(m);
    if (treffer) return treffer[1].trim();
  }
  return '';
}
