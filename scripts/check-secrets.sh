#!/bin/sh
set -eu

staged_files=$(git diff --cached --name-only --diff-filter=ACM 2>/dev/null || true)

if [ -z "$staged_files" ]; then
  exit 0
fi

blocked_paths='(^|/)\.env($|[.])|\.pem$|\.key$|\.p12$|\.pfx$|id_rsa$|id_ed25519$'
secret_pattern='BEGIN [A-Z ]*PRIVATE KEY|AKIA[0-9A-Z]{16}|AIza[0-9A-Za-z_-]{35}|xox[baprs]-[0-9A-Za-z-]{10,}|ghp_[0-9A-Za-z]{36,}|github_pat_[0-9A-Za-z_]{20,}|-----BEGIN OPENSSH PRIVATE KEY-----'

for file in $staged_files; do
  case "$file" in
    .env.example|*.example|*.sample|*.template)
      continue
      ;;
  esac

  if printf "%s\n" "$file" | rg -q "$blocked_paths"; then
    printf "Unsicherer Dateityp im Commit gefunden: %s\n" "$file" >&2
    exit 1
  fi

  if [ -f "$file" ] && rg -n "$secret_pattern" "$file" >/dev/null 2>&1; then
    printf "Moegliches Secret in Datei gefunden: %s\n" "$file" >&2
    exit 1
  fi
done
