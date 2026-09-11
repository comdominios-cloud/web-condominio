import { request, toList } from './http.js';

const SERVICE = 'residentes';

export async function listarResidentes(params = {}) {
  const result = [];
  for (let offset = 0; ; offset += 200) {
    const page = toList(
      await request(SERVICE, '/residentes', { params: { ...params, limit: 200, offset } }),
    );
    result.push(...page);
    if (page.length < 200) return result;
    if (offset >= 19800)
      throw new Error(
        'El padrón es demasiado grande. Solicita una consulta específica a administración.',
      );
  }
}

export async function listarUnidades() {
  const result = [];
  for (let offset = 0; ; offset += 200) {
    const page = toList(await request(SERVICE, '/unidades', { params: { limit: 200, offset } }));
    result.push(...page);
    if (page.length < 200) return result;
    if (offset >= 19800) throw new Error('No se pudo cargar el catálogo completo de unidades.');
  }
}

export const crearResidente = (body) => request(SERVICE, '/residentes', { method: 'POST', body });
export const actualizarResidente = (id, body) =>
  request(SERVICE, `/residentes/${id}`, { method: 'PUT', body });

export function obtenerResidente(id) {
  return request(SERVICE, `/residentes/${id}`);
}
