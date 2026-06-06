'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';

const SPRACHEN = ['Deutsch', 'Türkisch', 'Arabisch', 'Ukrainisch', 'Englisch'];
const KONTINGENT_KEY = 'klaramt_analysen';
const CONSENT_KEY = 'klaramt_consent';
const LIMIT = 3;

function holeAnalysenZaehler(): number {
  if (typeof window === 'undefined') return 0;
  return parseInt(localStorage.getItem(KONTINGENT_KEY) || '0');
}

function zaehleAnalyse(ampelStatus: string) {
  if (ampelStatus === 'rot') return;
  const n = holeAnalysenZaehler();
  localStorage.setItem(KONTINGENT_KEY, String(n + 1));
}

function hatConsent(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(CONSENT_KEY) === '1';
}

function Wordmark({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const fs = size === 'lg' ? '1.75rem' : size === 'sm' ? '1.125rem' : '1.375rem';
  const dot = size === 'lg' ? 8 : size === 'sm' ? 5 : 6;
  const mb = size === 'lg' ? 4 : size === 'sm' ? 2 : 3;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: '1px' }}>
      <span style={{
        fontFamily: 'Georgia, "Times New Roman", serif',
        fontSize: fs,
        fontWeight: 400,
        color: '#1a1814',
        letterSpacing: '-0.03em',
      }}>
        klaramt
      </span>
      <span style={{
        width: dot,
        height: dot,
        borderRadius: '50%',
        background: '#b53d1f',
        display: 'inline-block',
        marginBottom: mb,
        flexShrink: 0,
      }} />
    </span>
  );
}

const CONSENT_ITEMS = [
  { n: '1', text: 'Dein Brief wird eingelesen' },
  { n: '2', text: 'Steuernummern, IBANs und ähnliche Daten werden automatisch entfernt' },
  { n: '3', text: 'Der anonymisierte Text wird analysiert (Anthropic Claude KI)' },
  { n: '4', text: 'Nach der Analyse wird alles gelöscht. Wir speichern nichts.' },
];

const S = {
  page: {
    minHeight: '100svh',
    background: '#f3ede1',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '1.5rem',
  } as React.CSSProperties,
  card: {
    background: '#faf8f4',
    border: '1px solid #e0d8cc',
    borderRadius: '16px',
    maxWidth: '420px',
    width: '100%',
    padding: '2.25rem 2rem',
  } as React.CSSProperties,
  tagline: {
    color: '#7a6e63',
    fontSize: '0.875rem',
    marginTop: '0.375rem',
    marginBottom: '2rem',
    lineHeight: '1.4',
  } as React.CSSProperties,
  divider: {
    height: '1px',
    background: '#e0d8cc',
    margin: '1.5rem 0',
  } as React.CSSProperties,
  btnPrimary: {
    width: '100%',
    background: '#1a1814',
    color: '#f3ede1',
    fontWeight: 600,
    fontSize: '1rem',
    padding: '0.9375rem',
    borderRadius: '10px',
    border: 'none',
    cursor: 'pointer',
    letterSpacing: '-0.01em',
    transition: 'opacity 0.15s',
  } as React.CSSProperties,
  btnSecondary: {
    width: '100%',
    background: 'transparent',
    color: '#3d3530',
    fontWeight: 500,
    fontSize: '0.9375rem',
    padding: '0.875rem',
    borderRadius: '10px',
    border: '1.5px solid #e0d8cc',
    cursor: 'pointer',
    transition: 'border-color 0.15s',
  } as React.CSSProperties,
};

export default function Home() {
  const router = useRouter();
  const fotoRef = useRef<HTMLInputElement>(null);
  const bildRef = useRef<HTMLInputElement>(null);
  const pdfRef = useRef<HTMLInputElement>(null);

  const [consentGegeben, setConsentGegeben] = useState(false);
  const [sprache, setSprache] = useState('Deutsch');
  const [laedt, setLaedt] = useState(false);
  const [fehler, setFehler] = useState<string | null>(null);
  const [kontingentErschoepft, setKontingentErschoepft] = useState(false);
  const [istMobil, setIstMobil] = useState(false);

  useEffect(() => {
    setConsentGegeben(hatConsent());
    setKontingentErschoepft(holeAnalysenZaehler() >= LIMIT);
    setIstMobil(navigator.maxTouchPoints > 0);
  }, []);

  function consent() {
    localStorage.setItem(CONSENT_KEY, '1');
    setConsentGegeben(true);
  }

  async function analysiereFile(file: File) {
    setFehler(null);
    setLaedt(true);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('sprache', sprache);

    try {
      const res = await fetch('/api/analyse', { method: 'POST', body: formData });
      const data = await res.json();

      if (!res.ok || data.fehler) {
        setFehler(data.fehler || 'Ein Fehler ist aufgetreten. Bitte versuche es erneut.');
        return;
      }

      const ampelStatus = data.analyse?.analyse?.ampel?.status;
      zaehleAnalyse(ampelStatus);
      setKontingentErschoepft(holeAnalysenZaehler() >= LIMIT);

      sessionStorage.setItem('klaramt_ergebnis', JSON.stringify(data));
      router.push('/ergebnis');
    } catch {
      setFehler('Verbindungsfehler. Bitte prüfe deine Internetverbindung und versuche es erneut.');
    } finally {
      setLaedt(false);
    }
  }

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    analysiereFile(file);
  }

  if (!consentGegeben) {
    return (
      <main style={S.page}>
        <div style={S.card}>
          <Wordmark size="md" />
          <p style={S.tagline}>Behördenpost endlich verstehen</p>

          <p style={{ color: '#1a1814', fontSize: '0.9375rem', fontWeight: 600, marginBottom: '1.125rem', letterSpacing: '-0.01em' }}>
            Was passiert mit deinem Brief?
          </p>

          <ol style={{ listStyle: 'none', padding: 0, margin: '0 0 1.75rem 0', display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
            {CONSENT_ITEMS.map(({ n, text }) => (
              <li key={n} style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                <span style={{
                  flexShrink: 0,
                  width: '20px',
                  height: '20px',
                  borderRadius: '50%',
                  border: '1.5px solid #e0d8cc',
                  color: '#7a6e63',
                  fontSize: '0.6875rem',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginTop: '2px',
                }}>
                  {n}
                </span>
                <span style={{ color: '#3d3530', fontSize: '0.875rem', lineHeight: '1.55' }}>{text}</span>
              </li>
            ))}
          </ol>

          <p style={{ color: '#9c9087', fontSize: '0.75rem', lineHeight: '1.65', marginBottom: '1.5rem' }}>
            Namen und Adressen werden nicht automatisch entfernt. Bitte keine hochsensiblen Daten hochladen. KlarAmt erklärt und formuliert — keine Rechtsberatung.
          </p>

          <button onClick={consent} style={S.btnPrimary}>
            Verstanden — Brief analysieren
          </button>
        </div>
      </main>
    );
  }

  return (
    <main style={S.page}>
      <div style={S.card}>
        <Wordmark size="md" />
        <p style={S.tagline}>Lade deinen Brief hoch — wir erklären was er bedeutet.</p>

        <div style={{ marginBottom: '1.75rem' }}>
          <p style={{ color: '#9c9087', fontSize: '0.6875rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '0.625rem' }}>
            Erklärung in
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4375rem' }}>
            {SPRACHEN.map((s) => (
              <button
                key={s}
                onClick={() => setSprache(s)}
                style={{
                  padding: '0.375rem 0.875rem',
                  borderRadius: '8px',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  border: sprache === s ? '1.5px solid #1a1814' : '1.5px solid #e0d8cc',
                  background: sprache === s ? '#1a1814' : 'transparent',
                  color: sprache === s ? '#f3ede1' : '#7a6e63',
                  cursor: 'pointer',
                  transition: 'all 0.12s',
                }}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {laedt ? (
          <div style={{ textAlign: 'center', padding: '2.25rem 0' }}>
            <div style={{
              width: '32px',
              height: '32px',
              border: '2.5px solid #e0d8cc',
              borderTopColor: '#1a1814',
              borderRadius: '50%',
              animation: 'spin 0.75s linear infinite',
              margin: '0 auto 1rem',
            }} />
            <p style={{ color: '#3d3530', fontWeight: 600, fontSize: '0.9375rem', letterSpacing: '-0.01em' }}>Brief wird analysiert…</p>
            <p style={{ color: '#9c9087', fontSize: '0.8125rem', marginTop: '0.3rem' }}>Das kann bis zu einer Minute dauern.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
            {istMobil ? (
              <button onClick={() => fotoRef.current?.click()} style={S.btnPrimary}>
                Brief fotografieren
              </button>
            ) : (
              <button onClick={() => bildRef.current?.click()} style={S.btnPrimary}>
                Bild hochladen
              </button>
            )}
            <button onClick={() => pdfRef.current?.click()} style={S.btnSecondary}>
              PDF hochladen
            </button>
            {istMobil && (
              <div style={{ background: '#fdf4e0', border: '1px solid #e0c878', borderRadius: '10px', padding: '0.75rem 0.875rem', marginTop: '0.25rem' }}>
                <p style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#92660f', marginBottom: '0.375rem' }}>Mehrseitiger Brief?</p>
                <p style={{ fontSize: '0.75rem', color: '#7a5a10', lineHeight: 1.65 }}>
                  Scanne alle Seiten als PDF — das geht direkt auf deinem Handy:
                </p>
                <ul style={{ fontSize: '0.75rem', color: '#7a5a10', lineHeight: 1.75, paddingLeft: '1rem', margin: '0.25rem 0 0' }}>
                  <li><strong>iPhone:</strong> Notizen-App öffnen → neuen Text → Büroklammer-Symbol → „Dokument scannen"</li>
                  <li><strong>Android:</strong> Google Drive App → Plus-Symbol → „Scannen"</li>
                </ul>
                <p style={{ fontSize: '0.75rem', color: '#7a5a10', lineHeight: 1.65, marginTop: '0.375rem' }}>
                  Das ergibt ein PDF mit allen Seiten, das du hier hochladen kannst.
                </p>
              </div>
            )}
          </div>
        )}

        <input ref={fotoRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={onFileChange} />
        <input ref={bildRef} type="file" accept="image/*" className="hidden" onChange={onFileChange} />
        <input ref={pdfRef} type="file" accept="application/pdf" className="hidden" onChange={onFileChange} />

        {fehler && (
          <div style={{ marginTop: '1rem', padding: '0.875rem 1rem', background: '#f7ece8', border: '1px solid #e8c4b8', borderRadius: '10px', color: '#b53d1f', fontSize: '0.875rem', lineHeight: '1.55' }}>
            {fehler}
          </div>
        )}

        {kontingentErschoepft && !laedt && (
          <p style={{ marginTop: '1rem', textAlign: 'center', fontSize: '0.75rem', color: '#9c9087', lineHeight: '1.5' }}>
            3/3 kostenlose Analysen verbraucht. Briefe mit roter Ampel bleiben immer kostenlos.
          </p>
        )}

        <p style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.75rem', color: '#9c9087' }}>
          KlarAmt erklärt und formuliert — keine Rechtsberatung.
        </p>
      </div>
    </main>
  );
}
