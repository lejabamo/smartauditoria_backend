// Configuracion de la URL base de la API
// En desarrollo local, usa el proxy de Vite (/api)
// En acceso remoto (celular/otro equipo), usa la URL completa del servidor
const getApiBaseUrl = (): string => {
  // Si hay una variable de entorno definida, usala (tiene prioridad)
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL;
  }
  
  // Detectar si estamos accediendo desde localhost/127.0.0.1 (acceso local)
  const isLocalAccess = 
    window.location.hostname === 'localhost' || 
    window.location.hostname === '127.0.0.1';
  
  // Si es acceso local, usar el proxy de Vite (funciona solo en desarrollo local)
  if (isLocalAccess && import.meta.env.DEV) {
    return "/api";
  }
  
  // Para acceso remoto (celular u otro equipo), construir la URL completa
  // usando el hostname actual (que sera la IP del servidor)
  const protocol = window.location.protocol;
  const hostname = window.location.hostname;
  const port = window.location.port || '5173'; // Si no hay puerto, asumir 5173
  
  // Si estamos en el puerto 5173 (frontend), el backend esta en 5000
  if (port === '5173' || port === '') {
    return `${protocol}//${hostname}:5000/api`;
  }
  
  // Para otros casos, usar relativo
  return "/api";
};

export const API_BASE_URL = getApiBaseUrl();
