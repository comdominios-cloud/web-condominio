import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { listarResidentes, obtenerResidente } from '../../api/residentes.js';
import { useApi } from '../../hooks/useApi.js';
import { useAuth } from '../../auth/AuthContext.jsx';
import StatCard from '../../components/StatCard.jsx';
import Badge from '../../components/Badge.jsx';
import { AsyncSection } from '../../components/States.jsx';
import { IconBuilding, IconCheck, IconRefresh, IconUsers } from '../../components/Icons.jsx';
import { date, number, pick, text } from '../../utils/format.js';

function resumen(residentes) {
  const unidades = new Set();
  const edificios = new Set();
  let activos = 0;

  residentes.forEach((residente) => {
    const unidad = pick(residente, ['unidad', 'unidad_id', 'unidadId', 'departamento', 'numero_unidad']);
    const edificio = pick(residente, ['edificio', 'edificio_id', 'torre', 'bloque']);
    const estado = String(pick(residente, ['estado', 'status'], 'activo')).toLowerCase();

    if (unidad) unidades.add(String(unidad));
    if (edificio) edificios.add(String(edificio));
    if (estado.startsWith('activ')) activos += 1;
  });

  return {
    total: residentes.length,
    unidades: unidades.size,
    edificios: edificios.size,
    activos,
  };
}

export default function Dashboard() {
  const { user } = useAuth();

  const lista = useApi(() => listarResidentes(), [], { initialData: [] });

  const residentes = lista.data || [];

  const stats = useMemo(() => resumen(residentes), [residentes]);

  const recientes = residentes.slice(0, 6);

  const detalle = useApi(
    () => {
      const primero = residentes[0];
      const id = pick(primero, ['id', 'residente_id', 'residenteId', 'uuid', '_id']);

      if (!id) return Promise.resolve(null);

      return obtenerResidente(id);
    },
    [residentes.length],
    { enabled: residentes.length > 0 }
  );

  const destacado = detalle.data;

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>Hola {user?.nombre?.split(' ')[0] || 'vecino'} 👋</h1>
          <p>
            Este es el estado actual de tu comunidad. Los indicadores se calculan con la informacion
            que expone <strong>ms-residentes</strong> a traves del balanceador.
          </p>
        </div>

        <button type="button" className="btn btn--ghost btn--sm" onClick={lista.reload}>
          <IconRefresh />
          Actualizar
        </button>
      </div>

      <div className="grid grid--stats" style={{ marginBottom: 22 }}>
        <StatCard
          label="Residentes"
          value={number(stats.total)}
          help="Registrados en el directorio"
          tone="orange"
          icon={<IconUsers />}
          loading={lista.loading}
        />
        <StatCard
          label="Unidades"
          value={number(stats.unidades)}
          help="Departamentos con residente asignado"
          tone="blue"
          icon={<IconBuilding />}
          loading={lista.loading}
        />
        <StatCard
          label="Edificios"
          value={stats.edificios ? number(stats.edificios) : '—'}
          help="Torres registradas en la comunidad"
          tone="yellow"
          icon={<IconBuilding />}
          loading={lista.loading}
        />
        <StatCard
          label="Residentes activos"
          value={number(stats.activos)}
          help="Con estado activo en el padron"
          tone="green"
          icon={<IconCheck width={18} height={18} />}
          loading={lista.loading}
        />
      </div>

      <div className="grid grid--2">
        <section className="card">
          <div className="card-head">
            <div>
              <h2>Ultimos residentes</h2>
              <p style={{ fontSize: 13.5, color: 'var(--muted)' }}>GET /residentes · ms-residentes</p>
            </div>
            <Link className="btn btn--ghost btn--sm" to="/residentes">
              Ver todo
            </Link>
          </div>

          <AsyncSection
            loading={lista.loading}
            error={lista.error}
            isEmpty={recientes.length === 0}
            onRetry={lista.reload}
            emptyTitle="Aun no hay residentes"
            emptyText="Cuando ms-residentes tenga registros apareceran en esta tabla."
          >
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Residente</th>
                    <th>Unidad</th>
                    <th>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {recientes.map((residente, index) => {
                    const id = pick(residente, ['id', 'residente_id', 'residenteId', 'uuid', '_id'], index);

                    return (
                      <tr key={id}>
                        <td>
                          <Link className="cell-strong" to={`/residentes/${id}`}>
                            {text(
                              pick(residente, ['nombre', 'nombres', 'nombre_completo', 'name', 'full_name'])
                            )}
                          </Link>
                          <div className="cell-muted" style={{ fontSize: 12.5 }}>
                            {text(pick(residente, ['email', 'correo']), 'sin correo')}
                          </div>
                        </td>
                        <td className="cell-num">
                          {text(pick(residente, ['unidad', 'unidad_id', 'departamento', 'numero_unidad']))}
                        </td>
                        <td>
                          <Badge value={pick(residente, ['estado', 'status'], 'Activo')} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </AsyncSection>
        </section>

        <div className="stack">
          <div className="highlight">
            <h3>Ficha consolidada</h3>
            <p>
              Cada residente enlaza con <strong>ms-ficha-residente</strong>, que integra su unidad,
              cuotas, incidencias y reservas en una sola vista.
            </p>
            <div className="highlight-value">{number(stats.total)}</div>
            <p style={{ fontSize: 13.5 }}>fichas disponibles para consultar</p>
          </div>

          <section className="card">
            <div className="card-head">
              <div>
                <h2>Detalle del residente</h2>
                <p style={{ fontSize: 13.5, color: 'var(--muted)' }}>
                  GET /residentes/{'{id}'} · ms-residentes
                </p>
              </div>
            </div>

            <div className="card-body">
              {lista.loading || detalle.loading ? (
                <div className="stack">
                  <div className="skeleton" style={{ width: '70%' }} />
                  <div className="skeleton" style={{ width: '45%' }} />
                  <div className="skeleton" style={{ width: '60%' }} />
                </div>
              ) : destacado ? (
                <div className="detail-grid">
                  <div className="detail-item">
                    <div className="detail-label">Nombre</div>
                    <div className="detail-value">
                      {text(pick(destacado, ['nombre', 'nombres', 'nombre_completo', 'name']))}
                    </div>
                  </div>
                  <div className="detail-item">
                    <div className="detail-label">Unidad</div>
                    <div className="detail-value">
                      {text(pick(destacado, ['unidad', 'unidad_id', 'departamento']))}
                    </div>
                  </div>
                  <div className="detail-item">
                    <div className="detail-label">Documento</div>
                    <div className="detail-value">
                      {text(pick(destacado, ['dni', 'documento', 'doc_identidad']))}
                    </div>
                  </div>
                  <div className="detail-item">
                    <div className="detail-label">Telefono</div>
                    <div className="detail-value">
                      {text(pick(destacado, ['telefono', 'celular', 'phone']))}
                    </div>
                  </div>
                  <div className="detail-item">
                    <div className="detail-label">Ingreso</div>
                    <div className="detail-value">
                      {date(pick(destacado, ['fecha_ingreso', 'created_at', 'fecha_registro']))}
                    </div>
                  </div>
                  <div className="detail-item">
                    <div className="detail-label">Estado</div>
                    <div className="detail-value">
                      <Badge value={pick(destacado, ['estado', 'status'], 'Activo')} />
                    </div>
                  </div>
                </div>
              ) : (
                <p className="cell-muted">
                  Sin datos para mostrar. Este bloque consume el segundo metodo REST de ms-residentes.
                </p>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
