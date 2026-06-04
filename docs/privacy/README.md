# Privacy

Diese Dateien helfen dabei, Datenschutz und DSGVO-Anforderungen frueh strukturiert zu dokumentieren.

## Ziel

Nicht jedes Projekt braucht sofort denselben Detailgrad. Sobald jedoch echte Nutzerdaten verarbeitet werden, sollten diese Artefakte gepflegt werden.

## Enthaltene Dateien

- `ropa.md`: Verzeichnis der Verarbeitungstaetigkeiten
- `vendor-register.md`: eingesetzte Dienstleister, Regionen, DPAs, Transfers
- `data-retention.md`: Loeschfristen und Aufbewahrungslogik
- `dsr-process.md`: Umgang mit Auskunft, Loeschung, Berichtigung, Export
- `dpia-checklist.md`: Pruefung, ob eine Datenschutz-Folgenabschaetzung noetig ist

## Grundregeln

- nur notwendige personenbezogene Daten erheben
- keine echten Nutzerdaten in Test-, Demo- oder Prompt-Beispielen
- Logs, Analytics und Support-Prozesse auf PII pruefen
- bei neuen externen Tools immer erst `vendor-register.md` aktualisieren
