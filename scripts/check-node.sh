#!/usr/bin/env bash
# Fails fast with a clear message when Node is older than the toolchain's
# minimum. pnpm (via corepack) crashes on Node < 22 with a cryptic stack
# trace — this turns that into actionable guidance. The recommended/active
# version lives in .nvmrc (currently 24).
set -uo pipefail
cd "$(dirname "$0")/.."

REQUIRED_MAJOR=22
CURRENT=$(node -v 2>/dev/null || echo '')
CURRENT_TRIMMED=${CURRENT#v}
CURRENT_MAJOR=${CURRENT_TRIMMED%%.*}
RECOMMENDED=$(cat .nvmrc 2>/dev/null || echo "$REQUIRED_MAJOR")

if [ -z "$CURRENT_MAJOR" ] || [ "$CURRENT_MAJOR" -lt "$REQUIRED_MAJOR" ]; then
  echo "Node ${CURRENT:-not found} is too old — this project needs Node >= ${REQUIRED_MAJOR} (recommended: ${RECOMMENDED})." >&2
  echo "Fix: nvm install ${RECOMMENDED} && nvm use ${RECOMMENDED}   (or run 'nvm use' to read .nvmrc), then retry." >&2
  exit 1
fi

exit 0
