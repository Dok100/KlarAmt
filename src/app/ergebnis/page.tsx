'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { FristErgebnis, Zahlung } from '@/lib/fristen';

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
        antworttyp?: string;
        erklaerung: string;
      }[];
      eskalation: { beratung_empfohlen: boolean; begruendung: string; beratungsstellen: string };
      ocr_qualitaet: { confidence: string; probleme: string };
      zahlungen?: Zahlung[];
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

const ANTWORT_LABELS: Record<string, string> = {
  fristverlaengerung: 'Fristverlängerung beantragen',
  unterlagen_nachreichen: 'Unterlagen nachreichen',
  einspruch_einfach: 'Fristwahrenden Einspruch einlegen',
  widerspruch_einfach: 'Fristwahrenden Widerspruch einlegen',
  informationsanfrage: 'Auskunft / Akteneinsicht anfragen',
};

const ABSENDER_KEY = 'klaramt_absender';

interface Absender {
  name: string;
  strasse: string;
  plzOrt: string;
}

// Platzhalter clientseitig ersetzen — Absenderdaten verlassen das Gerät nie
function fuelleBrief(text: string, abs: Absender): string {
  const rep = (s: string, suchen: string, wert: string) => (wert.trim() ? s.split(suchen).join(wert.trim()) : s);
  const d = new Date();
  const datum = `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}.${d.getFullYear()}`;
  const ort = abs.plzOrt.replace(/^\s*\d{4,5}\s*/, '').trim();
  let out = text;
  out = rep(out, '[DEIN NAME]', abs.name);
  out = rep(out, '[DEINE STRASSE UND HAUSNUMMER]', abs.strasse);
  out = rep(out, '[DEINE PLZ UND ORT]', abs.plzOrt);
  out = rep(out, '[ORT]', ort);
  out = out.split('[DATUM]').join(datum);
  return out;
}

function Feld({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <label style={{ display: 'block' }}>
      <span style={{ fontSize: '0.6875rem', color: '#9c9087', fontWeight: 600 }}>{label}</span>
      <input
        type="text"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        style={{
          width: '100%',
          marginTop: '0.25rem',
          padding: '0.5rem 0.625rem',
          borderRadius: '8px',
          border: '1.5px solid #e0d8cc',
          background: '#faf8f4',
          color: '#1a1814',
          fontSize: '0.8125rem',
          fontFamily: 'inherit',
          boxSizing: 'border-box',
        }}
      />
    </label>
  );
}

type AnalyseInhalt = ErgebnisData['analyse']['analyse'];

function Antwortgenerator({ a }: { a: AnalyseInhalt }) {
  const typen = Array.from(
    new Set(
      a.handlungshinweise
        .map((h) => h.antworttyp)
        .filter((t): t is string => !!t && t in ANTWORT_LABELS)
    )
  );

  const [gewaehlt, setGewaehlt] = useState<string | null>(null);
  const [laedt, setLaedt] = useState(false);
  const [brief, setBrief] = useState('');
  const [fehler, setFehler] = useState<string | null>(null);
  const [kopiert, setKopiert] = useState(false);
  const [absender, setAbsender] = useState<Absender>({ name: '', strasse: '', plzOrt: '' });
  const [empf, setEmpf] = useState({
    behoerde: a.absender.behoerde,
    abteilung: a.absender.abteilung,
    strasse: '',
    plzOrt: '',
    aktenzeichen: a.absender.aktenzeichen,
  });

  useEffect(() => {
    try {
      const r = localStorage.getItem(ABSENDER_KEY);
      if (r) setAbsender(JSON.parse(r));
    } catch {
      // ungültiger localStorage-Inhalt wird ignoriert
    }
  }, []);

  function updateAbsender(feld: keyof Absender, wert: string) {
    setAbsender((prev) => {
      const next = { ...prev, [feld]: wert };
      try { localStorage.setItem(ABSENDER_KEY, JSON.stringify(next)); } catch { /* localStorage nicht verfügbar */ }
      return next;
    });
  }

  if (typen.length === 0) return null;

  async function generiere(typ: string) {
    setGewaehlt(typ);
    setFehler(null);
    setKopiert(false);
    setBrief('');
    setLaedt(true);
    try {
      const res = await fetch('/api/antwort', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          antworttyp: typ,
          behoerde: empf.behoerde,
          abteilung: empf.abteilung,
          strasse: empf.strasse,
          plzOrt: empf.plzOrt,
          aktenzeichen: empf.aktenzeichen,
          dokumenttyp: a.dokumenttyp,
          sprache: 'Deutsch',
        }),
      });
      const data = await res.json();
      if (!res.ok || data.fehler) {
        setFehler(data.fehler || 'Die Vorlage konnte nicht erstellt werden. Bitte versuche es erneut.');
        return;
      }
      setBrief(fuelleBrief(data.brief, absender));
    } catch {
      setFehler('Verbindungsfehler. Bitte prüfe deine Internetverbindung und versuche es erneut.');
    } finally {
      setLaedt(false);
    }
  }

  async function kopieren() {
    await navigator.clipboard.writeText(brief);
    setKopiert(true);
    setTimeout(() => setKopiert(false), 2000);
  }

  async function alsPdf() {
    const { jsPDF } = await import('jspdf');
    const doc = new jsPDF({ unit: 'pt', format: 'a4' });
    const mm = (v: number) => v * 2.83465;
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();
    const left = mm(25);
    const right = pageW - mm(20);
    const textW = right - left;
    const lh = 14;

    const lines = brief.replace(/\r/g, '').split('\n');
    const voll = (s: string) => s.trim().length > 0;

    const dateRe = /\d{1,2}\.\s*\d{1,2}\.\s*\d{2,4}/;
    const anredeRe = /^(sehr geehrte|sehr geehrter|sehr verehrte|guten tag|hallo)/i;
    const grussRe = /(freundlichen gr|freundlichem gruß|freundliche grüße|besten grüßen)/i;

    const idxDate = lines.findIndex((l) => dateRe.test(l) && /(,|\bden\b)/.test(l));
    const idxAnrede = lines.findIndex((l) => anredeRe.test(l.trim()));

    function einfacherFluss() {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(11);
      let y = mm(25);
      for (const z of doc.splitTextToSize(brief, textW) as string[]) {
        if (y > pageH - mm(20)) { doc.addPage(); y = mm(25); }
        doc.text(z, left, y);
        y += lh;
      }
      doc.save('klaramt-antwort.pdf');
    }

    if (idxDate < 0 || idxAnrede < 0 || idxDate >= idxAnrede) {
      einfacherFluss();
      return;
    }

    // Absender: führende nicht-leere Zeilen
    let p = 0;
    const sender: string[] = [];
    while (p < lines.length && voll(lines[p])) { sender.push(lines[p].trim()); p++; }

    // Empfänger: nicht-leerer Block direkt vor dem Datum
    let r = idxDate - 1;
    while (r >= 0 && !voll(lines[r])) r--;
    const recEnd = r;
    while (r >= 0 && voll(lines[r])) r--;
    const empfaenger = lines.slice(r + 1, recEnd + 1).map((s) => s.trim());

    const datum = lines[idxDate].trim();
    const betreff = lines.slice(idxDate + 1, idxAnrede)
      .filter(voll)
      .map((s) => s.replace(/^betreff:\s*/i, '').trim());
    const anrede = lines[idxAnrede].trim();

    const idxGruss = lines.findIndex((l, i) => i > idxAnrede && grussRe.test(l));
    const bodyEnd = idxGruss >= 0 ? idxGruss : lines.length;
    const bodyLines = lines.slice(idxAnrede + 1, bodyEnd);
    const gruss = idxGruss >= 0 ? lines[idxGruss].trim() : '';
    const name = idxGruss >= 0 ? lines.slice(idxGruss + 1).filter(voll).map((s) => s.trim()) : [];

    // Rücksendeangabe (Absender, klein, unterstrichen)
    if (sender.length) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      const ra = sender.join(' · ');
      doc.text(ra, left, mm(24));
      doc.setLineWidth(0.5);
      doc.line(left, mm(24) + 2, left + doc.getTextWidth(ra), mm(24) + 2);
    }

    // Anschriftfeld (Empfänger)
    doc.setFontSize(11);
    let y = mm(33);
    for (const e of empfaenger) { doc.text(e, left, y); y += mm(5); }

    // Datum rechtsbündig, unterhalb des Anschriftfelds (DIN-Mindestposition mm(63))
    const datumY = Math.max(mm(63), y + mm(8));
    doc.text(datum, right, datumY, { align: 'right' });

    // Betreff fett
    doc.setFont('helvetica', 'bold');
    let yy = datumY + mm(12);
    for (const b of betreff) {
      for (const z of doc.splitTextToSize(b, textW) as string[]) { doc.text(z, left, yy); yy += mm(5); }
    }
    doc.setFont('helvetica', 'normal');

    // Anrede
    yy += mm(6);
    doc.text(anrede, left, yy);
    yy += mm(8);

    // Fließtext, Absätze durch Leerzeilen getrennt
    let para: string[] = [];
    const schreibe = (text: string) => {
      for (const z of doc.splitTextToSize(text, textW) as string[]) {
        if (yy > pageH - mm(25)) { doc.addPage(); yy = mm(25); }
        doc.text(z, left, yy);
        yy += lh;
      }
    };
    const absatz = () => { if (para.length) { schreibe(para.join(' ')); para = []; yy += mm(3); } };
    for (const b of bodyLines) { if (voll(b)) para.push(b.trim()); else absatz(); }
    absatz();

    // Gruß + Unterschriftsraum + Name
    if (gruss) {
      yy += mm(2);
      if (yy > pageH - mm(45)) { doc.addPage(); yy = mm(25); }
      doc.text(gruss, left, yy);
      yy += mm(20);
    }
    for (const n of name) {
      if (yy > pageH - mm(20)) { doc.addPage(); yy = mm(25); }
      doc.text(n, left, yy);
      yy += mm(5);
    }

    doc.save('klaramt-antwort.pdf');
  }

  return (
    <Card style={{ padding: '1.25rem' }}>
      <p style={{ fontWeight: 700, color: '#1a1814', fontSize: '0.9375rem', letterSpacing: '-0.01em', marginBottom: '0.375rem' }}>
        Antwort erstellen
      </p>
      <p style={{ fontSize: '0.8125rem', color: '#7a6e63', lineHeight: 1.6, marginBottom: '1rem' }}>
        Wähle, was du tun möchtest. KlarAmt erstellt eine fristwahrende Vorlage zum Bearbeiten.
      </p>

      {/* Schritt 1: Aktion wählen */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {typen.map((t) => (
          <button
            key={t}
            onClick={() => { setGewaehlt(t); setBrief(''); setFehler(null); setKopiert(false); }}
            disabled={laedt}
            style={{
              textAlign: 'left',
              padding: '0.75rem 0.875rem',
              borderRadius: '10px',
              fontSize: '0.875rem',
              fontWeight: 600,
              border: gewaehlt === t ? '1.5px solid #1a1814' : '1.5px solid #e0d8cc',
              background: gewaehlt === t ? '#1a1814' : 'transparent',
              color: gewaehlt === t ? '#f3ede1' : '#3d3530',
              cursor: laedt ? 'wait' : 'pointer',
              transition: 'all 0.12s',
            }}
          >
            {ANTWORT_LABELS[t]}
          </button>
        ))}
      </div>

      {/* Schritt 2: Daten erst nach Auswahl */}
      {gewaehlt && !brief && !laedt && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem', marginTop: '1.125rem' }}>
          <div>
            <p style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#9c9087', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.5rem' }}>
              Deine Daten <span style={{ textTransform: 'none', fontWeight: 500, color: '#b0a498' }}>· optional, bleiben auf deinem Gerät</span>
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <Feld label="Name" value={absender.name} onChange={(v) => updateAbsender('name', v)} placeholder="Vor- und Nachname" />
              <Feld label="Straße und Hausnummer" value={absender.strasse} onChange={(v) => updateAbsender('strasse', v)} placeholder="Musterstraße 1" />
              <Feld label="PLZ und Ort" value={absender.plzOrt} onChange={(v) => updateAbsender('plzOrt', v)} placeholder="12345 Musterstadt" />
            </div>
          </div>
          <div>
            <p style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#9c9087', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.5rem' }}>
              Empfänger <span style={{ textTransform: 'none', fontWeight: 500, color: '#b0a498' }}>· aus dem Bescheid, bei Bedarf korrigieren</span>
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <Feld label="Behörde" value={empf.behoerde} onChange={(v) => setEmpf((p) => ({ ...p, behoerde: v }))} />
              <Feld label="Abteilung" value={empf.abteilung} onChange={(v) => setEmpf((p) => ({ ...p, abteilung: v }))} />
              <Feld label="Straße und Hausnummer" value={empf.strasse} onChange={(v) => setEmpf((p) => ({ ...p, strasse: v }))} placeholder="aus dem Briefkopf" />
              <Feld label="PLZ und Ort" value={empf.plzOrt} onChange={(v) => setEmpf((p) => ({ ...p, plzOrt: v }))} placeholder="aus dem Briefkopf" />
              <Feld label="Aktenzeichen" value={empf.aktenzeichen} onChange={(v) => setEmpf((p) => ({ ...p, aktenzeichen: v }))} />
            </div>
          </div>
          <button
            onClick={() => generiere(gewaehlt)}
            style={{ width: '100%', background: '#1a1814', color: '#f3ede1', fontWeight: 600, fontSize: '0.9375rem', padding: '0.875rem', borderRadius: '10px', border: 'none', cursor: 'pointer', letterSpacing: '-0.01em', marginTop: '0.25rem' }}
          >
            Vorlage erstellen
          </button>
        </div>
      )}

      {laedt && (
        <div style={{ textAlign: 'center', padding: '1.5rem 0' }}>
          <div style={{ width: 26, height: 26, border: '2.5px solid #e0d8cc', borderTopColor: '#1a1814', borderRadius: '50%', animation: 'spin 0.75s linear infinite', margin: '0 auto 0.625rem' }} />
          <p style={{ color: '#7a6e63', fontSize: '0.8125rem' }}>Vorlage wird erstellt…</p>
        </div>
      )}

      {fehler && (
        <div style={{ marginTop: '0.875rem', padding: '0.75rem 0.875rem', background: '#f7ece8', border: '1px solid #e8c4b8', borderRadius: '10px', color: '#b53d1f', fontSize: '0.8125rem', lineHeight: 1.55 }}>
          {fehler}
        </div>
      )}

      {brief && !laedt && (
        <div style={{ marginTop: '1rem' }}>
          <div style={{ background: '#fdf4e0', border: '1px solid #e0c878', borderRadius: '10px', padding: '0.75rem 0.875rem', fontSize: '0.75rem', color: '#92660f', lineHeight: 1.55, marginBottom: '0.75rem' }}>
            Das ist eine fristwahrende Vorlage ohne Begründung. Prüfe alle Angaben, ergänze die markierten Felder ([DEIN NAME] usw.) und füge bei Bedarf eine Begründung hinzu. KlarAmt leistet keine Rechtsberatung.
          </div>
          <textarea
            value={brief}
            onChange={(e) => setBrief(e.target.value)}
            rows={16}
            style={{
              width: '100%',
              padding: '0.875rem',
              borderRadius: '10px',
              border: '1.5px solid #e0d8cc',
              background: '#faf8f4',
              color: '#1a1814',
              fontSize: '0.8125rem',
              lineHeight: 1.6,
              fontFamily: 'inherit',
              resize: 'vertical',
              boxSizing: 'border-box',
            }}
          />
          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.625rem' }}>
            <button
              onClick={kopieren}
              style={{ flex: 1, background: 'transparent', color: '#3d3530', fontWeight: 600, fontSize: '0.875rem', padding: '0.75rem', borderRadius: '10px', border: '1.5px solid #e0d8cc', cursor: 'pointer' }}
            >
              {kopiert ? 'Kopiert ✓' : 'Kopieren'}
            </button>
            <button
              onClick={alsPdf}
              style={{ flex: 1, background: '#1a1814', color: '#f3ede1', fontWeight: 600, fontSize: '0.875rem', padding: '0.75rem', borderRadius: '10px', border: 'none', cursor: 'pointer' }}
            >
              Als PDF herunterladen
            </button>
          </div>
        </div>
      )}
    </Card>
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

        {/* Zahlungstabelle — aus strukturiertem zahlungen-Feld (Bürgergeld) oder fristen-Array (Steuerbescheid) */}
        {(() => {
          // Neues strukturiertes Feld bevorzugen
          const strukturiert = a.zahlungen ?? [];
          if (strukturiert.length > 0) {
            return (
              <div style={{ background: '#faf8f4', border: '1px solid #e0d8cc', borderRadius: '12px', overflow: 'hidden' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', padding: '0.625rem 1rem', borderBottom: '1px solid #e0d8cc', background: '#f3ede1' }}>
                  <span style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#9c9087', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Zahlungen laut Bescheid</span>
                  <span style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#9c9087', textTransform: 'uppercase', letterSpacing: '0.07em', textAlign: 'right' }}>Betrag</span>
                </div>
                {strukturiert.map((z, i) => {
                  const bekommst = z.richtung === 'du_bekommst';
                  const betragText = z.betrag.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                  return (
                    <div key={i} style={{
                      display: 'grid', gridTemplateColumns: '1fr auto', alignItems: 'center', gap: '0.75rem',
                      padding: '0.75rem 1rem',
                      borderBottom: i < strukturiert.length - 1 ? '1px solid #e0d8cc' : 'none',
                    }}>
                      <div>
                        <p style={{ fontWeight: 600, fontSize: '0.875rem', color: '#1a1814', letterSpacing: '-0.01em' }}>{z.zeitraum}</p>
                        <p style={{ fontSize: '0.75rem', color: '#9c9087', marginTop: '0.15rem', lineHeight: 1.4 }}>
                          {bekommst ? 'Du bekommst' : 'Du zahlst'}{z.empfaenger ? ` · ${z.empfaenger}` : ''}{z.hinweis ? ` · ${z.hinweis}` : ''}
                        </p>
                      </div>
                      <span style={{ fontWeight: 700, fontSize: '1rem', color: bekommst ? '#2d6a4f' : '#1a1814', whiteSpace: 'nowrap', textAlign: 'right' }}>
                        {bekommst ? '+ ' : '− '}{betragText} €
                      </span>
                    </div>
                  );
                })}
              </div>
            );
          }
          // Fallback: fristen-basierte Tabelle für Steuerbescheide
          const fristenZahlungen = a.fristen.filter(f => f.frist_tage === null && f.bescheid_datum);
          if (fristenZahlungen.length === 0) return null;
          return (
            <div style={{ background: '#faf8f4', border: '1px solid #e0d8cc', borderRadius: '12px', overflow: 'hidden' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', padding: '0.625rem 1rem', borderBottom: '1px solid #e0d8cc', background: '#f3ede1' }}>
                <span style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#9c9087', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Zahlungen laut Bescheid</span>
                <span style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#9c9087', textTransform: 'uppercase', letterSpacing: '0.07em', textAlign: 'right' }}>Betrag</span>
              </div>
              {fristenZahlungen.map((f, i) => {
                const betrag = extrahiereBetrag(f.beschreibung);
                const beschreibungKurz = f.beschreibung.replace(/\s*=\s*[\d.,]+\s*(?:Euro|€).*$/, '').trim();
                return (
                  <div key={i} style={{
                    display: 'grid', gridTemplateColumns: '1fr auto', alignItems: 'center', gap: '0.75rem',
                    padding: '0.75rem 1rem',
                    borderBottom: i < fristenZahlungen.length - 1 ? '1px solid #e0d8cc' : 'none',
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

        {/* Handlungshinweise — bei ROT standardmäßig offen */}
        <Aufklappbar titel="Was kann ich tun?" defaultOffen={a.ampel.status === 'rot'}>
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
          <Antwortgenerator a={a} />
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
