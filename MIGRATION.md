# Migration zwischen Claude- und Codex-Framework

Diese Datei dokumentiert, wie Aenderungen zwischen dem Claude-Framework und dem Codex-Framework sauber synchronisiert werden.

## Ziel

Beide Frameworks sollen funktional moeglichst nah beieinander bleiben, ohne agentenspezifische Eigenheiten zu vermischen.

## Grundregel

Es wird nicht blind kopiert.
Stattdessen wird jede Aenderung einer von drei Kategorien zugeordnet:

1. gemeinsam nutzbare Struktur oder Funktion
2. agentenspezifische Steuerung
3. reine Formulierungs- oder Branding-Unterschiede

## Was normalerweise synchronisiert werden soll

- Ordnerstruktur und Projektartefakte
- Bootstrap-Logik in `scripts/bootstrap.sh`
- Stack-Profile mit lauffaehigen Startdateien
- Basis-CI und Makefile-Checks
- Templates fuer Features, Status und Task-Briefs
- Beispielprojekte, sofern sie agentenneutral gehalten werden koennen
- Dokumente mit fachlichem oder prozessualem Inhalt, z. B. Runbook, Stack-Guide, Security-Basis

## Was nicht blind synchronisiert werden soll

- `CLAUDE.md`
- `.claude/`
- `CLAUDE.stack.md`
- Codex- oder Claude-spezifische Prompts, Agentensteuerung oder Tool-Hinweise
- Formulierungen, die explizit auf einen Agenten zugeschnitten sind

## Mapping zwischen den Frameworks

| Claude-Framework | Codex-Framework | Hinweis |
| --- | --- | --- |
| `CLAUDE.md` | `AGENTS.md` plus `docs/workflow/` | Inhalt nur sinngemaess uebernehmen |
| `docs/workflow/claude-loop.md` | `docs/workflow/codex-loop.md` | gleicher Zweck, andere Agentenbezeichnung |
| `.claude/` | kein direktes Gegenstueck | nicht kopieren |
| `CLAUDE.stack.md` | kein direktes Gegenstueck | Inhalte nur bei echtem Mehrwert integrieren |

## Empfohlener Ablauf fuer kuenftige Synchronisationen

1. `diff -rq` zwischen beiden Frameworks ausfuehren.
2. Fehlende Dateien und Ordner nach Struktur, Funktion und Agentenbezug sortieren.
3. Agentenspezifische Dateien explizit ausklammern.
4. Gemeinsam nutzbare Teile in das Ziel-Framework uebernehmen.
5. Texte auf den Zielagenten umschreiben, statt Namen nur global zu ersetzen.
6. `make check` und wenn sinnvoll einen echten Bootstrap-Test in einer frischen Kopie ausfuehren.
7. Bewusst verbleibende Unterschiede in dieser Datei oder im PR festhalten.

## Aktuell bewusst verbleibende Unterschiede

- Das Claude-Framework hat `CLAUDE.md`, das Codex-Framework nicht.
- Das Codex-Framework hat ein staerker auf `AGENTS.md` und `docs/STATUS.md` ausgerichtetes Startsetup.
- Claude-spezifische Stack- und Tool-Konfigurationen wurden nicht in das Codex-Framework uebernommen.
- Die Workflow-Dateien bleiben agentenspezifisch benannt und formuliert.

## Checkliste vor dem Uebernehmen einer Aenderung

- Verbessert die Aenderung die gemeinsame Projektstruktur oder den gemeinsamen Workflow?
- Ist die Aenderung ohne Claude- oder Codex-spezifische Tools sinnvoll?
- Muss die Formulierung fuer den Zielagenten angepasst werden?
- Gibt es neue Pflichtdateien, die auch `make check` oder `bootstrap.sh` beruehren?
- Wurde das Ergebnis praktisch getestet?
