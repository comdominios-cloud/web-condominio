import { request } from './http.js';

const SERVICE = 'usuarios';

export function registrar({ email, password }) {
  return request(SERVICE, '/auth/register', {
    method: 'POST',
    auth: false,
    body: { email: email.trim().toLowerCase(), password },
  });
}

export const miCuenta = () => request(SERVICE, '/auth/me');

export function iniciarSesion({ email, password }) {
  return request(SERVICE, '/auth/login', {
    method: 'POST',
    auth: false,
    body: { email, password },
  });
}
