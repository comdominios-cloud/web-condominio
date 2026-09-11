import { useState } from 'react';
import { request } from '../../api/http.js';
import { listarCuotas, listarPagos } from '../../api/pagos.js';
import { listarUnidades } from '../../api/residentes.js';
import { useAuth } from '../../auth/AuthContext.jsx';
import { useResident } from '../../auth/ResidentContext.jsx';
import { useApi } from '../../hooks/useApi.js';
import { ResidentGate } from '../Residentes/MiPerfil.jsx';
import { balance, isAdmin, paymentRecords, unitRecords, unitLabel } from '../../utils/domain.js';
import { date, money, matches } from '../../utils/format.js';
import { Loading, ErrorState } from '../../components/States.jsx';
import DataTable from '../../components/DataTable.jsx';
import Badge from '../../components/Badge.jsx';

function EntryForm({ kind, quotas, units, onSaved, onCancel }) {
  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const [form, setForm] = useState({
    unidadId: '',
    cuotaId: '',
    periodo: '',
    concepto: '',
    monto: '',
    fechaEmision: today,
    fechaVencim: '',
    referencia: '',
    medioPago: 'TRANSFERENCIA',
  });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const cuota = kind === 'cuota';
  const change = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  async function save(e) {
    e.preventDefault();
    if (busy) return;
    setError('');
    setBusy(true);
    try {
      if (cuota && form.fechaVencim < form.fechaEmision)
        throw new Error('El vencimiento no puede ser anterior a la emisión.');
      if (cuota && !form.concepto.trim()) throw new Error('Escribe el concepto de la cuota.');
      if (!cuota && !form.referencia.trim())
        throw new Error('Incluye una referencia para identificar el pago real.');
      const amount = Number(form.monto);
      if (!Number.isFinite(amount) || amount <= 0)
        throw new Error('Ingresa un monto mayor que cero.');
      await request('pagos', cuota ? '/cuotas' : '/pagos', {
        method: 'POST',
        body: cuota
          ? {
              unidadId: Number(form.unidadId),
              periodo: form.periodo,
              concepto: form.concepto.trim(),
              monto: amount,
              fechaEmision: form.fechaEmision,
              fechaVencim: form.fechaVencim,
            }
          : {
              cuotaId: Number(form.cuotaId),
              montoPagado: amount,
              referencia: form.referencia.trim(),
              medioPago: form.medioPago,
            },
      });
      onSaved();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }
  const input = (name, label, type = 'text', extra = {}) => (
    <label className="field" key={name}>
      {label}
      <input
        required
        className="input"
        name={name}
        type={type}
        value={form[name]}
        onChange={change}
        {...extra}
      />
    </label>
  );
  return (
    <form className="card card-body stack" onSubmit={save} style={{ marginBottom: 24 }}>
      <h2>{cuota ? 'Emitir cuota' : 'Registrar pago recibido'}</h2>
      {!cuota && (
        <p>
          Registra únicamente un pago recibido y verificado. Esta acción actualiza la contabilidad;
          no realiza un cobro bancario.
        </p>
      )}
      {error && (
        <div role="alert" className="alert alert--error">
          {error}
        </div>
      )}
      <div className="grid grid--2">
        {cuota ? (
          <>
            <label className="field">
              Unidad
              <select
                required
                className="input"
                aria-label="Unidad"
                name="unidadId"
                value={form.unidadId}
                onChange={change}
              >
                <option value="">Seleccionar unidad</option>
                {units.map((u) => (
                  <option key={u.id} value={u.id}>
                    {unitLabel(u)}
                  </option>
                ))}
              </select>
            </label>
            {input('periodo', 'Periodo', 'month')}
            {input('concepto', 'Concepto', 'text', { maxLength: 160 })}
            {input('fechaEmision', 'Fecha de emisión', 'date')}
            {input('fechaVencim', 'Vencimiento', 'date')}
          </>
        ) : (
          <>
            <label className="field">
              Cuota
              <select
                required
                className="input"
                aria-label="Cuota"
                name="cuotaId"
                value={form.cuotaId}
                onChange={change}
              >
                <option value="">Seleccionar cuota</option>
                {quotas
                  .filter((q) => !['PAGADA', 'ANULADA', 'CANCELADA'].includes(q.estado))
                  .map((q) => (
                    <option key={q.id} value={q.id}>
                      #{q.id} · Unidad {q.unidadId ?? q.unidad_id} · {q.concepto} · {money(q.monto)}
                    </option>
                  ))}
              </select>
            </label>
            {input('referencia', 'Referencia / comprobante', 'text', { maxLength: 80 })}
            <label className="field">
              Medio de pago
              <select
                className="input"
                aria-label="Medio de pago"
                name="medioPago"
                value={form.medioPago}
                onChange={change}
              >
                {['EFECTIVO', 'TRANSFERENCIA', 'TARJETA', 'YAPE', 'PLIN'].map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </label>
          </>
        )}
        {input('monto', 'Monto (S/)', 'number', { min: '0.01', step: '0.01' })}
      </div>
      <div className="toolbar">
        <button className="btn btn--primary" disabled={busy}>
          {busy ? 'Guardando…' : 'Confirmar registro'}
        </button>
        <button type="button" className="btn btn--ghost" disabled={busy} onClick={onCancel}>
          Cancelar
        </button>
      </div>
    </form>
  );
}

export default function EstadoCuenta() {
  const { user } = useAuth();
  const admin = isAdmin(user);
  const profile = useResident();
  const resident = profile.data;
  const enabled = admin || Boolean(resident?.activo && resident?.unidad_id != null);
  const units = useApi(listarUnidades, [], { enabled: admin, initialData: [] });
  const state = useApi(
    async () => {
      const params = admin ? undefined : { unidad_id: resident.unidad_id };
      const [allQuotas, allPayments] = await Promise.all([
        listarCuotas(params),
        listarPagos(params),
      ]);
      const quotas = admin ? allQuotas : unitRecords(allQuotas, resident.unidad_id);
      return { quotas, payments: admin ? allPayments : paymentRecords(allPayments, quotas) };
    },
    [admin, resident?.id, resident?.unidad_id],
    { enabled },
  );
  const [tab, setTab] = useState('cuotas');
  const [filter, setFilter] = useState('');
  const [entry, setEntry] = useState(null);
  const [notice, setNotice] = useState('');
  const quotas = state.data?.quotas || [];
  const payments = state.data?.payments || [];
  const labels = new Map((units.data || []).map((u) => [String(u.id), unitLabel(u)]));
  const quotaColumns = [
    { key: 'concepto', header: 'Concepto', render: (q) => q.concepto },
    {
      key: 'unidad',
      header: 'Unidad',
      render: (q) =>
        labels.get(String(q.unidadId ?? q.unidad_id)) || unitLabel(q.unidadId ?? q.unidad_id),
    },
    { key: 'periodo', header: 'Periodo', render: (q) => q.periodo },
    {
      key: 'vencimiento',
      header: 'Vencimiento',
      render: (q) => date(q.fechaVencim ?? q.fecha_vencimiento),
    },
    { key: 'monto', header: 'Monto', render: (q) => money(q.monto) },
    { key: 'estado', header: 'Estado', render: (q) => <Badge value={q.estado} /> },
  ];
  const paymentColumns = [
    { key: 'ref', header: 'Referencia', render: (p) => p.referencia || `Pago #${p.id}` },
    { key: 'cuota', header: 'Cuota', render: (p) => `#${p.cuotaId ?? p.cuota_id}` },
    { key: 'fecha', header: 'Fecha', render: (p) => date(p.fechaPago ?? p.fecha_pago) },
    {
      key: 'monto',
      header: 'Monto pagado',
      render: (p) => money(p.montoPagado ?? p.monto_pagado ?? p.monto),
    },
    {
      key: 'medio',
      header: 'Medio',
      render: (p) => p.medioPago || p.medio_pago || 'No especificado',
    },
  ];
  const content = (
    <>
      {notice && (
        <div className="alert alert--success" role="status">
          {notice}
        </div>
      )}
      {state.loading ? (
        <Loading label="Consultando el estado de cuenta…" />
      ) : state.error ? (
        <ErrorState error={state.error} onRetry={state.reload} />
      ) : (
        state.data && (
          <>
            <div className="grid grid--2" style={{ marginBottom: 24 }}>
              <section className="card card-body">
                <p>Saldo pendiente{admin ? ' del condominio' : ' de mi unidad'}</p>
                <h2>{money(balance(quotas, payments))}</h2>
                <p>
                  {quotas.length} {quotas.length === 1 ? 'cuota registrada' : 'cuotas registradas'}
                </p>
              </section>
              <section className="card card-body">
                <p>Pagos registrados</p>
                <h2>
                  {money(
                    payments.reduce(
                      (s, p) => s + Number(p.montoPagado ?? p.monto_pagado ?? p.monto ?? 0),
                      0,
                    ),
                  )}
                </h2>
                <p>
                  {payments.length} {payments.length === 1 ? 'movimiento' : 'movimientos'}
                </p>
              </section>
            </div>
            {admin && (
              <div className="toolbar" style={{ marginBottom: 20 }}>
                <button className="btn btn--primary" onClick={() => setEntry('cuota')}>
                  Emitir cuota
                </button>
                <button className="btn btn--ghost" onClick={() => setEntry('pago')}>
                  Registrar pago recibido
                </button>
              </div>
            )}
            {entry &&
              (entry === 'cuota' && units.error ? (
                <ErrorState error={units.error} onRetry={units.reload} />
              ) : entry === 'cuota' && units.loading ? (
                <Loading label="Cargando unidades…" />
              ) : (
                <EntryForm
                  key={entry}
                  kind={entry}
                  quotas={quotas}
                  units={units.data || []}
                  onCancel={() => setEntry(null)}
                  onSaved={() => {
                    setEntry(null);
                    setNotice('Operación guardada.');
                    state.reload();
                  }}
                />
              ))}
            <section className="card">
              <div className="card-head">
                <div className="toolbar">
                  {['cuotas', 'pagos'].map((key) => (
                    <button
                      key={key}
                      className={`btn btn--sm ${tab === key ? 'btn--primary' : 'btn--ghost'}`}
                      onClick={() => setTab(key)}
                    >
                      {key === 'cuotas' ? 'Cuotas' : 'Pagos'}
                    </button>
                  ))}
                </div>
                <input
                  className="input"
                  style={{ maxWidth: 260 }}
                  aria-label="Buscar movimientos"
                  placeholder="Buscar movimientos…"
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                />
              </div>
              <DataTable
                columns={tab === 'cuotas' ? quotaColumns : paymentColumns}
                rows={(tab === 'cuotas' ? quotas : payments).filter((r) => matches(r, filter))}
                rowKey={(r) => r.id}
                emptyTitle="No hay movimientos"
                emptyText={
                  filter
                    ? 'Prueba otra búsqueda.'
                    : 'Los movimientos aparecerán cuando administración los registre.'
                }
              />
            </section>
          </>
        )
      )}
      {!admin && (
        <p className="cell-muted" style={{ marginTop: 20 }}>
          Este estado de cuenta corresponde a tu unidad. Coordina el pago con administración; aquí
          verás su registro cuando sea confirmado.
        </p>
      )}
    </>
  );
  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>{admin ? 'Cuotas y pagos' : 'Mis cuotas y pagos'}</h1>
          <p>
            {admin
              ? 'Emite cuotas y registra los pagos recibidos.'
              : 'Consulta los movimientos y vencimientos de tu unidad.'}
          </p>
        </div>
        {enabled && (
          <button
            className="btn btn--ghost"
            onClick={() => {
              setEntry(null);
              state.reload();
            }}
          >
            Actualizar
          </button>
        )}
      </div>
      {admin ? content : <ResidentGate>{content}</ResidentGate>}
    </div>
  );
}
