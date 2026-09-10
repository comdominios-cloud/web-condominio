import { request, toList } from './http.js';

const SERVICE = 'residentes';

export async function listarResidentes(params) {
  return toList(await request(SERVICE, '/residentes', { params }));
}

export function obtenerResidente(id) {
  return request(SERVICE, `/residentes/${id}`);
}
