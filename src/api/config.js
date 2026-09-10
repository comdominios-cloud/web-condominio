const env = import.meta.env;

export const APP_NAME = env.VITE_APP_NAME || 'condominios.net';

export const TOKEN_STORAGE_KEY = env.VITE_TOKEN_STORAGE_KEY || 'condominio_token';

export const USER_STORAGE_KEY = `${TOKEN_STORAGE_KEY}_user`;

const RAW_BASE = (env.VITE_API_BASE_URL || '').trim().replace(/\/+$/, '');

export const API_BASE_URL = RAW_BASE;

export const SERVICE_PORTS = {
  residentes: env.VITE_PORT_RESIDENTES || '9001',
  pagos: env.VITE_PORT_PAGOS || '9002',
  incidencias: env.VITE_PORT_INCIDENCIAS || '9003',
  ficha: env.VITE_PORT_FICHA || '9004',
  analitico: env.VITE_PORT_ANALITICO || '9005',
  usuarios: env.VITE_PORT_USUARIOS || '9006',
};

/**
 * Modo de acceso a los microservicios.
 *
 *   'proxy'  (por defecto)  ->  /api/<servicio>/<ruta>
 *   'direct'                ->  http://<host>:<puerto>/<ruta>
 *
 * En Amplify hay que usar 'proxy'. La pagina se sirve por HTTPS y el
 * balanceador responde por HTTP: si el navegador ve una peticion HTTP desde
 * una pagina HTTPS la bloquea (mixed content) y no hay forma de evitarlo desde
 * el codigo. Con el proxy, el navegador habla HTTPS con Amplify y Amplify
 * reenvia al balanceador por detras.
 *
 * 'direct' sirve para desarrollo contra microservicios en localhost.
 */
export const API_MODE = (env.VITE_API_MODE || 'proxy').trim().toLowerCase();

export const isApiConfigured = () => API_MODE === 'proxy' || RAW_BASE.length > 0;

export function serviceUrl(service, path = '') {
  const port = SERVICE_PORTS[service];

  if (!port) {
    throw new Error(`Microservicio desconocido: ${service}`);
  }

  const suffix = path.startsWith('/') ? path : `/${path}`;

  if (API_MODE === 'proxy') {
    // Mismo origen: lo resuelven los rewrites de Amplify (o el proxy de Vite
    // en desarrollo). Ver README.
    return `/api/${service}${suffix}`;
  }

  if (!RAW_BASE) {
    throw new Error(
      'Falta configurar VITE_API_BASE_URL con la URL del balanceador de las VM de produccion.'
    );
  }

  return `${RAW_BASE}:${port}${suffix}`;
}
