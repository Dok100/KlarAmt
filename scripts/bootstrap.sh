#!/bin/sh
set -eu

PROJECT_NAME_INPUT=${PROJECT_NAME:-}
STACK_INPUT=${STACK:-}
PROJECT_SUMMARY_INPUT=${PROJECT_SUMMARY:-}
PRIMARY_USERS_INPUT=${PRIMARY_USERS:-}
DEPLOY_TARGET_INPUT=${DEPLOY_TARGET:-}
REPO_VISIBILITY_INPUT=${REPO_VISIBILITY:-}
PERSONAL_DATA_INPUT=${PERSONAL_DATA_PROCESSING:-}
SECURITY_CONTACT_INPUT=${SECURITY_CONTACT:-}
FIRST_FEATURE_INPUT=${FIRST_FEATURE_TITLE:-}

prompt_if_empty() {
  var_name=$1
  prompt_text=$2
  current_value=$3

  if [ -n "$current_value" ]; then
    printf "%s" "$current_value"
    return 0
  fi

  if [ -t 0 ]; then
    printf "%s" "$prompt_text" >&2
    read -r response
    printf "%s" "$response"
    return 0
  fi

  printf "%s" "$current_value"
}

replace_placeholder() {
  search=$1
  replace=$2
  file=$3

  if [ -f "$file" ]; then
    SEARCH="$search" REPLACE="$replace" perl -0pi -e 's/\Q$ENV{SEARCH}\E/$ENV{REPLACE}/g' "$file"
  fi
}

slugify() {
  value=$1
  printf "%s" "$value" | tr '[:upper:]' '[:lower:]' | sed -e 's/[^a-z0-9]/-/g' -e 's/-\{2,\}/-/g' -e 's/^-//' -e 's/-$//'
}

apply_stack_profile() {
  selected_stack=$1
  profile_dir="./stack-profiles/$selected_stack"

  case "$selected_stack" in
    generic|nextjs|node-api|python|swift-macos|go)
      if [ -d "$profile_dir" ]; then
        cp -R "$profile_dir"/. .
        printf "Stack-Profil angewendet: %s\n" "$selected_stack"
      fi
      ;;
  esac
}

remove_template_only_files() {
  current_dir_name=$(basename "$(pwd)")

  if [ "$current_dir_name" != "Claude-Projekt-Framework" ] && [ -d "./stack-profiles" ]; then
    rm -rf ./stack-profiles
  fi
}

rename_first_feature_file() {
  feature_slug=$1
  source_file="./features/PROJ-1-beispiel-feature.md"
  target_file="./features/PROJ-1-$feature_slug.md"

  if [ -f "$source_file" ] && [ "$source_file" != "$target_file" ]; then
    mv "$source_file" "$target_file"
  fi
}

print_path_status() {
  path=$1
  kind=$2

  if [ "$kind" = "file" ]; then
    if [ -f "$path" ]; then
      printf "[ok] %s\n" "$path"
    else
      printf "[missing] %s\n" "$path"
    fi
    return 0
  fi

  if [ -d "$path" ]; then
    printf "[ok] %s\n" "$path"
  else
    printf "[missing] %s\n" "$path"
  fi
}

print_stack_steps() {
  selected_stack=$1

  printf "\nStack-spezifische Startschritte:\n"

  case "$selected_stack" in
    nextjs)
      printf "%s\n" '- `npm install`'
      printf "%s\n" '- `npm install next react react-dom typescript @types/react @types/node`'
      printf "%s\n" '- `npx shadcn@latest init` falls UI mit shadcn geplant ist'
      printf "%s\n" '- `npm run dev` als lokalen Startpunkt einrichten'
      ;;
    node-api)
      printf "%s\n" '- `npm install`'
      printf "%s\n" '- Web- oder API-Framework waehlen, z. B. Express, Fastify oder Nest'
      printf "%s\n" '- Health-Check, Logging und `.env` frueh definieren'
      printf "%s\n" '- Test-Runner und Linter direkt nachziehen'
      ;;
    python)
      printf "%s\n" '- virtuelle Umgebung anlegen, z. B. `python3 -m venv .venv`'
      printf "%s\n" '- Abhaengigkeiten in `requirements.txt` oder `pyproject.toml` definieren'
      printf "%s\n" '- Linting und Tests mit Ruff und Pytest vorbereiten'
      printf "%s\n" '- lokalen Startbefehl im Makefile ergaenzen'
      ;;
    swift-macos)
      printf "%s\n" '- `brew install xcodegen swiftformat` falls die Tools noch fehlen'
      printf "%s\n" '- `make install` zum Generieren des Xcode-Projekts nutzen'
      printf "%s\n" '- Signierung, Sandbox und Entitlements frueh in `project.yml` und Xcode pruefen'
      printf "%s\n" '- fuer Distribution spaeter Notarisierung und Release-Prozess ergaenzen'
      ;;
    go)
      printf "%s\n" '- `go mod init <module-name>`'
      printf "%s\n" '- Paketstruktur unter `src/` oder direkt im Root festlegen'
      printf "%s\n" '- `go test ./...` und `go fmt ./...` ins Makefile uebernehmen'
      printf "%s\n" '- Konfiguration und Environment-Handling frueh festlegen'
      ;;
    generic|"")
      printf "%s\n" '- den konkreten Stack in `docs/architecture.md` festhalten'
      printf "%s\n" '- passende Lint-, Test- und Start-Targets ins Makefile uebernehmen'
      printf "%s\n" '- CI nach den echten Projektkommandos ausrichten'
      ;;
    *)
      printf "%s\n" "- unbekannter Stack \`$selected_stack\`; bitte manuell in \`docs/architecture.md\` festhalten"
      printf "%s\n" '- Makefile und CI anschliessend passend erweitern'
      ;;
  esac
}

printf "Claude-Projekt-Framework wird vorbereitet...\n"

default_project_name=$(basename "$(pwd)")
if [ "$default_project_name" = "Claude-Projekt-Framework" ]; then
  default_project_name=""
fi

project_name=$(prompt_if_empty "PROJECT_NAME" "Projektname: " "${PROJECT_NAME_INPUT:-$default_project_name}")
stack_name=$(prompt_if_empty "STACK" "Stack (generic, nextjs, node-api, python, swift-macos, go) [generic]: " "$STACK_INPUT")

if [ -z "$project_name" ]; then
  project_name="Neues Projekt"
fi

if [ -z "$stack_name" ]; then
  stack_name="generic"
fi

project_summary=$(prompt_if_empty "PROJECT_SUMMARY" "Kurzbeschreibung: " "$PROJECT_SUMMARY_INPUT")
primary_users=$(prompt_if_empty "PRIMARY_USERS" "Primaere Nutzer oder Stakeholder: " "$PRIMARY_USERS_INPUT")
deploy_target=$(prompt_if_empty "DEPLOY_TARGET" "Deployment-Ziel [noch festzulegen]: " "$DEPLOY_TARGET_INPUT")
repo_visibility=$(prompt_if_empty "REPO_VISIBILITY" "Repository-Sichtbarkeit (private/public) [private]: " "$REPO_VISIBILITY_INPUT")
personal_data_processing=$(prompt_if_empty "PERSONAL_DATA_PROCESSING" "Verarbeitet das Projekt personenbezogene Daten? (ja/nein/unklar) [unklar]: " "$PERSONAL_DATA_INPUT")
security_contact=$(prompt_if_empty "SECURITY_CONTACT" "Security-Kontakt [security@domain.tld]: " "$SECURITY_CONTACT_INPUT")
first_feature_title=$(prompt_if_empty "FIRST_FEATURE_TITLE" "Erstes priorisiertes Feature: " "$FIRST_FEATURE_INPUT")

if [ -z "$project_summary" ]; then
  project_summary="Kurzbeschreibung des Projekts ergaenzen."
fi

if [ -z "$primary_users" ]; then
  primary_users="Primaere Nutzer und Stakeholder noch ergaenzen."
fi

if [ -z "$deploy_target" ]; then
  deploy_target="noch festzulegen"
fi

if [ -z "$repo_visibility" ]; then
  repo_visibility="private"
fi

if [ -z "$personal_data_processing" ]; then
  personal_data_processing="unklar"
fi

if [ -z "$security_contact" ]; then
  security_contact="security@domain.tld"
fi

if [ -z "$first_feature_title" ]; then
  first_feature_title="Erstes Kernfeature definieren"
fi

project_slug=$(slugify "$project_name")
if [ -z "$project_slug" ]; then
  project_slug="new-project"
fi

python_package=$(printf "%s" "$project_slug" | tr '-' '_')
first_feature_slug=$(slugify "$first_feature_title")

if [ -z "$first_feature_slug" ]; then
  first_feature_slug="erstes-feature"
fi

for dir in src tests assets config docs/workflow features templates; do
  if [ ! -d "$dir" ]; then
    mkdir -p "$dir"
    printf "Ordner erstellt: %s\n" "$dir"
  fi
done

apply_stack_profile "$stack_name"
remove_template_only_files
rename_first_feature_file "$first_feature_slug"

if [ -f "CLAUDE.stack.md" ]; then
  printf "\n" >> CLAUDE.md
  cat CLAUDE.stack.md >> CLAUDE.md
  rm CLAUDE.stack.md
  printf "Stack-Ergaenzungen in CLAUDE.md integriert\n"
fi

chmod +x ./scripts/bootstrap.sh ./scripts/check-secrets.sh ./scripts/pre-commit.sh ./scripts/install-git-hooks.sh

if [ ! -f ".env" ] && [ -f ".env.example" ]; then
  cp .env.example .env
  printf ".env aus .env.example erzeugt\n"
fi

if [ ! -f "docs/STATUS.md" ] && [ -f "templates/status.md" ]; then
  cp templates/status.md docs/STATUS.md
  printf "docs/STATUS.md aus Template erzeugt\n"
fi

replace_placeholder "<PROJECT_NAME>" "$project_name" "CLAUDE.md"
replace_placeholder "<PROJECT_NAME>" "$project_name" "README.md"
replace_placeholder "<PROJECT_NAME>" "$project_name" "AGENTS.md"
replace_placeholder "<PROJECT_NAME>" "$project_name" "docs/brief.md"
replace_placeholder "<PROJECT_NAME>" "$project_name" ".env.example"
replace_placeholder "<PROJECT_NAME>" "$project_name" ".env"
replace_placeholder "<PROJECT_NAME>" "$project_name" "package.json"
replace_placeholder "<PROJECT_NAME>" "$project_name" "pyproject.toml"
replace_placeholder "<PROJECT_NAME>" "$project_name" "project.yml"
replace_placeholder "<PROJECT_NAME>" "$project_name" "Sources/App/AppInfo.swift"

replace_placeholder "<STACK>" "$stack_name" "CLAUDE.md"
replace_placeholder "<STACK>" "$stack_name" "README.md"
replace_placeholder "<STACK>" "$stack_name" "docs/brief.md"
replace_placeholder "<STACK>" "$stack_name" "docs/architecture.md"
replace_placeholder "<PROJECT_SUMMARY>" "$project_summary" "CLAUDE.md"
replace_placeholder "<PROJECT_SUMMARY>" "$project_summary" "README.md"
replace_placeholder "<PROJECT_SUMMARY>" "$project_summary" "docs/brief.md"
replace_placeholder "<PRIMARY_USERS>" "$primary_users" "CLAUDE.md"
replace_placeholder "<PRIMARY_USERS>" "$primary_users" "README.md"
replace_placeholder "<PRIMARY_USERS>" "$primary_users" "docs/brief.md"
replace_placeholder "<PRIMARY_USERS>" "$primary_users" "docs/architecture.md"
replace_placeholder "<DEPLOY_TARGET>" "$deploy_target" "CLAUDE.md"
replace_placeholder "<DEPLOY_TARGET>" "$deploy_target" "README.md"
replace_placeholder "<DEPLOY_TARGET>" "$deploy_target" "docs/architecture.md"
replace_placeholder "<REPO_VISIBILITY>" "$repo_visibility" "README.md"
replace_placeholder "<REPO_VISIBILITY>" "$repo_visibility" "docs/architecture.md"
replace_placeholder "<PERSONAL_DATA_PROCESSING>" "$personal_data_processing" "README.md"
replace_placeholder "<PERSONAL_DATA_PROCESSING>" "$personal_data_processing" "docs/architecture.md"
replace_placeholder "<SECURITY_CONTACT>" "$security_contact" "SECURITY.md"
replace_placeholder "<FIRST_FEATURE_TITLE>" "$first_feature_title" "docs/brief.md"
replace_placeholder "<FIRST_FEATURE_TITLE>" "$first_feature_title" "features/INDEX.md"
replace_placeholder "<FIRST_FEATURE_TITLE>" "$first_feature_title" "./features/PROJ-1-$first_feature_slug.md"
replace_placeholder "<FIRST_FEATURE_SLUG>" "$first_feature_slug" "features/INDEX.md"
replace_placeholder "<PROJECT_SLUG>" "$project_slug" "package.json"
replace_placeholder "<PROJECT_SLUG>" "$project_slug" "pyproject.toml"
replace_placeholder "<PROJECT_SLUG>" "$project_slug" "src/app/layout.tsx"
replace_placeholder "<PROJECT_SLUG>" "$project_slug" "project.yml"
replace_placeholder "<PROJECT_SLUG>" "$project_slug" "go.mod"
replace_placeholder "<PROJECT_NAME>" "$project_name" "src/main.go"
replace_placeholder "<PYTHON_PACKAGE>" "$python_package" "pyproject.toml"

if [ ! -d ".git" ]; then
  git init >/dev/null 2>&1
  printf "Git-Repository initialisiert\n"
else
  printf "Git-Repository bereits vorhanden\n"
fi

sh ./scripts/install-git-hooks.sh
printf "Git-Hooks vorbereitet\n"

printf "\nProjektkonfiguration:\n"
printf "%s\n" "- Name: $project_name"
printf "%s\n" "- Stack: $stack_name"
printf "%s\n" "- Deployment: $deploy_target"
printf "%s\n" "- Sichtbarkeit: $repo_visibility"
printf "%s\n" "- Personenbezogene Daten: $personal_data_processing"
printf "%s\n" "- Erstes Feature: $first_feature_title"

printf "\nStrukturpruefung:\n"
print_path_status "AGENTS.md" "file"
print_path_status "README.md" "file"
print_path_status "docs/brief.md" "file"
print_path_status "docs/architecture.md" "file"
print_path_status "features/INDEX.md" "file"
print_path_status "templates/task-brief.md" "file"
print_path_status "src" "dir"
print_path_status "tests" "dir"
print_path_status "scripts" "dir"

printf "\nStart-Checkliste:\n"
printf "%s\n" '1. `docs/brief.md` mit Ziel, Scope und Erfolgskriterien fuellen'
printf "%s\n" '2. `docs/architecture.md` mit Stack, Schnittstellen und Grenzen fuellen'
printf "%s\n" '3. `features/INDEX.md` und das erste Feature in `features/` konkretisieren'
printf "%s\n" '4. `templates/task-brief.md` fuer den ersten Claude-Arbeitsauftrag verwenden'
printf "%s\n" '5. `Makefile` und `.github/workflows/ci.yml` auf die echten Projektkommandos anpassen'

print_stack_steps "$stack_name"

printf "\nGitHub:\n"
printf "%s\n" '- lokales Git ist vorbereitet; GitHub-Repository musst du separat anlegen'
printf "%s\n" '- Anleitung siehe `docs/workflow/github-publish.md`'
