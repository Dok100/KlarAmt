# Release Checklist

Schlanke Checkliste fuer Solo-Releases.

## Vor dem Release

- Ziel und Scope des Releases sind klar
- offene bekannte Risiken sind dokumentiert
- relevante Features oder Fixes sind in `features/` aktualisiert
- Dokumentation ist auf aktuellem Stand

## Technische Checks

- `make check` laeuft
- stack-spezifische Tests laufen
- Security-Checks wurden ausgefuehrt
- keine echten Secrets oder `.env`-Dateien im Commit
- Logging enthaelt keine unnoetigen personenbezogenen Daten

## Produkt und Datenschutz

- neue Datenfluesse sind in `docs/privacy/` dokumentiert
- neue Dienstleister stehen in `docs/privacy/vendor-register.md`
- neue Aufbewahrungsregeln stehen in `docs/privacy/data-retention.md`
- Nutzertexte wie Datenschutzerklaerung oder Consent-Flow sind bei Bedarf aktualisiert

## Deployment

- Zielumgebung ist korrekt
- Backups oder Rollback-Weg sind bekannt
- kritische Umgebungsvariablen sind gesetzt
- Monitoring oder Logs fuer die ersten Minuten nach Release sind erreichbar

## Nach dem Release

- Smoke-Test in Produktion oder Zielumgebung
- kritische Pfade kurz pruefen
- bekannte Follow-ups notieren
