// Configuracion de la URL base de la API
// En desarrollo local, usa el proxy de Vite (/api)
// En producción, Nginx actúa como proxy reverso en /api
const getApiBaseUrl = (): string => {
  // Si hay una variable de entorno definida, usala (tiene prioridad)
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL;
  }
  
  // Por defecto, usa ruta relativa para que el proxy de Vite o Nginx la intercepte
  return "/api";
};

export const API_BASE_URL = getApiBaseUrl();
