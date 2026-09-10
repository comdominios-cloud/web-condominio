import { useMemo, useState } from 'react';
import { listarReservas } from '../../api/incidencias.js';
import { useApi } from '../../hooks/useApi.js';
import DataTable from '../../components/DataTable.jsx';
import StatCard from '../../components/StatCard.jsx';
import Badge from '../../components/Badge.jsx';
import { IconCalendar, IconCheck, IconRefresh } from '../../components/Icons.jsx';
import { dateTime, matches, number, pick, text } from '../../utils/format.js';

export default function Reservas() {
  const { data, loading, error, reload } = useApi(() => listarReservas(), [], { initialData: [] });

  const [filtro, setFiltro] = useState('');

  const reservas = data || [];

  const areas = useMemo(() => {
    const set = new Set();

    reservas.forEach((reserva) => {
      const area = pick(reserva, ['area', 'area_comun', 'espacio', 'nombre_area', 'nombre']);
      if (area) set.add(String(area));
    });

    return set;
  }, [reservas]);

  const confirmadas = useMemo(
    () =>
      reservas.filter((reserva) =>
        String(pick(reserva, ['estado', 'status'], '')).toLowerCase().startsWith('confirm')
      ).length,
    [reservas]
  );

  const proximas = useMemo(() => {
    const ahora = Date.now();

    return reservas.filter((reserva) => {
      const valor = pick(reserva, ['fecha', 'fecha_reserva', 'inicio', 'fecha_inicio']);
      const fecha = valor ? new Date(valor).getTime() : NaN;
      return Number.isFinite(fecha) && fecha >= ahora;
    }).length;
  }, [reservas]);

  const visibles = reservas.filter((item) => matches(item, filtro));

  const columnas = [
    {
      key: 'area',
      header: 'Area comun',
      render: (row) => (
        <>
          <div className="cell-strong">
            {text(pick(row, ['area', 'area_comun', 'espacio', 'nombre_area', 'nombre']))}
          </div>
          <div className="cell-muted" style={{ fontSize: 12.5 }}>
            {text(pick(row, ['edificio', 'torre', 'ubicacion']), 'condominio')}
          </div>
        </>
      ),
    },
    {
      key: 'residente',
      header: 'Reservado por',
      render: (row) => text(pick(row, ['residente', 'residente_id', 'usuario', 'solicitante'])),
    },
    {
      key: 'unidad',
      header: 'Unidad',
      className: 'cell-num',
      render: (row) => text(pick(row, ['unidad', 'unidad_id', 'departamento'])),
    },
    {
      key: 'inicio',
      header: 'Inicio',
      render: (row) => dateTime(pick(row, ['inicio', 'fecha_inicio', 'fecha', 'fecha_reserva'])),
    },
    {
      key: 'fin',
      header: 'Fin',
      render: (row) => dateTime(pick(row, ['fin', 'fecha_fin', 'hora_fin'])),
    },
    {
      key: 'estado',
      header: 'Estado',
      render: (row) => <Badge value={pick(row, ['estado', 'status'], 'Confirmada')} />,
    },
  ];

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>Reservas de areas comunes</h1>
          <p>
            Agenda de espacios compartidos expuesta por <strong>ms-incidencias</strong> (
            <code>GET /reservas</code>).
          </p>
        </div>

        <div className="toolbar">
          <input
            className="input"
            type="search"
            placeholder="Buscar reserva..."
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
          label="Reservas"
          value={number(reservas.length)}
          help="Registradas en total"
          tone="orange"
          icon={<IconCalendar />}
          loading={loading}
        />
        <StatCard
          label="Areas usadas"
          value={number(areas.size)}
          help="Espacios distintos reservados"
          tone="blue"
          icon={<IconCalendar />}
          loading={loading}
        />
        <StatCard
          label="Confirmadas"
          value={number(confirmadas)}
          help="Con reserva aprobada"
          tone="green"
          icon={<IconCheck width={18} height={18} />}
          loading={loading}
        />
        <StatCard
          label="Proximas"
          value={number(proximas)}
          help="Con fecha futura"
          tone="yellow"
          icon={<IconCalendar />}
          loading={loading}
        />
      </div>

      <section className="card">
        <div className="card-head">
          <h2>{number(visibles.length)} reservas</h2>
          <span className="badge badge--orange">ms-incidencias · 9003</span>
        </div>

        <DataTable
          columns={columnas}
          rows={visibles}
          rowKey={(row, index) => pick(row, ['id', '_id', 'codigo'], index)}
          loading={loading}
          error={error}
          onRetry={reload}
          emptyTitle={filtro ? 'Sin coincidencias' : 'Sin reservas'}
          emptyText={
            filtro
              ? 'Prueba con otro termino de busqueda.'
              : 'Todavia no hay reservas de areas comunes registradas.'
          }
        />
      </section>
    </div>
  );
}
