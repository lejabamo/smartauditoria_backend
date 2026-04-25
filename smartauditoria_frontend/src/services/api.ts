import axios from "axios";
import { API_BASE_URL } from "../config/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor de respuesta para manejar errores
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error);
    // Si el token expiro (401), limpiar sesion y redirigir al login
    if (error.response?.status === 401) {
      const errorMsg = error.response?.data?.error || '';
      // Solo hacer logout si el error es de token (no de credenciales incorrectas)
      if (errorMsg.includes('expirado') || errorMsg.includes('invalido') || errorMsg.includes('requerido')) {
        console.warn('Token expirado. Cerrando sesion...');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        // Redirigir al login si no estamos ya en esa ruta
        if (!window.location.pathname.includes('/login')) {
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

// Funcion helper para hacer requests con manejo de errores
export const apiRequest = async <T>(endpoint: string, options: RequestInit = {}): Promise<T> => {
  const url = `${API_BASE_URL}${endpoint}`;
  const token = localStorage.getItem("token");

  const config: RequestInit = {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
  };

  try {
    const response = await fetch(url, config);

    if (!response.ok) {
      // Intentar obtener el mensaje de error del backend
      let errorMessage = `HTTP error! status: ${response.status}`;
      try {
        // Clonar la respuesta para poder leerla sin consumirla
        const clonedResponse = response.clone();
        const errorData = await clonedResponse.json();
        errorMessage = errorData.error || errorData.message || errorMessage;
        console.error(`API error details for ${endpoint}:`, errorData);
      } catch (e) {
        // Si no se puede parsear el JSON, usar el mensaje por defecto
        try {
          const clonedResponse = response.clone();
          const text = await clonedResponse.text();
          console.error(`API error response (text) for ${endpoint}:`, text);
          if (text) {
            errorMessage = text;
          }
        } catch (textError) {
          console.error(`Could not read error response for ${endpoint}`);
        }
      }
      throw new Error(errorMessage);
    }

    return await response.json();
  } catch (error) {
    console.error(`API request failed for ${endpoint}:`, error);
    throw error;
  }
};

export default api;
