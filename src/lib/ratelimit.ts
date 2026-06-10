import { Redis } from '@upstash/redis';

// Ohne Upstash-Konfiguration läuft die App weiter (fail-open) — wichtig für lokale Entwicklung.
// In Produktion MÜSSEN UPSTASH_REDIS_REST_URL und UPSTASH_REDIS_REST_TOKEN gesetzt sein,
// sonst gibt es keinen Schutz.
const redis =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      })
    : null;

const IP_LIMIT = Number(process.env.RATE_LIMIT_IP || 3);
const GLOBAL_LIMIT = Number(process.env.RATE_LIMIT_GLOBAL_DAY || 300);
const TTL_SEKUNDEN = 60 * 60 * 48; // Zähler nach 48h verfallen lassen

function tagesKey(): string {
  return new Date().toISOString().slice(0, 10); // YYYY-MM-DD (UTC)
}

export type LimitErgebnis =
  | { erlaubt: true; ipKey: string | null }
  | { erlaubt: false; grund: 'ip' | 'global' };

// Prüft und zählt in einem Schritt. Zählt VOR dem teuren Claude-Call,
// damit blockierte Anfragen kein Geld kosten.
export async function pruefeUndZaehle(ip: string): Promise<LimitErgebnis> {
  if (!redis) return { erlaubt: true, ipKey: null };

  const tag = tagesKey();
  const ipKey = `klaramt:ip:${ip}:${tag}`;
  const globalKey = `klaramt:global:${tag}`;

  try {
    const ipZahl = await redis.incr(ipKey);
    if (ipZahl === 1) await redis.expire(ipKey, TTL_SEKUNDEN);
    if (ipZahl > IP_LIMIT) return { erlaubt: false, grund: 'ip' };

    const globalZahl = await redis.incr(globalKey);
    if (globalZahl === 1) await redis.expire(globalKey, TTL_SEKUNDEN);
    if (globalZahl > GLOBAL_LIMIT) return { erlaubt: false, grund: 'global' };

    return { erlaubt: true, ipKey };
  } catch (e) {
    // Redis-Ausfall darf die App nicht lahmlegen — fail-open, aber protokollieren
    console.error('Rate-Limit-Fehler (fail-open):', e);
    return { erlaubt: true, ipKey: null };
  }
}

// Rote Ampel zählt nicht gegen das IP-Kontingent — Zähler zurücksetzen.
export async function erstatteRot(ipKey: string | null): Promise<void> {
  if (!redis || !ipKey) return;
  try {
    await redis.decr(ipKey);
  } catch (e) {
    console.error('Rate-Limit-Erstattung fehlgeschlagen:', e);
  }
}

// Client-IP aus den Vercel-Headern lesen.
export function leseIp(headers: Headers): string {
  const fwd = headers.get('x-forwarded-for');
  if (fwd) return fwd.split(',')[0].trim();
  return headers.get('x-real-ip') || 'unbekannt';
}
