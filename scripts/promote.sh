#!/usr/bin/env bash
# Flips the project from poc to production stage and prints the manual
# promotion checklist. Run once when the prototype is handed over.
set -euo pipefail
cd "$(dirname "$0")/.."

node -e "
const fs = require('fs');
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
pkg.mp = { ...pkg.mp, stage: 'production' };
fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2) + '\n');
"

echo "Stage set to: production"
echo ""
echo "Manual promotion checklist (see AGENTS.md → Handover):"
echo "  [ ] Enable branch protection on main (require PR + green checks)"
echo "  [ ] Enable the Renovate GitHub App for this repo (config is ready in renovate.json)"
echo "  [ ] Add Sentry (@sentry/nextjs) and wire app/error.tsx + app/global-error.tsx"
echo "  [ ] Point NEXT_PUBLIC_API_BASE_URL at the real backend, set NEXT_PUBLIC_API_MOCKING=disabled"
echo "  [ ] Generate the real API client from the backend OpenAPI schema (@hey-api/openapi-ts),"
echo "      replace api/client.ts internals, delete mocks/handlers.ts"
echo "  [ ] Review SonarQube/CI settings against the org standard"
