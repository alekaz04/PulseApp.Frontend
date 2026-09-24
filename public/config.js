// Значения для разработки. В Docker файл перезаписывает entrypoint.sh при старте контейнера.
window.APP_CONFIG = {
  API_BASE_URL: '',
  OIDC_AUTHORITY: 'http://localhost:8080/realms/pulse-app',
  OIDC_CLIENT_ID: 'pulse-web',
};
