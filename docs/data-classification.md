# Data Classification

Ordne Daten in sinnvolle Schutzklassen ein, damit Logging, Speicherung und Zugriff bewusst gestaltet werden.

## Klassen

### Oeffentlich

Beispiele:

- frei veroeffentlichte Inhalte
- Marketingtexte
- Produktbeschreibungen ohne Personenbezug

Anforderungen:

- geringe Schutzanforderung

### Intern

Beispiele:

- interne Betriebsdaten
- technische Dokumentation
- normale Anwendungsmetriken ohne Personenbezug

Anforderungen:

- kein oeffentlicher Zugriff ohne Absicht

### Vertraulich

Beispiele:

- Nutzerkonten
- E-Mail-Adressen
- Support-Inhalte
- pseudonymisierte, aber rueckfuehrbare IDs

Anforderungen:

- Zugriff nur bei Bedarf
- keine unnötige Speicherung in Logs
- Export und Loeschung mitdenken

### Sensibel

Beispiele:

- Zahlungsdaten
- Gesundheitsdaten
- Standortdaten
- Zugangstokens
- besondere Kategorien personenbezogener Daten

Anforderungen:

- minimale Erhebung
- starke Zugriffskontrolle
- kurze Speicherfristen, falls moeglich
- gesonderte Risiko- und Datenschutzpruefung

## Nutzung

- neue Datenobjekte in `docs/architecture.md` und `docs/privacy/ropa.md` gegen diese Klassen pruefen
- Logs, Analytics und Support-Prozesse an der hoechsten betroffenen Klasse ausrichten
- bei sensiblen Daten `docs/privacy/dpia-checklist.md` bewusst pruefen
