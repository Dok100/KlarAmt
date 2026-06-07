'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { FristErgebnis } from '@/lib/fristen';

interface ErgebnisData {
  analyse: {
    analyse: {
      absender: { behoerde: string; abteilung: string; aktenzeichen: string };
      dokumenttyp: string;
      risikokategorie: 'niedrig' | 'mittel' | 'hoch';
      ampel: { status: 'rot' | 'gelb' | 'gruen'; begruendung: string };
      zusammenfassung: string;
      erklaerung: {
        sachverhalt: string;
        begruendung_behoerde: string;
        bedeutung_fuer_dich: string;
        rechtsgrundlagen: { paragraph: string; erklaerung: string }[];
      };
      fristen: {
        typ: string;
        beschreibung: string;
        frist_tage: number | null;
        bescheid_datum: string | null;
      }[];
      handlungshinweise: {
        prioritaet: number;
        aktion: string;
        dringlichkeit: string;
        erklaerung: string;
      }[];
      eskalation: { beratung_empfohlen: boolean; begruendung: string; beratungsstellen: string };
      ocr_qualitaet: { confidence: string; probleme: string };
    };
    berechnete_fristen: (FristErgebnis | null)[];
  };
  antwortgenerierung: { erlaubt: boolean; grund?: string; beratungsstellen?: string };
  meta: { ocrVerwendet: boolean; textGekuerzt: boolean };
}

const AMPEL_CONFIG = {
  rot: {
    bg: '#f7ece8',
    border: '#e0b8aa',
    text: '#b53d1f',
    dot: '#b53d1f',
    label: 'Handlung erforderlich',
  },
  gelb: {
    bg: '#fdf4e0',
    border: '#e0c878',
    text: '#92660f',
    dot: '#d4961a',
    label: 'Bitte prüfen',
  },
  gruen: {
    bg: '#eaf4ee',
    border: '#9dcfb0',
    text: '#2d6a4f',
    dot: '#3a9e6f',
    label: 'Kein Handlungsbedarf',
  },
};

function Wordmark() {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: '1px' }}>
      <span style={{
        fontFamily: 'Georgia, "Times New Roman", serif',
        fontSize: '1.25rem',
        fontWeight: 400,
        color: '#1a1814',
        letterSpacing: '-0.03em',
      }}>
        klaramt
      </span>
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#b53d1f', display: 'inline-block', marginBottom: 2, flexShrink: 0 }} />
    </span>
  );
}

function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{
      background: '#faf8f4',
      border: '1px solid #e0d8cc',
      borderRadius: '12px',
      padding: '1rem 1.125rem',
      ...style,
    }}>
      {children}
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <p style={{ fontSize: '0.6875rem', color: '#9c9087', textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 700, marginBottom: '0.375rem' }}>
      {children}
    </p>
  );
}

function Aufklappbar({ titel, children, defaultOffen = false }: { titel: string; children: React.ReactNode; defaultOffen?: boolean }) {
  const [offen, setOffen] = useState(defaultOffen);
  return (
    <div style={{ border: '1px solid #e0d8cc', borderRadius: '12px', overflow: 'hidden', background: '#faf8f4' }}>
      <button
        onClick={() => setOffen(!offen)}
        style={{
          width: '100%',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '1rem 1.125rem',
          textAlign: 'left',
          fontWeight: 600,
          fontSize: '0.9375rem',
          color: '#1a1814',
          letterSpacing: '-0.01em',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
        }}
      >
        {titel}
        <span style={{ color: '#9c9087', fontSize: '1.375rem', lineHeight: 1, fontWeight: 300, marginLeft: '0.75rem', flexShrink: 0 }}>
          {offen ? '−' : '+'}
        </span>
      </button>
      {offen && (
        <div style={{
          padding: '0 1.125rem 1.125rem',
          borderTop: '1px solid #e0d8cc',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.75rem',
        }}>
          {children}
        </div>
      )}
    </div>
  );
}

const MONATE = ['Januar','Februar','März','April','Mai','Juni','Juli','August','September','Oktober','November','Dezember'];

function formatDatum(iso: string): string {
  const [y, m, d] = iso.split('-');
  return `${parseInt(d)}. ${MONATE[parseInt(m) - 1]} ${y}`;
}

function extrahiereBetrag(beschreibung: string): string | null {
  // "= 391 Euro" oder "= 391 €" am Ende der Beschreibung
  const m = beschreibung.match(/=\s*([\d.,]+)\s*(?:Euro|€)/);
  return m ? m[1] + ' €' : null;
}

function FristCountdown({ frist }: { frist: FristErgebnis }) {
  if (frist.abgelaufen) {
    return (
      <div style={{ background: '#fdf4e0', border: '1px solid #e0c878', borderRadius: '9px', padding: '0.6875rem 0.875rem' }}>
        <p style={{ fontSize: '0.875rem', color: '#92660f', fontWeight: 600, lineHeight: 1.4 }}>
          Einspruchsfrist prüfen — geschätztes Fristende: {formatDatum(frist.fristende)}
        </p>
        <p style={{ fontSize: '0.75rem', color: '#92660f', marginTop: '0.25rem', opacity: 0.85, lineHeight: 1.5 }}>
          Maßgeblich ist, wann dir der Bescheid bekanntgegeben wurde — nicht das Druckdatum. Bitte prüfe das tatsächliche Zugangsdatum.
        </p>
      </div>
    );
  }
  const dringend = frist.verbleibende_tage <= 7;
  return (
    <div style={{
      background: dringend ? '#f7ece8' : '#f3ede1',
      border: `1px solid ${dringend ? '#e0b8aa' : '#e0d8cc'}`,
      borderRadius: '9px',
      padding: '0.6875rem 0.875rem',
      color: dringend ? '#b53d1f' : '#3d3530',
    }}>
      <span style={{ fontWeight: 700, fontSize: '1.25rem', letterSpacing: '-0.02em' }}>{frist.verbleibende_tage}</span>
      <span style={{ fontSize: '0.875rem', marginLeft: '0.375rem' }}>Tage bis zum geschätzten Fristende ({frist.fristende})</span>
      <p style={{ fontSize: '0.75rem', marginTop: '0.25rem', opacity: 0.65, lineHeight: 1.5 }}>{frist.hinweis}</p>
    </div>
  );
}

export default function ErgebnisSeite() {
  const router = useRouter();
  const [daten, setDaten] = useState<ErgebnisData | null>(null);

  useEffect(() => {
    const raw = sessionStorage.getItem('klaramt_ergebnis');
    if (!raw) { router.push('/'); return; }
    setDaten(JSON.parse(raw));
  }, [router]);

  if (!daten) return null;

  const a = daten.analyse.analyse;
  const ampel = AMPEL_CONFIG[a.ampel.status];

  const fristenMitCountdown = a.fristen
    .map((f, i) => ({ frist: f, berechnet: daten.analyse.berechnete_fristen[i] }))
    .filter(({ berechnet }) => berechnet !== null);

  return (
    <main style={{ minHeight: '100svh', background: '#f3ede1', paddingBottom: '3.5rem' }}>

      {/* Header */}
      <div style={{ maxWidth: '520px', margin: '0 auto', padding: '1.125rem 1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Wordmark />
        <button
          onClick={() => router.push('/')}
          style={{ fontSize: '0.875rem', color: '#7a6e63', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500, textDecoration: 'underline', textUnderlineOffset: '3px' }}
        >
          Neuer Brief
        </button>
      </div>

      <div style={{ maxWidth: '520px', margin: '0 auto', padding: '0 1.25rem', display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>

        {/* Absender */}
        <Card>
          <Label>Absender</Label>
          <p style={{ fontWeight: 700, fontSize: '1rem', color: '#1a1814', letterSpacing: '-0.015em', lineHeight: 1.3 }}>{a.absender.behoerde}</p>
          {a.absender.abteilung && <p style={{ fontSize: '0.875rem', color: '#7a6e63', marginTop: '0.2rem' }}>{a.absender.abteilung}</p>}
          <p style={{ fontSize: '0.75rem', color: '#9c9087', marginTop: '0.3rem' }}>{a.dokumenttyp}</p>
        </Card>

        {/* Ampel */}
        <div style={{
          background: ampel.bg,
          border: `1.5px solid ${ampel.border}`,
          borderRadius: '12px',
          padding: '1rem 1.125rem',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <span style={{ width: 9, height: 9, borderRadius: '50%', background: ampel.dot, flexShrink: 0, display: 'inline-block' }} />
            <span style={{ fontWeight: 700, fontSize: '0.9375rem', color: ampel.text, letterSpacing: '-0.01em' }}>{ampel.label}</span>
          </div>
          <p style={{ fontSize: '0.9375rem', color: '#1a1814', fontWeight: 500, lineHeight: 1.55 }}>{a.zusammenfassung}</p>
          <p style={{ fontSize: '0.8125rem', color: ampel.text, marginTop: '0.5rem', opacity: 0.85, lineHeight: 1.55 }}>{a.ampel.begruendung}</p>
        </div>

        {/* Frist-Countdowns */}
        {fristenMitCountdown.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4375rem' }}>
            {fristenMitCountdown.map(({ frist, berechnet }, i) => (
              <div key={i}>
                <p style={{ fontSize: '0.75rem', color: '#9c9087', marginBottom: '0.25rem', paddingLeft: '0.125rem' }}>{frist.beschreibung}</p>
                <FristCountdown frist={berechnet!} />
              </div>
            ))}
          </div>
        )}

        {/* Zahlungsfristen — Termine nach Bescheiddatum, tabellarisch */}
        {(() => {
          const bescheidDatumStr = a.fristen.find(f => f.frist_tage !== null && f.bescheid_datum)?.bescheid_datum;
          const bescheidDatum = bescheidDatumStr ? new Date(bescheidDatumStr) : new Date(0);
          const zahlungen = a.fristen.filter(f => f.frist_tage === null && f.bescheid_datum && new Date(f.bescheid_datum) > bescheidDatum);
          if (zahlungen.length === 0) return null;
          return (
            <div style={{ background: '#faf8f4', border: '1px solid #e0d8cc', borderRadius: '12px', overflow: 'hidden' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', padding: '0.625rem 1rem', borderBottom: '1px solid #e0d8cc', background: '#f3ede1' }}>
                <span style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#9c9087', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Anstehende Zahlungen</span>
                <span style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#9c9087', textTransform: 'uppercase', letterSpacing: '0.07em', textAlign: 'right' }}>Betrag</span>
              </div>
              {zahlungen.map((f, i) => {
                const betrag = extrahiereBetrag(f.beschreibung);
                const beschreibungKurz = f.beschreibung.replace(/\s*=\s*[\d.,]+\s*(?:Euro|€).*$/, '').trim();
                return (
                  <div key={i} style={{
                    display: 'grid', gridTemplateColumns: '1fr auto', alignItems: 'center', gap: '0.75rem',
                    padding: '0.75rem 1rem',
                    borderBottom: i < zahlungen.length - 1 ? '1px solid #e0d8cc' : 'none',
                  }}>
                    <div>
                      <p style={{ fontWeight: 600, fontSize: '0.875rem', color: '#1a1814', letterSpacing: '-0.01em' }}>{formatDatum(f.bescheid_datum!)}</p>
                      <p style={{ fontSize: '0.75rem', color: '#9c9087', marginTop: '0.15rem', lineHeight: 1.4 }}>{beschreibungKurz}</p>
                    </div>
                    <span style={{ fontWeight: 700, fontSize: '1rem', color: '#1a1814', whiteSpace: 'nowrap', textAlign: 'right' }}>
                      {betrag ?? '—'}
                    </span>
                  </div>
                );
              })}
            </div>
          );
        })()}

        {/* OCR-Warnung */}
        {a.ocr_qualitaet.confidence !== 'hoch' && (
          <div style={{ background: '#fdf4e0', border: '1px solid #e0c878', borderRadius: '10px', padding: '0.75rem 1rem', fontSize: '0.8125rem', color: '#92660f', lineHeight: 1.55 }}>
            Texterkennung eingeschränkt: {a.ocr_qualitaet.probleme}
          </div>
        )}

        {/* Erklärung */}
        <Aufklappbar titel="Erklärung — was steht da?">
          <p style={{ fontSize: '0.875rem', color: '#3d3530', lineHeight: 1.7, paddingTop: '0.75rem' }}>{a.erklaerung.sachverhalt}</p>
          <p style={{ fontSize: '0.875rem', color: '#7a6e63', lineHeight: 1.7 }}>{a.erklaerung.begruendung_behoerde}</p>
          <p style={{ fontSize: '0.875rem', fontWeight: 600, color: '#1a1814', lineHeight: 1.65 }}>{a.erklaerung.bedeutung_fuer_dich}</p>
          {a.erklaerung.rechtsgrundlagen.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4375rem', marginTop: '0.25rem' }}>
              {a.erklaerung.rechtsgrundlagen.map((rg, i) => (
                <div key={i} style={{ background: '#f3ede1', borderRadius: '8px', padding: '0.625rem 0.75rem' }}>
                  <span style={{ fontFamily: '"SF Mono", "Fira Code", monospace', fontSize: '0.6875rem', color: '#7a6e63', fontWeight: 600 }}>{rg.paragraph}</span>
                  <p style={{ fontSize: '0.8125rem', marginTop: '0.25rem', color: '#3d3530', lineHeight: 1.55 }}>{rg.erklaerung}</p>
                </div>
              ))}
            </div>
          )}
        </Aufklappbar>

        {/* Handlungshinweise */}
        <Aufklappbar titel="Was kann ich tun?">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', paddingTop: '0.75rem' }}>
            {a.handlungshinweise.map((h, i) => (
              <div key={i} style={{ display: 'flex', gap: '0.75rem' }}>
                <span style={{
                  flexShrink: 0,
                  width: 22,
                  height: 22,
                  borderRadius: '50%',
                  border: '1.5px solid #e0d8cc',
                  color: '#7a6e63',
                  fontSize: '0.6875rem',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginTop: 2,
                }}>
                  {h.prioritaet}
                </span>
                <div>
                  <p style={{ fontWeight: 600, color: '#1a1814', fontSize: '0.875rem', lineHeight: 1.4, letterSpacing: '-0.005em' }}>{h.aktion}</p>
                  <p style={{ color: '#7a6e63', fontSize: '0.8125rem', marginTop: '0.3rem', lineHeight: 1.65 }}>{h.erklaerung}</p>
                </div>
              </div>
            ))}
          </div>
        </Aufklappbar>

        {/* Eskalation */}
        {a.eskalation.beratung_empfohlen && (
          <div style={{ background: '#fdf4e0', border: '1px solid #e0c070', borderRadius: '12px', padding: '1rem 1.125rem' }}>
            <p style={{ fontWeight: 700, color: '#7a4a0f', fontSize: '0.9375rem', marginBottom: '0.375rem', letterSpacing: '-0.01em' }}>
              Professionelle Beratung empfohlen
            </p>
            <p style={{ fontSize: '0.875rem', color: '#8a5910', lineHeight: 1.6, marginBottom: '0.5rem' }}>{a.eskalation.begruendung}</p>
            <p style={{ fontSize: '0.875rem', color: '#8a5910', lineHeight: 1.6 }}>{a.eskalation.beratungsstellen}</p>
          </div>
        )}

        {/* Antwortgenerator */}
        {daten.antwortgenerierung.erlaubt ? (
          <Card style={{ textAlign: 'center', padding: '1.25rem' }}>
            <p style={{ fontSize: '0.875rem', color: '#7a6e63', marginBottom: '0.875rem' }}>Musst du auf diesen Brief antworten?</p>
            <button
              disabled
              style={{
                width: '100%',
                background: '#f3ede1',
                color: '#b0a498',
                fontWeight: 600,
                fontSize: '0.9375rem',
                padding: '0.875rem',
                borderRadius: '10px',
                border: '1px solid #e0d8cc',
                cursor: 'not-allowed',
                letterSpacing: '-0.01em',
              }}
            >
              Antwortvorlage erstellen (kommt bald)
            </button>
          </Card>
        ) : daten.antwortgenerierung.grund ? (
          <Card>
            <p style={{ fontWeight: 600, color: '#1a1814', fontSize: '0.875rem', marginBottom: '0.375rem' }}>Kein Antwortgenerator</p>
            <p style={{ fontSize: '0.875rem', color: '#3d3530', lineHeight: 1.6 }}>{daten.antwortgenerierung.grund}</p>
            {daten.antwortgenerierung.beratungsstellen && (
              <p style={{ fontSize: '0.875rem', color: '#7a6e63', marginTop: '0.5rem', lineHeight: 1.6 }}>{daten.antwortgenerierung.beratungsstellen}</p>
            )}
          </Card>
        ) : null}

        {daten.meta.textGekuerzt && (
          <p style={{ textAlign: 'center', fontSize: '0.75rem', color: '#9c9087' }}>
            Nur die ersten Seiten wurden analysiert (Dokument zu lang).
          </p>
        )}

        <p style={{ textAlign: 'center', fontSize: '0.75rem', color: '#9c9087', lineHeight: 1.65, paddingTop: '0.5rem' }}>
          KlarAmt erklärt und formuliert — keine Rechtsberatung. Prüfe alle Angaben an deinem Original-Dokument.
        </p>
      </div>
    </main>
  );
}
