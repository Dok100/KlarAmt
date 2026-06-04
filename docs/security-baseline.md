# Security Baseline

Diese Vorlage bringt eine minimale Sicherheitsbasis fuer neue Projekte mit.

## Enthalten

- `.env`-Dateien und private Schluessel sind in `.gitignore`
- `scripts/check-secrets.sh` blockiert typische Secrets im Pre-Commit
- `scripts/pre-commit.sh` fuehrt lokale Basischecks vor Commits aus
- `scripts/install-git-hooks.sh` installiert den Git-Hook automatisch beim Bootstrap
- `Dependabot` aktualisiert Abhaengigkeiten und GitHub Actions regelmaessig
- `CodeQL` ist fuer unterstuetzte Stack-Profile in GitHub Actions enthalten
- Stack-Profile enthalten Security-Checks wie `npm audit`, `bandit` und `pip-audit`
- `SECURITY.md` beschreibt den Responsible-Disclosure-Prozess
- `docs/privacy/` enthaelt die Datenschutz-Basis fuer Datenfluesse, Dienstleister und Loeschregeln

## `.env`-Policy

- echte Geheimnisse gehoeren nur in `.env` oder einen Secret-Manager
- `.env.example` darf nur Platzhalter oder offensichtliche Beispielwerte enthalten
- neue Umgebungsvariablen muessen immer zuerst in `.env.example` dokumentiert werden
- keine Tokens, privaten Zertifikate oder Zugangsdaten in Markdown, Tests oder Fixtures ablegen
- Kontaktangaben in `SECURITY.md` muessen vor dem ersten oeffentlichen Push angepasst werden

## Erwartete Arbeitsweise

- vor dem ersten Commit `make install` und anschliessend `make precommit` ausfuehren
- Security-Audits auch in CI laufen lassen
- Dependabot-PRs nicht blind mergen, sondern durch Tests und Review absichern

## Grenzen

- Musterbasierte Secret-Pruefung findet nicht alles
- `npm audit` und `pip-audit` benoetigen Netzwerkzugriff
- CSP- und Header-Profile muessen je nach Produkt und Integrationen nachgeschaerft werden

## Abgrenzung zu Datenschutz

Security ist nicht gleich DSGVO. Technische Sicherheit hilft, ersetzt aber nicht:

- Transparenz gegenueber Nutzern
- Rechtsgrundlagen fuer Verarbeitung
- Loesch- und Auskunftsprozesse
- Vendor- und Transfer-Pruefung

## Solo-Betrieb

Wenn du allein arbeitest, sind diese Dateien oft die pragmatischsten Ergaenzungen:

- `docs/release-checklist.md`
- `docs/runbook.md`
- `docs/data-classification.md`
