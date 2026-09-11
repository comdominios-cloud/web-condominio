export function isAdmin(user) {
  return ['ADMIN', 'ADMINISTRADOR'].includes(String(user?.rol || '').toUpperCase());
}

export function fullName(person) {
  return (
    person?.nombre ||
    [person?.nombres, person?.apellidos].filter(Boolean).join(' ') ||
    person?.email ||
    'Residente'
  );
}

export function unitLabel(unit) {
  if (unit == null) return 'Sin unidad';
  return typeof unit === 'object'
    ? unit.codigo || unit.nombre || `Unidad ${unit.id}`
    : `Unidad ${unit}`;
}

export function selectResident(rows, user) {
  if (user?.residente_id != null)
    return rows.find((r) => String(r.id) === String(user.residente_id)) || null;
  const email = String(user?.email || '')
    .trim()
    .toLowerCase();
  const matches = rows.filter(
    (r) =>
      email &&
      String(r.email || '')
        .trim()
        .toLowerCase() === email,
  );
  if (matches.length > 1)
    throw new Error(
      'Hay más de una ficha con tu correo. Contacta a administración para corregir el padrón.',
    );
  return matches[0] || null;
}

export function unitRecords(rows, unitId) {
  if (unitId == null) return [];
  return rows.filter((r) => String(r.unidadId ?? r.unidad_id ?? '') === String(unitId));
}

export function paymentRecords(rows, quotas) {
  const ids = new Set(quotas.map((q) => String(q.id)));
  return rows.filter((p) => ids.has(String(p.cuotaId ?? p.cuota_id)));
}

export function balance(quotas, payments) {
  return quotas
    .filter((q) => !['ANULADA', 'CANCELADA'].includes(String(q.estado).toUpperCase()))
    .reduce((sum, q) => {
      if (String(q.estado).toUpperCase() === 'PAGADA') return sum;
      const paid = payments
        .filter((p) => String(p.cuotaId ?? p.cuota_id) === String(q.id))
        .reduce((total, p) => total + Number(p.montoPagado ?? p.monto_pagado ?? p.monto ?? 0), 0);
      return sum + Math.max(0, Number(q.monto || 0) - paid);
    }, 0);
}

export function passwordError(password) {
  if (password.length < 8) return 'La contraseña debe tener al menos 8 caracteres.';
  if (new TextEncoder().encode(password).length > 72)
    return 'La contraseña no puede superar 72 bytes (algunos símbolos ocupan más de uno).';
  return null;
}
