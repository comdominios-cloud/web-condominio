import { useMemo, useState } from 'react';
import { listarCuotas, listarPagos } from '../../api/pagos.js';
import { useApi } from '../../hooks/useApi.js';
import DataTable from '../../components/DataTable.jsx';
import StatCard from '../../components/StatCard.jsx';
import Badge from '../../components/Badge.jsx';
import { IconAlert, IconCheck, IconMoney, IconRefresh } from '../../components/Icons.jsx';
import { date, matches, money, number, pick, text } from '../../utils/format.js';

const TABS = [
  { key: 'cuotas', label: 'Cuotas emitidas' },
  { key: 'pagos', label: 'Pagos registrados' },
];

function suma(items, claves) {
  return items.reduce((total, item) => {
    const valor = Number(pick(item, claves, 0));
    return Number.isFinite(valor) ? total + valor : total;
  }, 0);
}

export default function Pagos() {
  const cuotas = useApi(() => listarCuotas(), [], { initialData: [] });
  const pagos = useApi(() => listarPagos(), [], { initialData: [] });

  const [tab, setTab] = useState('cuotas');
  const [filtro, setFiltro] = useState('');

  const listaCuotas = cuotas.data || [];
  const listaPagos = pagos.data || [];

  const pendientes = useMemo(
    () =>
      listaCuotas.filter((cuota) =>
        String(pick(cuota, ['estado', 'status'], 'pendiente')).toLowerCase().startsWith('pend')
      ),
    [listaCuotas]
  );

  const totalEmitido = useMemo(() => suma(listaCuotas, ['monto', 'importe', 'total']), [listaCuotas]);
  const totalRecaudado = useMemo(() => suma(listaPagos, ['monto', 'importe', 'total']), [listaPagos]);
  const totalPendiente = useMemo(() => suma(pendientes, ['monto', 'importe', 'total']), [pendientes]);

  const columnasCuotas = [
    {
      key: 'concepto',
      header: 'Concepto',
      render: (row) => (
        <>
          <div className="cell-strong">{text(pick(row, ['concepto', 'descripcion', 'tipo']))}</div>
          <div className="cell-muted" style={{ fontSize: 12.5 }}>
            {text(pick(row, ['unidad', 'unidad_id', 'departamento']), 'sin unidad')}
          </div>
        </>
      ),
    },
    {
      key: 'periodo',
      header: 'Periodo',
      render: (row) => text(pick(row, ['periodo', 'mes', 'anio_mes'])),
    },
    {
      key: 'emision',
      header: 'Emision',
      render: (row) => date(pick(row, ['fecha_emision', 'fecha', 'created_at'])),
    },
    {
      key: 'vencimiento',
      header: 'Vencimiento',
      render: (row) => date(pick(row, ['fecha_vencimiento', 'vencimiento', 'due_date'])),
    },
    {
      key: 'monto',
      header: 'Monto',
      align: 'right',
      className: 'cell-num',
      render: (row) => money(pick(row, ['monto', 'importe', 'total'])),
    },
    {
      key: 'estado',
      header: 'Estado',
      render: (row) => <Badge value={pick(row, ['estado', 'status'], 'Pendiente')} />,
    },
  ];

  const columnasPagos = [
    {
      key: 'referencia',
      header: 'Referencia',
      render: (row) => (
        <>
          <div className="cell-strong">
            {text(pick(row, ['referencia', 'codigo', 'operacion', 'id', '_id']))}
          </div>
          <div className="cell-muted" style={{ fontSize: 12.5 }}>
            {text(pick(row, ['unidad', 'unidad_id', 'residente', 'residente_id']), 'sin unidad')}
          </div>
        </>
      ),
    },
    {
      key: 'fecha',
      header: 'Fecha',
      render: (row) => date(pick(row, ['fecha', 'fecha_pago', 'created_at'])),
    },
    {
      key: 'medio',
      header: 'Medio',
      render: (row) => text(pick(row, ['medio', 'metodo', 'medio_pago', 'canal'])),
    },
    {
      key: 'monto',
      header: 'Monto',
      align: 'right',
      className: 'cell-num',
      render: (row) => money(pick(row, ['monto', 'importe', 'total'])),
    },
    {
      key: 'estado',
      header: 'Estado',
      render: (row) => <Badge value={pick(row, ['estado', 'status'], 'Registrado')} />,
    },
  ];

  const activo = tab === 'cuotas' ? cuotas : pagos;
  const fuente = tab === 'cuotas' ? listaCuotas : listaPagos;
  const visibles = fuente.filter((item) => matches(item, filtro));

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>Cuotas y pagos</h1>
          <p>
            Estado economico del condominio segun <strong>ms-pagos</strong> (<code>GET /cuotas</code> y{' '}
            <code>GET /pagos</code>).
          </p>
        </div>

        <button
          type="button"
          className="btn btn--ghost btn--sm"
          onClick={() => {
            cuotas.reload();
            pagos.reload();
          }}
        >
          <IconRefresh />
          Actualizar
        </button>
      </div>

      <div className="grid grid--stats" style={{ marginBottom: 22 }}>
        <StatCard
          label="Emitido"
          value={money(totalEmitido)}
          help={`${number(listaCuotas.length)} cuotas emitidas`}
          tone="orange"
          icon={<IconMoney />}
          loading={cuotas.loading}
        />
        <StatCard
          label="Recaudado"
          value={money(totalRecaudado)}
          help={`${number(listaPagos.length)} pagos registrados`}
          tone="green"
          icon={<IconCheck width={18} height={18} />}
          loading={pagos.loading}
        />
        <StatCard
          label="Por cobrar"
          value={money(totalPendiente)}
          help={`${number(pendientes.length)} cuotas pendientes`}
          tone="yellow"
          icon={<IconAlert />}
          loading={cuotas.loading}
        />
        <StatCard
          label="Nivel de cobranza"
          value={totalEmitido > 0 ? `${((totalRecaudado / totalEmitido) * 100).toFixed(1)}%` : '—'}
          help="Recaudado sobre lo emitido"
          tone="blue"
          icon={<IconMoney />}
          loading={cuotas.loading || pagos.loading}
        />
      </div>

      <section className="card">
        <div className="card-head">
          <div className="toolbar">
            {TABS.map((item) => (
              <button
                key={item.key}
                type="button"
                className={tab === item.key ? 'btn btn--primary btn--sm' : 'btn btn--ghost btn--sm'}
                onClick={() => setTab(item.key)}
              >
                {item.label}
              </button>
            ))}
          </div>

          <input
            className="input"
            style={{ width: 240 }}
            type="search"
            placeholder="Filtrar registros..."
            value={filtro}
            onChange={(event) => setFiltro(event.target.value)}
          />
        </div>

        <DataTable
          columns={tab === 'cuotas' ? columnasCuotas : columnasPagos}
          rows={visibles}
          rowKey={(row, index) => pick(row, ['id', '_id', 'referencia', 'codigo'], index)}
          loading={activo.loading}
          error={activo.error}
          onRetry={activo.reload}
          emptyTitle={filtro ? 'Sin coincidencias' : 'Sin registros'}
          emptyText={
            filtro
              ? 'Prueba con otro termino de busqueda.'
              : 'ms-pagos todavia no devuelve informacion para esta vista.'
          }
        />
      </section>
    </div>
  );
}
