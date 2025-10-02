#!/usr/bin/env bash
set -euo pipefail

# Cloud Run injects these at runtime:
APP_URL="${CODEVENTURE_APP_URL:-}"
API_URL="${CODEVENTURE_API_URL:-}"

# Write the runtime config used by the browser
cat > /app/build/env.js <<EOF
window.__ENV__ = {
  CODEVENTURE_APP_URL: "${APP_URL}",
  CODEVENTURE_API_URL: "${API_URL}"
};
EOF

# Start the static server
exec serve -s build -l "${PORT:-8080}"
