# GitHub Publish

Das Framework initialisiert nur ein lokales Git-Repository. Ein Repository auf GitHub wird nicht automatisch erstellt.

## Standardablauf

1. Neues Repository auf GitHub anlegen
2. Remote setzen
3. ersten Commit erstellen
4. Branch pushen

## Beispiel

```bash
git remote add origin <REPO_URL>
git add .
git commit -m "Initiales Projekt-Setup"
git branch -M main
git push -u origin main
```

## Vor dem ersten Push

- `README.md`, `SECURITY.md` und `docs/brief.md` angepasst
- keine echten Secrets im Repository
- `.env` nicht mitgestaged
- `make install` und `make precommit` gelaufen

## Optional

Wenn du GitHub per CLI nutzt, kannst du das Repository auch direkt mit `gh` anlegen.

## GitHub CLI (`gh`)

Voraussetzung:

- GitHub CLI installiert
- mit `gh auth login` angemeldet

Beispiel:

```bash
gh repo create <REPO_NAME> --private --source=. --remote=origin --push
```

Oder oeffentlich:

```bash
gh repo create <REPO_NAME> --public --source=. --remote=origin --push
```

Was der Befehl tut:

- erstellt das Repository auf GitHub
- setzt `origin`
- pusht den aktuellen Stand

Falls du lieber erst committen willst:

```bash
git add .
git commit -m "Initiales Projekt-Setup"
gh repo create <REPO_NAME> --private --source=. --remote=origin --push
```

Das bleibt bewusst optional und ist nicht Teil des Bootstrap-Skripts.
