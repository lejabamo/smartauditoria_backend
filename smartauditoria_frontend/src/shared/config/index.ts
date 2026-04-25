export const API_CONFIG = {
  // En desarrollo apunta al backend local
  BASE_URL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  // IA Service URL (pueden ser llamadas directas si hay CORS, o via bridge backend)
  IA_URL: import.meta.env.VITE_IA_URL || 'http://localhost:8001/api/v1',
  TIMEOUT: 15000,
};
