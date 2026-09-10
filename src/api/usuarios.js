import { request } from './http.js';

const SERVICE = 'usuarios';

export function registrar({ nombre, email, password, rol }) {
  return request(SERVICE, '/auth/register', {
    method: 'POST',
    auth: false,
    body: { nombre, email, password, rol },
  });
}

export function iniciarSesion({ email, password }) {
  return request(SERVICE, '/auth/login', {
    method: 'POST',
    auth: false,
    body: { email, password },
  });
}
