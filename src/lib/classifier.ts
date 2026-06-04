export interface DokumenttypErgebnis {
  erkannterTyp: string | null;
  behoerdentyp: string | null;
  confidence: 'hoch' | 'mittel' | 'niedrig';
}

export interface KeywordErgebnis {
  hat_rechtsbehelfsbelehrung: boolean;
  hat_einspruch: boolean;
  hat_widerspruch: boolean;
  hat_klagefrist: boolean;
  hat_zahlungsfrist: boolean;
  hat_anhoerung: boolean;
  hat_fristangabe: boolean;
  hat_vollstreckung: boolean;
  hat_mahnung: boolean;
  hat_rueckforderung: boolean;
  hat_aufhebung: boolean;
  hat_sanktion: boolean;
  hat_strafbefehl: boolean;
  hat_fahrverbot: boolean;
  hat_bussgeld: boolean;
  hat_asyl_aufenthalt: boolean;
  hat_widerspruchsbescheid: boolean;
  gefundene_daten: string[];
}

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

export function erkenneDokumenttyp(text: string): DokumenttypErgebnis {
  let erkannterTyp: string | null = null;
  let behoerdentyp: string | null = null;
  let confidence: 'hoch' | 'mittel' | 'niedrig' = 'niedrig';

  for (const regel of absenderRegeln) {
    if (regel.muster.test(text)) {
      erkannterTyp = regel.typ;
      behoerdentyp = regel.behoerdentyp;
      confidence = 'mittel';
      break;
    }
  }

  for (const regel of strukturRegeln) {
    if (regel.muster.test(text)) {
      erkannterTyp = regel.typ;
      confidence = 'hoch';
      break;
    }
  }

  return { erkannterTyp, behoerdentyp, confidence };
}

export function classifyKeywords(text: string): KeywordErgebnis {
  return {
    hat_rechtsbehelfsbelehrung: /rechtsbehelfsbelehrung/i.test(text),
    hat_einspruch: /\beinspruch\b/i.test(text),
    hat_widerspruch: /\bwiderspruch\b/i.test(text),
    hat_klagefrist: /\bklage\b.*\bfrist\b|\bklagefrist\b/i.test(text),
    hat_zahlungsfrist: /zahlungsfrist|zahlbar bis|fällig am|fällig zum/i.test(text),
    hat_anhoerung: /anhörung|gelegenheit zur stellungnahme|äußerungsfrist/i.test(text),
    hat_fristangabe: /innerhalb von|innerhalb eines monats|innerhalb von zwei wochen|binnen|frist/i.test(text),
    hat_vollstreckung: /zwangsvollstreckung|vollstreckung|pfändung|kontopfändung/i.test(text),
    hat_mahnung: /mahnung|zahlungserinnerung|letzte mahnung/i.test(text),
    hat_rueckforderung: /rückforderung|erstattung.*zu.*unrecht|überzahlung/i.test(text),
    hat_aufhebung: /aufhebung|aufgehoben|wird aufgehoben/i.test(text),
    hat_sanktion: /sanktion|leistungsminderung|leistungskürzung/i.test(text),
    hat_strafbefehl: /strafbefehl/i.test(text),
    hat_fahrverbot: /fahrverbot|führerscheinentzug|fahrerlaubnis.*entzug/i.test(text),
    hat_bussgeld: /bußgeldbescheid|ordnungswidrigkeit|geldbuße/i.test(text),
    hat_asyl_aufenthalt: /aufenthaltserlaubnis|asyl|aufenthaltstitel|abschiebung|duldung/i.test(text),
    hat_widerspruchsbescheid: /widerspruchsbescheid|widerspruch.*zurückgewiesen/i.test(text),
    gefundene_daten: text.match(/\b(0[1-9]|[12]\d|3[01])\.(0[1-9]|1[0-2])\.(20\d{2})\b/g) || [],
  };
}

export function formatVorklassifikation(
  dokumenttyp: DokumenttypErgebnis,
  keywords: KeywordErgebnis
): string {
  const hints: string[] = [];

  if (dokumenttyp.erkannterTyp) {
    hints.push(`DOKUMENTTYP (regelbasiert erkannt, Confidence: ${dokumenttyp.confidence}): ${dokumenttyp.erkannterTyp}`);
    if (dokumenttyp.behoerdentyp) hints.push(`BEHÖRDENTYP: ${dokumenttyp.behoerdentyp}`);
  } else {
    hints.push('DOKUMENTTYP: Nicht regelbasiert erkannt. Bitte aus dem Text bestimmen.');
  }

  if (keywords.hat_rechtsbehelfsbelehrung) hints.push('RECHTSBEHELFSBELEHRUNG gefunden');
  if (keywords.hat_einspruch) hints.push('EINSPRUCH im Text');
  if (keywords.hat_widerspruch) hints.push('WIDERSPRUCH im Text');
  if (keywords.hat_anhoerung) hints.push('ANHÖRUNG/STELLUNGNAHME gefunden');
  if (keywords.hat_vollstreckung) hints.push('ZWANGSVOLLSTRECKUNG/PFÄNDUNG gefunden');
  if (keywords.hat_mahnung) hints.push('MAHNUNG gefunden');
  if (keywords.hat_rueckforderung) hints.push('RÜCKFORDERUNG gefunden');
  if (keywords.hat_aufhebung) hints.push('AUFHEBUNG gefunden');
  if (keywords.hat_strafbefehl) hints.push('STRAFBEFEHL gefunden');
  if (keywords.hat_fahrverbot) hints.push('FAHRVERBOT/FÜHRERSCHEINENTZUG gefunden');
  if (keywords.hat_asyl_aufenthalt) hints.push('AUFENTHALTSRECHT/ASYL gefunden');
  if (keywords.hat_widerspruchsbescheid) hints.push('WIDERSPRUCHSBESCHEID gefunden (nächster Schritt: Klage)');
  if (keywords.hat_sanktion) hints.push('SANKTION/LEISTUNGSKÜRZUNG gefunden');
  if (keywords.gefundene_daten.length > 0) {
    hints.push(`DATUMSANGABEN: ${keywords.gefundene_daten.join(', ')}`);
  }

  return hints.join('\n');
}
