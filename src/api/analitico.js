import { request, toList } from './http.js';

const SERVICE = 'analitico';

export async function morosidadPorEdificio() {
  return toList(await request(SERVICE, '/analitica/morosidad-por-edificio'));
}

export async function recaudacionMensual() {
  return toList(await request(SERVICE, '/analitica/recaudacion-mensual'));
}

export function prediccionAreaComun() {
  return request(SERVICE, '/analitica/prediccion-area-comun');
}
