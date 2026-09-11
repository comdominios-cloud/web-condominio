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
 *   'path'   (por defecto)  ->  <VITE_API_BASE_URL>/<ruta>
 *   'proxy'                 ->  /api/<servicio>/<ruta>
 *   'direct'                ->  <VITE_API_BASE_URL>:<puerto>/<ruta>
 *
 * PRODUCCION: usar 'path' apuntando a la distribucion de CloudFront.
 *
 * El balanceador enruta por ruta (/residentes*, /auth*...), no por puerto, y
 * responde solo por HTTP. Como Amplify sirve la SPA por HTTPS, el navegador
 * bloquearia esas llamadas (mixed content) y Amplify tampoco acepta destinos
 * HTTP en sus reglas de reescritura.
 *
 * La solucion es API Gateway delante del ALB: entrega una URL HTTPS y habla
 * HTTP con el balanceador. La SPA le pega directo por HTTPS.
 * (CloudFront no es opcion: el rol de AWS Academy no tiene permisos.)
 *
 *   VITE_API_MODE=path
 *   VITE_API_BASE_URL=https://xxxxxxxxxx.execute-api.us-east-1.amazonaws.com
 *
 * 'proxy' queda para el caso de tener un backend HTTPS y querer reescrituras.
 * 'direct' sirve para desarrollo contra microservicios en localhost.
 */
export const API_MODE = (env.VITE_API_MODE || 'path').trim().toLowerCase();

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
      'Falta configurar VITE_API_BASE_URL con la URL del API Gateway o del balanceador.'
    );
  }

  if (API_MODE === 'path') {
    // El balanceador enruta por ruta, asi que la URL va sin puerto.
    return `${RAW_BASE}${suffix}`;
  }

  return `${RAW_BASE}:${port}${suffix}`;
}
