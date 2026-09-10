import { useMemo } from 'react';
import {
  morosidadPorEdificio,
  prediccionAreaComun,
  recaudacionMensual,
} from '../../api/analitico.js';
import { useApi } from '../../hooks/useApi.js';
import { AsyncSection, ErrorState, Loading } from '../../components/States.jsx';
import { IconRefresh, IconSparkle } from '../../components/Icons.jsx';
import { money, percent, pick, text } from '../../utils/format.js';

function normalizarMorosidad(filas) {
  return filas
    .map((fila) => ({
      nombre: text(pick(fila, ['edificio', 'nombre', 'edificio_nombre', 'torre', 'bloque']), 'Sin nombre'),
      valor: Number(pick(fila, ['morosidad', 'porcentaje', 'tasa', 'ratio', 'valor'], 0)),
    }))
    .filter((fila) => Number.isFinite(fila.valor))
    .sort((a, b) => b.valor - a.valor);
}

function normalizarRecaudacion(filas) {
  return filas
    .map((fila) => ({
      etiqueta: text(pick(fila, ['mes', 'periodo', 'anio_mes', 'fecha', 'label']), '—'),
      valor: Number(pick(fila, ['monto', 'total', 'recaudado', 'importe', 'valor'], 0)),
    }))
    .filter((fila) => Number.isFinite(fila.valor));
}

export default function Analitica() {
  const morosidad = useApi(() => morosidadPorEdificio(), [], { initialData: [] });
  const recaudacion = useApi(() => recaudacionMensual(), [], { initialData: [] });
  const prediccion = useApi(() => prediccionAreaComun(), []);

  const filasMorosidad = useMemo(() => normalizarMorosidad(morosidad.data || []), [morosidad.data]);
  const filasRecaudacion = useMemo(() => normalizarRecaudacion(recaudacion.data || []), [recaudacion.data]);

  const maxMorosidad = Math.max(1, ...filasMorosidad.map((fila) => fila.valor));
  const maxRecaudacion = Math.max(1, ...filasRecaudacion.map((fila) => fila.valor));

  const pronostico = prediccion.data;

  const areaPredicha = text(
    pick(pronostico, ['area', 'area_comun', 'nombre', 'espacio', 'prediccion']),
    'Sin prediccion'
  );

  const visitasPredichas = pick(pronostico, ['visitas', 'reservas', 'cantidad', 'total', 'valor']);

  const mesPredicho = text(pick(pronostico, ['mes', 'periodo', 'proximo_mes']), 'proximo mes');

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>Tablero analitico</h1>
          <p>
            Indicadores calculados por <strong>ms-analitico</strong> sobre la data historica procesada en
            Athena.
          </p>
        </div>

        <button
          type="button"
          className="btn btn--ghost btn--sm"
          onClick={() => {
            morosidad.reload();
            recaudacion.reload();
            prediccion.reload();
          }}
        >
          <IconRefresh />
          Actualizar
        </button>
      </div>

      <div className="stack">
        <section className="highlight" style={{ display: 'flex', gap: 22, flexWrap: 'wrap', alignItems: 'center' }}>
          <span
            style={{
              width: 54,
              height: 54,
              borderRadius: 16,
              background: 'rgba(255,255,255,.18)',
              display: 'grid',
              placeItems: 'center',
              flexShrink: 0,
            }}
          >
            <IconSparkle width={26} height={26} />
          </span>

          <div style={{ flex: 1, minWidth: 240 }}>
            <h3>Area comun mas visitada · {mesPredicho}</h3>
            {prediccion.loading ? (
              <p>Calculando prediccion...</p>
            ) : prediccion.error ? (
              <p>{prediccion.error.message}</p>
            ) : (
              <>
                <div className="highlight-value">{areaPredicha}</div>
                <p>
                  {visitasPredichas
                    ? `Proyeccion de ${visitasPredichas} visitas segun el modelo predictivo.`
                    : 'GET /analitica/prediccion-area-comun · ms-analitico'}
                </p>
              </>
            )}
          </div>
        </section>

        <div className="grid grid--2">
          <section className="card">
            <div className="card-head">
              <div>
                <h2>Morosidad por edificio</h2>
                <p style={{ fontSize: 13.5, color: 'var(--muted)' }}>
                  GET /analitica/morosidad-por-edificio
                </p>
              </div>
            </div>

            <div className="card-body">
              <AsyncSection
                loading={morosidad.loading}
                error={morosidad.error}
                isEmpty={filasMorosidad.length === 0}
                onRetry={morosidad.reload}
                emptyTitle="Sin datos de morosidad"
                emptyText="ms-analitico todavia no devuelve resultados para este indicador."
              >
                <div className="chart-bars">
                  {filasMorosidad.map((fila) => (
                    <div className="chart-row" key={fila.nombre}>
                      <span className="chart-name" title={fila.nombre}>
                        {fila.nombre}
                      </span>
                      <span className="chart-track">
                        <span
                          className="chart-fill"
                          style={{ width: `${Math.max(3, (fila.valor / maxMorosidad) * 100)}%` }}
                        />
                      </span>
                      <span className="chart-value">{percent(fila.valor)}</span>
                    </div>
                  ))}
                </div>
              </AsyncSection>
            </div>
          </section>

          <section className="card">
            <div className="card-head">
              <div>
                <h2>Recaudacion mensual</h2>
                <p style={{ fontSize: 13.5, color: 'var(--muted)' }}>
                  GET /analitica/recaudacion-mensual
                </p>
              </div>
            </div>

            <div className="card-body">
              {recaudacion.loading ? (
                <Loading label="Cargando recaudacion..." />
              ) : recaudacion.error ? (
                <ErrorState error={recaudacion.error} onRetry={recaudacion.reload} />
              ) : filasRecaudacion.length === 0 ? (
                <div className="state">
                  <h3>Sin datos de recaudacion</h3>
                  <p>ms-analitico todavia no devuelve resultados para este indicador.</p>
                </div>
              ) : (
                <>
                  <div className="chart-columns">
                    {filasRecaudacion.slice(-12).map((fila) => (
                      <div className="chart-col" key={fila.etiqueta}>
                        <span className="chart-col-value">{Math.round(fila.valor).toLocaleString('es-PE')}</span>
                        <span
                          className="chart-col-bar"
                          style={{ height: `${Math.max(4, (fila.valor / maxRecaudacion) * 100)}%` }}
                        />
                        <span className="chart-col-label">{fila.etiqueta}</span>
                      </div>
                    ))}
                  </div>

                  <p style={{ marginTop: 16, fontSize: 13.5, color: 'var(--muted)' }}>
                    Total del periodo mostrado:{' '}
                    <strong style={{ color: 'var(--ink)' }}>
                      {money(filasRecaudacion.slice(-12).reduce((total, fila) => total + fila.valor, 0))}
                    </strong>
                  </p>
                </>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
