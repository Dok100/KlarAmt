#!/bin/sh
set -eu

if [ ! -d ".git" ]; then
  exit 0
fi

hook_path=".git/hooks/pre-commit"

if [ -f "$hook_path" ]; then
  exit 0
fi

cat >"$hook_path" <<'EOF'
#!/bin/sh
set -eu
exec ./scripts/pre-commit.sh
EOF

chmod +x "$hook_path"
