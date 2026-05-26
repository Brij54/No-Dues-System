#!/bin/sh

CONFIG_PATH="/usr/share/nginx/html/config.json"


API_BASE_URL="${API_BASE_URL:-http://localhost:8086/}"
MAINTENANCE_MODE="${MAINTENANCE_MODE:-false}"
ENABLE_EMAIL_NOTIFICATION="${ENABLE_EMAIL_NOTIFICATION:-true}"

cat > "$CONFIG_PATH" <<EOF
{
  "API_BASE_URL": "${API_BASE_URL}",
  "MAINTENANCE_MODE": ${MAINTENANCE_MODE},
  "ENABLE_EMAIL_NOTIFICATION": ${ENABLE_EMAIL_NOTIFICATION}
}
EOF

echo "Config generated:"
cat "$CONFIG_PATH"

exec nginx -g "daemon off;"