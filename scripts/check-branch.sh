#!/usr/bin/env bash
# Session-start briefing for coding agents: stage, branch, freshness.
# Informational only — always exits 0.
set -uo pipefail
cd "$(dirname "$0")/.."

STAGE=$(bash scripts/stage.sh)
BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "unknown")

git fetch --quiet origin 2>/dev/null || true
BEHIND=$(git rev-list --count "HEAD..origin/${BRANCH}" 2>/dev/null || echo "0")

echo "[mp-frontend] stage=${STAGE} branch=${BRANCH} behind_origin=${BEHIND}"

# Surface a too-old Node early (non-fatal here; the git hooks enforce it).
bash scripts/check-node.sh || true

if [ "$BEHIND" != "0" ]; then
  echo "[mp-frontend] Branch is ${BEHIND} commit(s) behind origin/${BRANCH}. Pull before starting work: git pull --rebase"
fi

if [ "$STAGE" = "production" ] && { [ "$BRANCH" = "main" ] || [ "$BRANCH" = "master" ]; }; then
  echo "[mp-frontend] This project is in production stage: do not work on ${BRANCH}. Create a branch first, e.g. git switch -c design/<topic> (sync first: git pull --rebase)."
fi

exit 0
