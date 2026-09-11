import { useResident } from '../../auth/ResidentContext.jsx';
import { ResidentGate } from './MiPerfil.jsx';
import { listarIncidencias, listarReservas } from '../../api/incidencias.js';
import { useApi } from '../../hooks/useApi.js';
import DataTable from '../../components/DataTable.jsx';
import Badge from '../../components/Badge.jsx';
import { dateTime, pick, text } from '../../utils/format.js';

export default function MiActividad({ kind }) {
  const profile = useResident();
  const resident = profile.data;
  const reservations = kind === 'reservas';
  const state = useApi(
    async () => {
      const rows = await (reservations ? listarReservas : listarIncidencias)({
        residente_id: resident.id,
        unidad_id: resident.unidad_id,
      });
      // Ignore unrelated rows even if the service ignores the filter.
      return rows.filter(
        (row) => String(row.residente_id ?? row.residenteId ?? '') === String(resident.id),
      );
    },
    [kind, resident?.id],
    { enabled: Boolean(resident?.activo), initialData: [] },
  );
  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>{reservations ? 'Mis reservas' : 'Mis incidencias'}</h1>
          <p>Registros asociados a tu ficha de residente.</p>
        </div>
        {resident && (
          <button className="btn btn--ghost" onClick={state.reload}>
            Actualizar
          </button>
        )}
      </div>
      <ResidentGate>
        <section className="card">
          <DataTable
            rows={state.data || []}
            loading={state.loading}
            error={state.error}
            onRetry={state.reload}
            emptyTitle="No hay registros disponibles"
            emptyText="Cuando administración registre información asociada a tu ficha, aparecerá aquí."
            columns={[
              {
                key: 'title',
                header: reservations ? 'Área común' : 'Asunto',
                render: (r) =>
                  text(
                    pick(
                      r,
                      reservations
                        ? ['area_comun', 'area', 'espacio']
                        : ['titulo', 'descripcion', 'asunto'],
                    ),
                  ),
              },
              {
                key: 'date',
                header: 'Fecha',
                render: (r) => dateTime(pick(r, ['fecha_inicio', 'fecha', 'created_at'])),
              },
              {
                key: 'status',
                header: 'Estado',
                render: (r) => <Badge value={pick(r, ['estado', 'status'])} />,
              },
            ]}
          />
        </section>
        <p className="cell-muted" style={{ marginTop: 20 }}>
          Para solicitar una nueva reserva o reportar una incidencia, contacta a administración.
          Esta vista permite consultar el seguimiento disponible.
        </p>
      </ResidentGate>
    </div>
  );
}
