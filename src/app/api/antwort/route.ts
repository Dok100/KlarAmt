import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

export const maxDuration = 30;

const ANTWORT_SYSTEM_PROMPT = `Du bist KlarAmt. Du erzeugst formale, fristwahrende Standard-Antwortbriefe an deutsche Behörden für Laien.

Du bekommst: Behörde, Aktenzeichen, Dokumenttyp, gewünschten Antworttyp und eine Zielsprache.

Erzeuge AUSSCHLIESSLICH den Brieftext als reinen Fließtext (kein JSON, kein Markdown, keine Erklärung drumherum). Der Brief muss sofort kopier- und versendbar sein.

AUFBAU des Briefs:
[DEIN NAME]
[DEINE STRASSE UND HAUSNUMMER]
[DEINE PLZ UND ORT]

<Behörde>
<Abteilung falls vorhanden>

[ORT], [DATUM]

Betreff: <kurzer Betreff mit Aktenzeichen>

Sehr geehrte Damen und Herren,

<Hauptteil je nach Antworttyp — siehe unten>

Mit freundlichen Grüßen

[DEIN NAME]

PERSÖNLICHE DATEN immer als Platzhalter in eckigen Klammern lassen ([DEIN NAME], [DEINE STRASSE UND HAUSNUMMER], [DEINE PLZ UND ORT], [ORT], [DATUM]). Niemals erfinden.

HAUPTTEIL nach Antworttyp:
- fristverlaengerung: Höfliche Bitte um Verlängerung der Frist um zwei Wochen. Grund offenlassen: "aus organisatorischen Gründen". KEINE inhaltliche Begründung zur Sache.
- unterlagen_nachreichen: "Anbei reiche ich die angeforderten Unterlagen nach:" gefolgt von einem Platzhalter "[LISTE DER UNTERLAGEN]".
- einspruch_einfach: "Gegen den oben genannten Bescheid lege ich fristwahrend Einspruch ein." Dann: "Eine Begründung reiche ich gesondert nach." NICHTS weiter.
- widerspruch_einfach: "Gegen den oben genannten Bescheid lege ich fristwahrend Widerspruch ein." Dann: "Die Begründung reiche ich gesondert nach." NICHTS weiter.
- informationsanfrage: Höfliche Bitte um Auskunft bzw. Akteneinsicht. Konkrete Frage als Platzhalter "[DEINE FRAGE]" offenlassen.

ABSOLUTE VERBOTE (RDG):
- KEINE juristische Begründung, KEINE Argumente zur Sache, KEINE Bewertung des Bescheids.
- KEINE Erfolgseinschätzung ("der Einspruch lohnt sich" o.ä.).
- KEINE Behauptung, die Behörde habe einen Fehler gemacht.
- Du formulierst nur die fristwahrende Hülle. Die inhaltliche Begründung macht der Nutzer (oder ein Anwalt) selbst.

SPRACHE: Wenn eine andere Zielsprache als Deutsch angegeben ist, schreibe den Brief in dieser Sprache — aber Behördennamen, Aktenzeichen und die deutsche Anrede-/Grußformel-Struktur bleiben so, dass die Behörde den Brief versteht (Brief an deutsche Behörde bleibt grundsätzlich auf Deutsch; bei fremder Zielsprache zusätzlich eine Übersetzung des Hauptteils in Klammern darunter).`;

const ERLAUBTE_TYPEN = new Set([
  'fristverlaengerung',
  'unterlagen_nachreichen',
  'einspruch_einfach',
  'widerspruch_einfach',
  'informationsanfrage',
]);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const antworttyp = String(body.antworttyp || '');
    const behoerde = String(body.behoerde || '').slice(0, 200);
    const abteilung = String(body.abteilung || '').slice(0, 200);
    const aktenzeichen = String(body.aktenzeichen || '').slice(0, 100);
    const dokumenttyp = String(body.dokumenttyp || '').slice(0, 200);
    const sprache = String(body.sprache || 'Deutsch').slice(0, 40);

    if (!ERLAUBTE_TYPEN.has(antworttyp)) {
      return NextResponse.json({ fehler: 'Für diesen Antworttyp kann keine Vorlage erstellt werden.' }, { status: 400 });
    }

    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const model = process.env.CLAUDE_MODEL || 'claude-haiku-4-5-20251001';

    const message = await client.messages.create({
      model,
      max_tokens: 1500,
      temperature: 0.2,
      system: [{ type: 'text', text: ANTWORT_SYSTEM_PROMPT, cache_control: { type: 'ephemeral' } }],
      messages: [{
        role: 'user',
        content: `Erzeuge einen fristwahrenden Antwortbrief.

ANTWORTTYP: ${antworttyp}
BEHÖRDE: ${behoerde}
ABTEILUNG: ${abteilung}
AKTENZEICHEN: ${aktenzeichen}
DOKUMENTTYP: ${dokumenttyp}
ZIELSPRACHE: ${sprache}`,
      }],
    });

    const brief = message.content[0].type === 'text' ? message.content[0].text.trim() : '';
    if (!brief) {
      return NextResponse.json({ fehler: 'Die Vorlage konnte nicht erstellt werden. Bitte versuche es erneut.' }, { status: 500 });
    }

    return NextResponse.json({ brief });
  } catch (e) {
    console.error('Antwort-Fehler:', e);
    return NextResponse.json({ fehler: 'Ein unerwarteter Fehler ist aufgetreten. Bitte versuche es erneut.' }, { status: 500 });
  }
}
