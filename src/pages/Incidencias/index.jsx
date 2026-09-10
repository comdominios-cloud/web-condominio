import { useMemo, useState } from 'react';
import { listarIncidencias } from '../../api/incidencias.js';
import { useApi } from '../../hooks/useApi.js';
import DataTable from '../../components/DataTable.jsx';
import StatCard from '../../components/StatCard.jsx';
import Badge from '../../components/Badge.jsx';
import { IconAlert, IconCheck, IconRefresh } from '../../components/Icons.jsx';
import { dateTime, matches, number, pick, text } from '../../utils/format.js';

function cuentaPorEstado(items, prefijos) {
  return items.filter((item) => {
    const estado = String(pick(item, ['estado', 'status'], '')).toLowerCase();
    return prefijos.some((prefijo) => estado.startsWith(prefijo));
  }).length;
}

export default function Incidencias() {
  const { data, loading, error, reload } = useApi(() => listarIncidencias(), [], { initialData: [] });

  const [filtro, setFiltro] = useState('');

  const incidencias = data || [];

  const abiertas = useMemo(() => cuentaPorEstado(incidencias, ['abier', 'pend', 'nuev']), [incidencias]);
  const enProceso = useMemo(() => cuentaPorEstado(incidencias, ['en pro', 'proce', 'asign']), [incidencias]);
  const resueltas = useMemo(() => cuentaPorEstado(incidencias, ['resu', 'cerr', 'aten']), [incidencias]);

  const visibles = incidencias.filter((item) => matches(item, filtro));

  const columnas = [
    {
      key: 'titulo',
      header: 'Incidencia',
      render: (row) => (
        <>
          <div className="cell-strong">
            {text(pick(row, ['titulo', 'asunto', 'nombre', 'descripcion']))}
          </div>
          <div className="cell-muted" style={{ fontSize: 12.5 }}>
            {text(pick(row, ['categoria', 'tipo', 'area']), 'general')}
          </div>
        </>
      ),
    },
    {
      key: 'unidad',
      header: 'Unidad',
      className: 'cell-num',
      render: (row) => text(pick(row, ['unidad', 'unidad_id', 'departamento'])),
    },
    {
      key: 'reporta',
      header: 'Reportado por',
      render: (row) => text(pick(row, ['residente', 'reportado_por', 'residente_id', 'usuario'])),
    },
    {
      key: 'fecha',
      header: 'Fecha',
      render: (row) => dateTime(pick(row, ['fecha', 'fecha_reporte', 'created_at', 'createdAt'])),
    },
    {
      key: 'prioridad',
      header: 'Prioridad',
      render: (row) => <Badge value={pick(row, ['prioridad', 'severidad', 'priority'], 'Media')} />,
    },
    {
      key: 'estado',
      header: 'Estado',
      render: (row) => <Badge value={pick(row, ['estado', 'status'], 'Abierta')} />,
    },
  ];

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>Incidencias de la comunidad</h1>
          <p>
            Reportes registrados en <strong>ms-incidencias</strong> (<code>GET /incidencias</code>) con su
            estado de atencion.
          </p>
        </div>

        <div className="toolbar">
          <input
            className="input"
            type="search"
            placeholder="Buscar incidencia..."
            value={filtro}
            onChange={(event) => setFiltro(event.target.value)}
          />
          <button type="button" className="btn btn--ghost btn--sm" onClick={reload}>
            <IconRefresh />
            Actualizar
          </button>
        </div>
      </div>

      <div className="grid grid--stats" style={{ marginBottom: 22 }}>
        <StatCard
          label="Total"
          value={number(incidencias.length)}
          help="Incidencias reportadas"
          tone="orange"
          icon={<IconAlert />}
          loading={loading}
        />
        <StatCard
          label="Abiertas"
          value={number(abiertas)}
          help="Esperando atencion"
          tone="yellow"
          icon={<IconAlert />}
          loading={loading}
        />
        <StatCard
          label="En proceso"
          value={number(enProceso)}
          help="Con responsable asignado"
          tone="blue"
          icon={<IconAlert />}
          loading={loading}
        />
        <StatCard
          label="Resueltas"
          value={number(resueltas)}
          help="Cerradas satisfactoriamente"
          tone="green"
          icon={<IconCheck width={18} height={18} />}
          loading={loading}
        />
      </div>

      <section className="card">
        <div className="card-head">
          <h2>{number(visibles.length)} incidencias</h2>
          <span className="badge badge--orange">ms-incidencias · 9003</span>
        </div>

        <DataTable
          columns={columnas}
          rows={visibles}
          rowKey={(row, index) => pick(row, ['id', '_id', 'codigo'], index)}
          loading={loading}
          error={error}
          onRetry={reload}
          emptyTitle={filtro ? 'Sin coincidencias' : 'Sin incidencias'}
          emptyText={
            filtro
              ? 'Prueba con otro termino de busqueda.'
              : 'No hay incidencias reportadas en este momento.'
          }
        />
      </section>
    </div>
  );
}
