#!/bin/sh
set -eu

if [ ! -x "./scripts/check-secrets.sh" ]; then
  chmod +x ./scripts/check-secrets.sh
fi

./scripts/check-secrets.sh
make precommit
