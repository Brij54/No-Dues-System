#!/bin/sh

CONFIG_PATH="/usr/share/nginx/html/config.json"
ENV_FILE="/usr/share/nginx/html/env.js"

API_BASE_URL="${API_BASE_URL:-http://localhost:8086/}"
REACT_APP_API_URL="${REACT_APP_API_URL:-http://localhost:3000/}"
MAINTENANCE_MODE="${MAINTENANCE_MODE:-false}"
ENABLE_EMAIL_NOTIFICATION="${ENABLE_EMAIL_NOTIFICATION:-true}"
REACT_APP_KEYCLOAK_CLIENT_ID="${REACT_APP_KEYCLOAK_CLIENT_ID:-backend-api}"

# Keep config.json for backwards-compatibility
cat > "$CONFIG_PATH" <<EOF
{
  "API_BASE_URL": "${API_BASE_URL}",
  "MAINTENANCE_MODE": ${MAINTENANCE_MODE},
  "ENABLE_EMAIL_NOTIFICATION": ${ENABLE_EMAIL_NOTIFICATION}
}
EOF

# Create env.js for dynamic window-level variables
cat > "$ENV_FILE" <<EOF
window._env_ = {
  REACT_APP_API_URL: "${API_BASE_URL}",
  REACT_APP_KEYCLOAK_CLIENT_ID: "${REACT_APP_KEYCLOAK_CLIENT_ID}"
};
EOF

echo "Config generated:"
cat "$CONFIG_PATH"

echo "Runtime env.js generated successfully:"
cat "$ENV_FILE"

exec nginx -g "daemon off;"