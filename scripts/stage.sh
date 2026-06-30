#!/usr/bin/env bash
# Prints the project stage (poc | production) from package.json mp.stage.
set -euo pipefail
cd "$(dirname "$0")/.."
node -p "require('./package.json').mp?.stage ?? 'poc'" 2>/dev/null || echo "poc"
