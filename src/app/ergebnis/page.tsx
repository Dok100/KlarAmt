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
  rot: { bg: 'bg-red-50', border: 'border-red-300', text: 'text-red-700', kreis: 'bg-red-500', label: 'Handlung erforderlich' },
  gelb: { bg: 'bg-yellow-50', border: 'border-yellow-300', text: 'text-yellow-700', kreis: 'bg-yellow-400', label: 'Handlungsoption vorhanden' },
  gruen: { bg: 'bg-green-50', border: 'border-green-300', text: 'text-green-700', kreis: 'bg-green-500', label: 'Kein Handlungsbedarf' },
};

function Aufklappbar({ titel, children }: { titel: string; children: React.ReactNode }) {
  const [offen, setOffen] = useState(false);
  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      <button
        onClick={() => setOffen(!offen)}
        className="w-full flex justify-between items-center px-5 py-4 text-left font-medium text-gray-800 hover:bg-gray-50 transition-colors"
      >
        {titel}
        <span className="text-gray-400 text-lg">{offen ? '−' : '+'}</span>
      </button>
      {offen && <div className="px-5 pb-5 text-gray-700 text-sm space-y-3">{children}</div>}
    </div>
  );
}

function FristCountdown({ frist }: { frist: FristErgebnis }) {
  if (frist.abgelaufen) {
    return (
      <div className="bg-red-100 text-red-700 rounded-xl px-4 py-3 text-sm font-medium">
        Frist abgelaufen am {frist.fristende}
      </div>
    );
  }
  const dringend = frist.verbleibende_tage <= 7;
  return (
    <div className={`rounded-xl px-4 py-3 text-sm ${dringend ? 'bg-red-100 text-red-700' : 'bg-blue-50 text-blue-700'}`}>
      <span className="font-bold text-lg">{frist.verbleibende_tage} Tage</span>
      <span className="ml-2">bis zum geschätzten Fristende ({frist.fristende})</span>
      <p className="text-xs mt-1 opacity-70">{frist.hinweis}</p>
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

  // Fristen mit berechnetem Countdown (nur Einspruch/Widerspruch/Klage, nicht Zahlungen ohne frist_tage)
  const fristenMitCountdown = a.fristen
    .map((f, i) => ({ frist: f, berechnet: daten.analyse.berechnete_fristen[i] }))
    .filter(({ berechnet }) => berechnet !== null);

  return (
    <main className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-lg mx-auto space-y-4">

        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-xl font-bold text-gray-900">KlarAmt</h1>
          <button
            onClick={() => router.push('/')}
            className="text-sm text-blue-600 hover:underline"
          >
            Neuer Brief
          </button>
        </div>

        {/* Absender */}
        <div className="bg-white rounded-xl border border-gray-200 px-5 py-4">
          <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Absender</p>
          <p className="font-semibold text-gray-900">{a.absender.behoerde}</p>
          {a.absender.abteilung && <p className="text-sm text-gray-500">{a.absender.abteilung}</p>}
          <p className="text-xs text-gray-400 mt-1">{a.dokumenttyp}</p>
        </div>

        {/* Ampel */}
        <div className={`rounded-xl border px-5 py-4 ${ampel.bg} ${ampel.border}`}>
          <div className="flex items-center gap-3 mb-2">
            <div className={`w-4 h-4 rounded-full ${ampel.kreis}`} />
            <span className={`font-semibold ${ampel.text}`}>{ampel.label}</span>
          </div>
          <p className="text-sm text-gray-700">{a.zusammenfassung}</p>
          <p className={`text-xs mt-2 ${ampel.text} opacity-80`}>{a.ampel.begruendung}</p>
        </div>

        {/* Frist-Countdowns */}
        {fristenMitCountdown.length > 0 && (
          <div className="space-y-2">
            {fristenMitCountdown.map(({ frist, berechnet }, i) => (
              <div key={i}>
                <p className="text-xs text-gray-400 mb-1">{frist.beschreibung}</p>
                <FristCountdown frist={berechnet!} />
              </div>
            ))}
          </div>
        )}

        {/* Zahlungsfristen (festes Datum) */}
        {a.fristen.filter(f => f.frist_tage === null && f.bescheid_datum).map((f, i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-700">
            <span className="font-medium">{f.beschreibung}</span>
            <span className="text-gray-400 ml-2">Fällig: {f.bescheid_datum}</span>
          </div>
        ))}

        {/* OCR-Warnung */}
        {a.ocr_qualitaet.confidence !== 'hoch' && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl px-4 py-3 text-sm text-yellow-700">
            Texterkennung eingeschränkt: {a.ocr_qualitaet.probleme}
          </div>
        )}

        {/* Erklärung */}
        <Aufklappbar titel="Erklärung — was steht da?">
          <p>{a.erklaerung.sachverhalt}</p>
          <p className="text-gray-500">{a.erklaerung.begruendung_behoerde}</p>
          <p className="font-medium text-gray-800">{a.erklaerung.bedeutung_fuer_dich}</p>
          {a.erklaerung.rechtsgrundlagen.length > 0 && (
            <div className="mt-2 space-y-2">
              {a.erklaerung.rechtsgrundlagen.map((rg, i) => (
                <div key={i} className="bg-gray-50 rounded-lg px-3 py-2">
                  <span className="font-mono text-xs text-gray-500">{rg.paragraph}</span>
                  <p className="text-sm mt-0.5">{rg.erklaerung}</p>
                </div>
              ))}
            </div>
          )}
        </Aufklappbar>

        {/* Handlungshinweise */}
        <Aufklappbar titel="Was kann ich tun?">
          <div className="space-y-3">
            {a.handlungshinweise.map((h, i) => (
              <div key={i} className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-gray-200 text-gray-600 text-xs font-bold flex items-center justify-center">
                  {h.prioritaet}
                </span>
                <div>
                  <p className="font-medium text-gray-800">{h.aktion}</p>
                  <p className="text-gray-500 text-xs mt-0.5">{h.erklaerung}</p>
                </div>
              </div>
            ))}
          </div>
        </Aufklappbar>

        {/* Eskalation */}
        {a.eskalation.beratung_empfohlen && (
          <div className="bg-orange-50 border border-orange-200 rounded-xl px-5 py-4">
            <p className="font-semibold text-orange-800 mb-1">Professionelle Beratung empfohlen</p>
            <p className="text-sm text-orange-700 mb-2">{a.eskalation.begruendung}</p>
            <p className="text-sm text-orange-700">{a.eskalation.beratungsstellen}</p>
          </div>
        )}

        {/* Antwortgenerator CTA oder Sperre */}
        {daten.antwortgenerierung.erlaubt ? (
          <div className="bg-white border border-gray-200 rounded-xl px-5 py-4 text-center">
            <p className="text-sm text-gray-500 mb-3">Musst du auf diesen Brief antworten?</p>
            <button
              disabled
              className="w-full bg-blue-100 text-blue-400 font-semibold py-3 rounded-xl cursor-not-allowed"
            >
              Antwortvorlage erstellen (kommt bald)
            </button>
          </div>
        ) : daten.antwortgenerierung.grund ? (
          <div className="bg-gray-50 border border-gray-200 rounded-xl px-5 py-4 text-sm text-gray-600">
            <p className="font-medium mb-1">Kein Antwortgenerator</p>
            <p>{daten.antwortgenerierung.grund}</p>
            {daten.antwortgenerierung.beratungsstellen && (
              <p className="mt-2 text-gray-500">{daten.antwortgenerierung.beratungsstellen}</p>
            )}
          </div>
        ) : null}

        {/* Meta-Hinweise */}
        {daten.meta.textGekuerzt && (
          <p className="text-xs text-center text-gray-400">
            Nur die ersten Seiten wurden analysiert (Dokument zu lang).
          </p>
        )}

        {/* Disclaimer */}
        <div className="text-xs text-center text-gray-400 pb-6">
          KlarAmt erklärt und formuliert — keine Rechtsberatung. Prüfe alle Angaben an deinem Original-Dokument.
        </div>
      </div>
    </main>
  );
}
