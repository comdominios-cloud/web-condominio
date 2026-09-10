const TONES = {
  pagado: 'green',
  pagada: 'green',
  activo: 'green',
  activa: 'green',
  resuelto: 'green',
  resuelta: 'green',
  cerrado: 'green',
  cerrada: 'green',
  confirmada: 'green',
  confirmado: 'green',
  aprobada: 'green',
  aprobado: 'green',
  pendiente: 'yellow',
  proceso: 'blue',
  'en proceso': 'blue',
  abierta: 'blue',
  abierto: 'blue',
  registrado: 'blue',
  registrada: 'blue',
  vencida: 'red',
  vencido: 'red',
  moroso: 'red',
  morosa: 'red',
  rechazada: 'red',
  rechazado: 'red',
  cancelada: 'red',
  cancelado: 'red',
  inactivo: 'red',
  inactiva: 'red',
  alta: 'red',
  media: 'yellow',
  baja: 'blue',
};

export default function Badge({ value, tone }) {
  if (value === null || value === undefined || value === '') return <span className="cell-muted">—</span>;

  const text = String(value);
  const resolved = tone || TONES[text.toLowerCase().trim()] || 'orange';

  return <span className={`badge badge--${resolved}`}>{text}</span>;
}
