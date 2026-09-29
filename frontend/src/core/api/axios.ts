// frontend/src/core/api/axios.client.ts
import axios from 'axios';
import type { AxiosInstance, InternalAxiosRequestConfig } from 'axios';

// 1. Creamos la instancia base
export const apiClient: AxiosInstance = axios.create({
  // En Vite, las variables de entorno se leen con import.meta.env
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
  timeout: 7000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// 2. Interceptor de Peticiones (Request)
// Se ejecuta automáticamente ANTES de que cualquier petición salga al backend
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Obtenemos el token de la sesión actual
    const token = localStorage.getItem('access_token');
    
    // TypeScript nos protege aquí: asegura que config y config.headers existan
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);