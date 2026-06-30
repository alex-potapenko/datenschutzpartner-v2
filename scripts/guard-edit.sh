#!/usr/bin/env bash
# Claude Code PreToolUse hook: refuse file edits on main in production stage.
# Exit 2 = block the tool call; stderr is shown to the agent.
set -uo pipefail
cd "$(dirname "$0")/.."

STAGE=$(bash scripts/stage.sh)
BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "unknown")

if [ "$STAGE" = "production" ] && { [ "$BRANCH" = "main" ] || [ "$BRANCH" = "master" ]; }; then
  echo "This project is in production stage and you are on ${BRANCH}. Create a working branch before editing: git pull --rebase && git switch -c design/<topic>" >&2
  exit 2
fi

exit 0
