import { request, toList } from './http.js';

const SERVICE = 'incidencias';

export async function listarIncidencias(params) {
  return toList(await request(SERVICE, '/incidencias', { params }));
}

export async function listarReservas(params) {
  return toList(await request(SERVICE, '/reservas', { params }));
}
