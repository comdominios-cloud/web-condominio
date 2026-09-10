import { request } from './http.js';

const SERVICE = 'ficha';

export function obtenerFichaResidente(residenteId) {
  return request(SERVICE, `/ficha/${residenteId}`);
}

export function obtenerFichaUnidad(unidadId) {
  return request(SERVICE, `/ficha/unidad/${unidadId}`);
}
