#!/usr/bin/env bash
# Cursor beforeSubmitPrompt hook: same guard as Claude Code's PreToolUse,
# adapted to Cursor's stdin/stdout JSON protocol.
set -uo pipefail
cd "$(dirname "$0")/.."

cat > /dev/null # consume stdin payload

STAGE=$(bash scripts/stage.sh)
BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "unknown")

if [ "$STAGE" = "production" ] && { [ "$BRANCH" = "main" ] || [ "$BRANCH" = "master" ]; }; then
  printf '{"continue": false, "reason": "Production stage: switch to a working branch first (git pull --rebase && git switch -c design/<topic>)."}\n'
  exit 0
fi

printf '{"continue": true}\n'
exit 0
