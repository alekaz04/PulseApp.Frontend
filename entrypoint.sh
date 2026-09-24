#!/bin/sh
set -e

# Перезаписываем config.js значениями из переменных окружения при каждом старте контейнера.
# public/config.js (значения для разработки) здесь заменяется.
cat > /usr/share/nginx/html/config.js << EOF_CONFIG
window.APP_CONFIG = {
  API_BASE_URL: '${API_BASE_URL}',
  OIDC_AUTHORITY: '${OIDC_AUTHORITY}',
  OIDC_CLIENT_ID: '${OIDC_CLIENT_ID}'
};
EOF_CONFIG

exec nginx -g 'daemon off;'
