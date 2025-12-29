import axios, { AxiosError } from 'axios';
import type { AxiosInstance, InternalAxiosRequestConfig } from 'axios';

// ============================================================
// API ERROR TYPES
// ============================================================

/**
 * Standard API error response from Laravel backend
 */
export interface ApiErrorResponse {
  message?: string;
  error?: string;
  errors?: Record<string, string[]>;
}

/**
 * Typed Axios error for API calls
 */
export type ApiError = AxiosError<ApiErrorResponse>;

/**
 * Helper to check if an error is an API error
 */
export function isApiError(error: unknown): error is ApiError {
  return axios.isAxiosError(error);
}

/**
 * Extract error message from API error
 */
export function getApiErrorMessage(error: unknown, fallback = 'Error desconocido'): string {
  if (!isApiError(error)) return fallback;
  
  const data = error.response?.data;
  return data?.message || data?.error || error.message || fallback;
}

// URLs de configuración
// Usar regex para reemplazar solo el /api del FINAL de la URL (no el "api" del subdominio)
const BASE_URL = import.meta.env.VITE_API_URL?.replace(/\/api$/, '') || 'http://localhost:8000';
const API_URL = `${BASE_URL}/api`;

/**
 * Cliente API con soporte para autenticación Sanctum basada en sesiones de Laravel
 *
 * Flujo de Autenticación Sanctum:
 * 1. Frontend → GET /sanctum/csrf-cookie (obtener token CSRF)
 * 2. Frontend → POST /api/login (con credenciales)
 * 3. Backend → Emite cookies httpOnly: laravel_session, XSRF-TOKEN
 * 4. Todas las peticiones posteriores incluyen automáticamente las cookies
 * 5. Si sesión expira (401/419) → redirigir a login
 *
 * Ref: https://laravel.com/docs/12.x/sanctum#spa-authentication
 */

// ============================================================
// CONFIGURACIÓN GLOBAL DE AXIOS
// ============================================================
axios.defaults.baseURL = BASE_URL;
axios.defaults.withCredentials = true;  // ⭐ CRÍTICO: Permite enviar/recibir cookies
axios.defaults.withXSRFToken = true;    // ⭐ CRÍTICO: Maneja token CSRF automáticamente

axios.defaults.headers.common['Accept'] = 'application/json';
axios.defaults.headers.common['Content-Type'] = 'application/json';


// ============================================================
// CLIENTES AXIOS ESPECÍFICOS
// ============================================================

// Cliente para endpoints /api/*
export const apiClient: AxiosInstance = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  withXSRFToken: true,
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  },
});

// Cliente para endpoints base (sin /api, ej: /sanctum/csrf-cookie)
export const baseClient: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
  withXSRFToken: true,
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  },
});

// ============================================================
// CONFIGURACIÓN XSRF
// ============================================================
apiClient.defaults.xsrfCookieName = 'XSRF-TOKEN';      // Cookie donde está el token
apiClient.defaults.xsrfHeaderName = 'X-XSRF-TOKEN';    // Header donde enviarlo

baseClient.defaults.xsrfCookieName = 'XSRF-TOKEN';
baseClient.defaults.xsrfHeaderName = 'X-XSRF-TOKEN';

// ============================================================
// INTERCEPTORES DE REQUEST
// ============================================================

/**
 * Función para extraer token XSRF de la cookie
 * Laravel espera que el token esté en una cookie llamada XSRF-TOKEN
 * y que sea enviado en el header X-XSRF-TOKEN (decodificado)
 */
const getXsrfToken = (): string | null => {
  const cookies = document.cookie.split(';');
  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split('=');
    if (name === 'XSRF-TOKEN') {
      // El token está URL-encoded en la cookie, necesita decodificarse
      return decodeURIComponent(value);
    }
  }
  return null;
};

const createRequestInterceptor = (clientName: string) => {
  return (config: InternalAxiosRequestConfig) => {
    console.log(`🔵 [${clientName}] [${config.method?.toUpperCase()}] ${config.url}`)
    console.log(`   withCredentials: ${config.withCredentials}`)
    console.log(`   withXSRFToken: ${config.withXSRFToken}`)

    // Log cookies que se envían
    const cookies = document.cookie;
    if (cookies) {
      console.log(`   📦 Cookies enviadas: ${cookies.substring(0, 100)}...`);
    } else {
      console.log(`   ⚠️ No hay cookies para enviar`);
    }

    // ⭐ CRÍTICO: Extraer el token XSRF de la cookie y asegurar que está decodificado
    const xsrfToken = getXsrfToken();
    if (xsrfToken) {
      // Asegurar que el token está decodificado (sin %3D, con = al final)
      const decodedToken = decodeURIComponent(xsrfToken);
      config.headers['X-XSRF-TOKEN'] = decodedToken;
      console.log(`   🔐 Header X-XSRF-TOKEN: ${decodedToken.substring(0, 20)}...`);
    } else {
      console.log(`   ⚠️ ¡ATENCIÓN! No se encontró token XSRF-TOKEN en cookies`);
      console.log(`      Cookies disponibles: ${document.cookie}`);
    }

    return config;
  };
};

// ============================================================
// INTERCEPTORES DE RESPONSE
// ============================================================

// Extended config type for custom properties
interface ExtendedAxiosConfig extends InternalAxiosRequestConfig {
  skipAuthRedirect?: boolean;
}

const createResponseInterceptor = (clientName: string) => {
  return {
    success: <T>(response: import('axios').AxiosResponse<T>) => {
      console.log(`🟢 [${clientName}] [${response.status}] ${response.config.url}`);

      // Log Set-Cookie headers si existen
      const setCookieHeader = response.headers['set-cookie'];
      if (setCookieHeader) {
        console.log(`   🍪 Set-Cookie recibido`);
      }

      // Log cookies almacenadas
      const cookies = document.cookie;
      if (cookies) {
        console.log(`   📦 Cookies almacenadas: ${cookies.substring(0, 80)}...`);
      }

      return response;
    },
    error: async (error: AxiosError) => {
      const status = error.response?.status;
      const currentPath = window.location.pathname;
      const config = error.config as ExtendedAxiosConfig | undefined;
      const skipAuthRedirect = config?.skipAuthRedirect;
      const url = error.config?.url || '';

      // Mostrar error detallado
      console.error(`🔴 [${clientName}] [${status}] ${url}`, error.response?.data);

      // Si es error 401 (no autenticado) o 419 (sesión expirada/CSRF)
      // NO redirigir en estos casos:
      // 1. Si skipAuthRedirect está configurado (ej: durante AuthContext init)
      // 2. Si ya estamos en /login
      // 3. Si es la petición GET /me (parte de la inicialización)
      const isInitCheck = url.includes('/me') && (error.config?.method === 'get' || !error.config?.method);

      if ((status === 401 || status === 419) && currentPath !== '/login' && !skipAuthRedirect && !isInitCheck) {
        console.log(`⚠️ [${status}] Sesión expirada o CSRF inválido, redirigiendo a login`);

        // Limpiar cualquier token del localStorage
        localStorage.removeItem('access_token');

        // Redirigir a login
        window.location.href = '/login';
        return Promise.reject(error);
      }

      // Si es 403 (sin permisos)
      if (status === 403) {
        console.error('🔴 [403] Permiso denegado:', error.config?.url);
      }

      return Promise.reject(error);
    },
  };
};

// Aplicar interceptores a apiClient
apiClient.interceptors.request.use(
  createRequestInterceptor('apiClient'),
  (error) => Promise.reject(error)
);

const apiResponseInterceptors = createResponseInterceptor('apiClient');
apiClient.interceptors.response.use(
  apiResponseInterceptors.success,
  apiResponseInterceptors.error
);

// Aplicar interceptores a baseClient
baseClient.interceptors.request.use(
  createRequestInterceptor('baseClient'),
  (error) => Promise.reject(error)
);

const baseResponseInterceptors = createResponseInterceptor('baseClient');
baseClient.interceptors.response.use(
  baseResponseInterceptors.success,
  baseResponseInterceptors.error
);

// ============================================================
// FUNCIÓN PARA OBTENER TOKEN CSRF
// ============================================================
/**
 * Obtener token CSRF de Sanctum
 *
 * DEBE llamarse ANTES de login/register
 *
 * Usa baseClient para que:
 * 1. Las cookies se guarden correctamente con withCredentials: true
 * 2. Se aplique la configuración XSRF
 * 3. Se loguee la transacción
 */
export async function fetchCsrfToken(): Promise<void> {
  try {
    await baseClient.get('/sanctum/csrf-cookie');
  } catch (error) {
    console.error('❌ fetchCsrfToken() - Error al obtener token CSRF:', error);
    throw error;
  }
}

// ============================================================
// EXPORTAR CLIENTE POR DEFECTO
// ============================================================
export default apiClient;
