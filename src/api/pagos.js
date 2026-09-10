import { request, toList } from './http.js';

const SERVICE = 'pagos';

export async function listarCuotas(params) {
  return toList(await request(SERVICE, '/cuotas', { params }));
}

export async function listarPagos(params) {
  return toList(await request(SERVICE, '/pagos', { params }));
}
