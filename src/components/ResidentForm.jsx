import { useState } from 'react';
import {
  actualizarResidente,
  crearResidente,
  listarResidentes,
  listarUnidades,
} from '../api/residentes.js';
import { useApi } from '../hooks/useApi.js';
import { ErrorState, Loading } from './States.jsx';
import { unitLabel } from '../utils/domain.js';

export default function ResidentForm({ resident, email, onSaved, onCancel }) {
  const units = useApi(listarUnidades, [], { enabled: !resident, initialData: [] });
  const [form, setForm] = useState({
    nombres: resident?.nombres || '',
    apellidos: resident?.apellidos || '',
    documento: resident?.documento || '',
    telefono: resident?.telefono || '',
    unidad_id: resident?.unidad_id || '',
    tipo: resident?.tipo || 'INQUILINO',
    email: resident?.email || email || '',
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const change = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  async function save(e) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const body = {
        nombres: form.nombres.trim(),
        apellidos: form.apellidos.trim(),
        telefono: form.telefono.trim() || null,
        tipo: form.tipo,
        email: form.email.trim().toLowerCase(),
      };
      if (!body.nombres || !body.apellidos) throw new Error('Completa tus nombres y apellidos.');
      let saved;
      if (resident) saved = await actualizarResidente(resident.id, body);
      else {
        const rows = await listarResidentes();
        if (rows.some((r) => String(r.email || '').toLowerCase() === body.email))
          throw new Error(
            'Ya existe una ficha con ese correo. Actualiza la página o consulta a administración; no crees una segunda ficha.',
          );
        saved = await crearResidente({
          ...body,
          documento: form.documento.trim(),
          unidad_id: Number(form.unidad_id),
        });
      }
      onSaved(saved);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }
  if (units.loading) return <Loading label="Cargando unidades…" />;
  if (units.error) return <ErrorState error={units.error} onRetry={units.reload} />;
  if (!resident && units.data.length === 0)
    return (
      <div className="state">
        <h3>No hay unidades disponibles</h3>
        <p>Administración debe registrar las unidades antes de incorporar residentes.</p>
        <button className="btn btn--ghost" onClick={units.reload}>
          Actualizar unidades
        </button>
      </div>
    );
  return (
    <form onSubmit={save} className="stack">
      {error && (
        <div className="alert alert--error" role="alert">
          {error}
        </div>
      )}
      <div className="grid grid--2">
        {[
          ['nombres', 'Nombres', 120],
          ['apellidos', 'Apellidos', 120],
          ['documento', 'Documento de identidad', 20],
          ['telefono', 'Teléfono', 30],
          ['email', 'Correo electrónico', 254],
        ].map(([name, label, max]) => (
          <label className="field" key={name}>
            {label}
            <input
              className="input"
              name={name}
              value={form[name]}
              onChange={change}
              required={name !== 'telefono'}
              maxLength={max}
              minLength={name === 'documento' ? 8 : undefined}
              type={name === 'email' ? 'email' : 'text'}
              readOnly={
                (name === 'email' && Boolean(email)) || (name === 'documento' && Boolean(resident))
              }
            />
          </label>
        ))}
        <label className="field">
          Relación con la unidad
          <select className="input" name="tipo" value={form.tipo} onChange={change}>
            <option value="INQUILINO">Inquilino</option>
            <option value="PROPIETARIO">Propietario</option>
          </select>
        </label>
        {!resident && (
          <label className="field">
            Unidad
            <select
              required
              className="input"
              aria-label="Unidad"
              name="unidad_id"
              value={form.unidad_id}
              onChange={change}
            >
              <option value="">Selecciona tu unidad</option>
              {units.data.map((u) => (
                <option key={u.id} value={u.id}>
                  {unitLabel(u)} · edificio {u.edificio_id}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>
      {!resident && (
        <p className="cell-muted">
          Selecciona únicamente la unidad en la que resides. Tu ficha se guardará en el padrón del
          condominio.
        </p>
      )}
      <div className="toolbar">
        <button className="btn btn--primary" disabled={busy}>
          {busy ? 'Guardando…' : resident ? 'Guardar cambios' : 'Guardar ficha de residente'}
        </button>
        {onCancel && (
          <button type="button" className="btn btn--ghost" disabled={busy} onClick={onCancel}>
            Cancelar
          </button>
        )}
      </div>
    </form>
  );
}
