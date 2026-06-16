export const API_CONFIG = {
  // En desarrollo apunta al backend local
  BASE_URL: import.meta.env.VITE_API_URL || '/api',
  // IA Service URL (pueden ser llamadas directas si hay CORS, o via bridge backend)
  IA_URL: import.meta.env.VITE_IA_URL || '/api/v2/ia',
  TIMEOUT: 15000,
};
