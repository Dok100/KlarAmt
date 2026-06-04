# Security Policy

Danke fuer verantwortungsvolle Hinweise auf Sicherheitsprobleme in diesem Projekt.

## Supported Versions

Trage hier ein, welche Versionen oder Deployments aktiv gepflegt werden.

| Version | Supported |
| --- | --- |
| `main` | yes |
| `<OLDER_VERSION>` | no |

## Reporting a Vulnerability

Bitte melde vermutete Sicherheitsluecken nicht als oeffentliches GitHub Issue.

Nutze stattdessen einen vertraulichen Kanal:

- E-Mail: `<SECURITY_CONTACT>`
- Alternativ: `<PRIVATE_REPORTING_CHANNEL>`

Bitte liefere in der Meldung nach Moeglichkeit:

- betroffene Komponente oder Datei
- Beschreibung der Schwachstelle
- Reproduktionsschritte
- moegliche Auswirkungen
- falls vorhanden: Proof of Concept oder Screenshots

## Expected Response

Empfohlene Ausgangswerte:

- Eingangsbestätigung innerhalb von `3` Werktagen
- erste fachliche Einschaetzung innerhalb von `5` Werktagen
- regelmaessige Updates bis zur Klaerung oder Behebung

Passe diese Werte an die reale Reaktionsfaehigkeit des Teams an.

## Disclosure Policy

Wir bitten darum, gemeldete Sicherheitsluecken zunaechst vertraulich zu behandeln und nicht oeffentlich offenzulegen, bis:

- der Sachverhalt validiert wurde
- ein Fix oder eine angemessene Gegenmassnahme bereitsteht
- ein gemeinsamer Zeitpunkt fuer die Offenlegung abgestimmt wurde

## Scope

Typisch im Scope:

- Produktionscode in `src/`
- Authentifizierung und Autorisierung
- Konfigurations- und Secret-Handling
- API-Endpunkte, Uploads, Datenzugriffe und sensible Integrationen

Typisch nicht im Scope:

- rein theoretische Risiken ohne realistische Ausnutzbarkeit
- Probleme in nicht genutzten Beispielwerten
- Schwachstellen ausschliesslich in lokalen Entwicklungsumgebungen ohne Sicherheitsrelevanz

## Safe Harbor

Wenn du in gutem Glauben, ohne Datenexfiltration, ohne Stoerung des Betriebs und im Rahmen dieser Richtlinie handelst, behandeln wir deine Meldung als verantwortungsvolle Sicherheitsmeldung.
