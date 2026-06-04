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

export default function Home() {
  const router = useRouter();
  const fotoRef = useRef<HTMLInputElement>(null);
  const pdfRef = useRef<HTMLInputElement>(null);

  const [consentGegeben, setConsentGegeben] = useState(false);
  const [sprache, setSprache] = useState('Deutsch');
  const [laedt, setLaedt] = useState(false);
  const [fehler, setFehler] = useState<string | null>(null);
  const [kontingentErschoepft, setKontingentErschoepft] = useState(false);

  useEffect(() => {
    setConsentGegeben(hatConsent());
    setKontingentErschoepft(holeAnalysenZaehler() >= LIMIT);
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
      <main className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 max-w-md w-full p-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">KlarAmt</h1>
          <p className="text-gray-500 mb-8 text-sm">Behördenpost verstehen — in unter 3 Minuten</p>

          <h2 className="font-semibold text-gray-800 mb-4">Was passiert mit deinem Brief?</h2>

          <ol className="space-y-4 mb-8">
            {[
              { icon: '📸', text: 'Dein Brief wird eingelesen' },
              { icon: '🔒', text: 'Steuernummern, IBANs und ähnliche Daten werden automatisch entfernt' },
              { icon: '🤖', text: 'Der anonymisierte Text wird analysiert (Anthropic Claude KI)' },
              { icon: '🗑️', text: 'Nach der Analyse wird alles gelöscht. Wir speichern nichts.' },
            ].map(({ icon, text }) => (
              <li key={text} className="flex gap-3 items-start">
                <span className="text-xl leading-none mt-0.5">{icon}</span>
                <span className="text-gray-700 text-sm">{text}</span>
              </li>
            ))}
          </ol>

          <p className="text-xs text-gray-400 mb-6">
            Namen und Adressen werden nicht automatisch entfernt. Bitte keine hochsensiblen Daten hochladen. KlarAmt erklärt und formuliert — keine Rechtsberatung.
          </p>

          <button
            onClick={consent}
            className="w-full bg-blue-600 text-white font-semibold py-3 rounded-xl hover:bg-blue-700 transition-colors"
          >
            Verstanden — Brief analysieren
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 max-w-md w-full p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">KlarAmt</h1>
        <p className="text-gray-500 mb-8 text-sm">Lade deinen Brief hoch — wir erklären was er bedeutet.</p>

        <div className="mb-6">
          <label className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2 block">
            Erklärung in
          </label>
          <div className="flex flex-wrap gap-2">
            {SPRACHEN.map((s) => (
              <button
                key={s}
                onClick={() => setSprache(s)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  sprache === s
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {laedt ? (
          <div className="text-center py-10">
            <div className="inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-gray-600 font-medium">Brief wird analysiert…</p>
            <p className="text-gray-400 text-sm mt-1">Das kann bis zu einer Minute dauern.</p>
          </div>
        ) : (
          <div className="space-y-3">
            <button
              onClick={() => fotoRef.current?.click()}
              className="w-full bg-blue-600 text-white font-semibold py-4 rounded-xl hover:bg-blue-700 transition-colors text-lg"
            >
              Brief fotografieren
            </button>
            <button
              onClick={() => pdfRef.current?.click()}
              className="w-full bg-gray-100 text-gray-700 font-semibold py-3 rounded-xl hover:bg-gray-200 transition-colors"
            >
              PDF hochladen
            </button>
          </div>
        )}

        <input
          ref={fotoRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={onFileChange}
        />
        <input
          ref={pdfRef}
          type="file"
          accept="application/pdf"
          className="hidden"
          onChange={onFileChange}
        />

        {fehler && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
            {fehler}
          </div>
        )}

        {kontingentErschoepft && !laedt && (
          <p className="mt-4 text-center text-xs text-gray-400">
            3/3 kostenlose Analysen verbraucht. Briefe mit roter Ampel bleiben immer kostenlos.
          </p>
        )}

        <p className="mt-6 text-center text-xs text-gray-400">
          KlarAmt erklärt und formuliert — keine Rechtsberatung.
        </p>
      </div>
    </main>
  );
}
