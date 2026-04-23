#!/bin/sh
set -e

# Overwrite config.js with runtime value from environment variable.
# public/config.js (dev default) is replaced here on every container start.
cat > /usr/share/nginx/html/config.js << EOF
window.APP_CONFIG = {
  API_BASE_URL: '${API_BASE_URL}'
};
EOF

exec nginx -g 'daemon off;'
