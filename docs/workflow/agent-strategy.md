# Agent Strategy

Leitlinie fuer den sparsamen Einsatz zusaetzlicher Agenten im Framework.

## Grundsatz

Fuer Solo-Arbeit reichen `AGENTS.md`, `features/` und `templates/task-brief.md` meistens aus.

Zusaetzliche Agenten lohnen sich erst, wenn eine Aufgabe:

- regelmaessig wiederkehrt
- einem klaren Muster folgt
- einen anderen Fokus als der Haupt-Workflow braucht

## Einfache Schwelle

Wenn du dieselbe Art Aufgabe ungefaehr 5 bis 10 Mal mit denselben Anweisungen wiederholst, ist ein eigener Agent sinnvoll.

## Gute erste Agenten

### `security-privacy-checker`

Gut fuer:

- neue Datenfluesse
- Logs mit moeglicher PII
- neue Vendoren
- Auth-, Upload-, Tracking- oder AI-Risiken

Typische Eingaben:

- betroffene Dateien
- neue oder geaenderte Datenfluesse
- relevante Dateien in `docs/privacy/`
- gewuenschter Fokus: Security, Datenschutz oder beides

### `code-reviewer`

Gut fuer:

- Bug-Risiken
- Verhaltensregressionen
- fehlende Tests
- unnoetige Komplexitaet

Typische Eingaben:

- betroffene Dateien oder Diff
- Fokusbereich, z. B. Sicherheit, Logik, Performance
- erwartetes Verhalten

### `release-assistant`

Gut fuer:

- Releases nach derselben Checkliste
- Smoke-Tests
- Deployment- und Rollback-Pruefung

Typische Eingaben:

- Zielumgebung
- relevante Release-Notes oder Features
- `docs/release-checklist.md`
- `docs/runbook.md`

## Was du nicht zu frueh tun solltest

- keine Agenten fuer seltene Spezialfaelle bauen
- keine Rollen erfinden, bevor echte Wiederholungsmuster sichtbar sind
- nicht denselben Scope gleichzeitig an Haupt-Workflow und Agent geben

## Faustregel

Zuerst den Standard-Workflow meistern, dann genau einen Agenten einfuehren, der ein wiederkehrendes Risiko oder einen wiederkehrenden Pruefprozess abdeckt.
