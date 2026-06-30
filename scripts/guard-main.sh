#!/usr/bin/env bash
# Blocks commits to main/master once the project is in production stage.
# In poc stage (presales prototyping) the designer works freely.
set -uo pipefail
cd "$(dirname "$0")/.."

STAGE=$(bash scripts/stage.sh)
BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "unknown")

if [ "$STAGE" = "production" ] && { [ "$BRANCH" = "main" ] || [ "$BRANCH" = "master" ]; }; then
  echo "Blocked: this project is in production stage — commits go through branches and PRs." >&2
  echo "Create a branch: git switch -c design/<topic>" >&2
  exit 1
fi

exit 0
