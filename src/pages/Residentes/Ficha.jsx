import { Link, useParams } from 'react-router-dom';
import { obtenerResidente } from '../../api/residentes.js';
import { obtenerFichaResidente } from '../../api/ficha.js';
import { useApi } from '../../hooks/useApi.js';
import Badge from '../../components/Badge.jsx';
import { AsyncSection, ErrorState, Loading } from '../../components/States.jsx';
import { IconArrowLeft, IconRefresh } from '../../components/Icons.jsx';
import { date, money, pick, text } from '../../utils/format.js';

function Seccion({ titulo, fuente, children }) {
  return (
    <section className="card">
      <div className="card-head">
        <div>
          <h2>{titulo}</h2>
          {fuente ? <p style={{ fontSize: 13.5, color: 'var(--muted)' }}>{fuente}</p> : null}
        </div>
      </div>
      {children}
    </section>
  );
}

function listaDe(ficha, claves) {
  if (!ficha || typeof ficha !== 'object') return [];

  for (const clave of claves) {
    if (Array.isArray(ficha[clave])) return ficha[clave];
  }

  return [];
}

export default function FichaResidente() {
  const { id } = useParams();

  const residente = useApi(() => obtenerResidente(id), [id]);
  const ficha = useApi(() => obtenerFichaResidente(id), [id]);

  const base = residente.data || {};
  const consolidado = ficha.data || {};

  const cuotas = listaDe(consolidado, ['cuotas', 'cuotas_pendientes', 'deudas']);
  const pagos = listaDe(consolidado, ['pagos', 'historial_pagos']);
  const incidencias = listaDe(consolidado, ['incidencias', 'reportes']);
  const reservas = listaDe(consolidado, ['reservas', 'reservas_areas_comunes']);

  return (
    <div className="page">
      <Link className="back-link" to="/residentes">
        <IconArrowLeft />
        Volver al directorio
      </Link>

      <div className="page-head">
        <div>
          <h1>{text(pick(base, ['nombre', 'nombres', 'nombre_completo', 'name']), `Residente #${id}`)}</h1>
          <p>
            Vista consolidada que integra <strong>ms-residentes</strong> y{' '}
            <strong>ms-ficha-residente</strong>.
          </p>
        </div>

        <button
          type="button"
          className="btn btn--ghost btn--sm"
          onClick={() => {
            residente.reload();
            ficha.reload();
          }}
        >
          <IconRefresh />
          Actualizar
        </button>
      </div>

      <div className="stack">
        <Seccion titulo="Datos del residente" fuente={`GET /residentes/${id} · ms-residentes`}>
          <div className="card-body">
            {residente.loading ? (
              <Loading label="Cargando datos del residente..." />
            ) : residente.error ? (
              <ErrorState error={residente.error} onRetry={residente.reload} />
            ) : (
              <div className="detail-grid">
                <div className="detail-item">
                  <div className="detail-label">Documento</div>
                  <div className="detail-value">
                    {text(pick(base, ['dni', 'documento', 'numero_documento']))}
                  </div>
                </div>
                <div className="detail-item">
                  <div className="detail-label">Correo</div>
                  <div className="detail-value">{text(pick(base, ['email', 'correo']))}</div>
                </div>
                <div className="detail-item">
                  <div className="detail-label">Telefono</div>
                  <div className="detail-value">{text(pick(base, ['telefono', 'celular', 'phone']))}</div>
                </div>
                <div className="detail-item">
                  <div className="detail-label">Unidad</div>
                  <div className="detail-value">
                    {text(pick(base, ['unidad', 'unidad_id', 'departamento']))}
                  </div>
                </div>
                <div className="detail-item">
                  <div className="detail-label">Edificio</div>
                  <div className="detail-value">{text(pick(base, ['edificio', 'torre', 'bloque']))}</div>
                </div>
                <div className="detail-item">
                  <div className="detail-label">Estado</div>
                  <div className="detail-value">
                    <Badge value={pick(base, ['estado', 'status'], 'Activo')} />
                  </div>
                </div>
              </div>
            )}
          </div>
        </Seccion>

        <Seccion titulo="Ficha consolidada" fuente={`GET /ficha/${id} · ms-ficha-residente`}>
          <AsyncSection
            loading={ficha.loading}
            error={ficha.error}
            isEmpty={
              cuotas.length === 0 &&
              pagos.length === 0 &&
              incidencias.length === 0 &&
              reservas.length === 0
            }
            onRetry={ficha.reload}
            emptyTitle="Sin informacion consolidada"
            emptyText="ms-ficha-residente todavia no devuelve cuotas, pagos, incidencias ni reservas para este residente."
          >
            <div className="card-body stack">
              {cuotas.length > 0 ? (
                <div>
                  <h3 style={{ marginBottom: 10 }}>Cuotas</h3>
                  <div className="table-wrap">
                    <table className="table">
                      <thead>
                        <tr>
                          <th>Concepto</th>
                          <th>Periodo</th>
                          <th>Monto</th>
                          <th>Estado</th>
                        </tr>
                      </thead>
                      <tbody>
                        {cuotas.map((cuota, index) => (
                          <tr key={index}>
                            <td className="cell-strong">
                              {text(pick(cuota, ['concepto', 'descripcion', 'tipo']))}
                            </td>
                            <td>{text(pick(cuota, ['periodo', 'mes', 'fecha_emision']))}</td>
                            <td className="cell-num">{money(pick(cuota, ['monto', 'importe', 'total']))}</td>
                            <td>
                              <Badge value={pick(cuota, ['estado', 'status'], 'Pendiente')} />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : null}

              {pagos.length > 0 ? (
                <div>
                  <h3 style={{ marginBottom: 10 }}>Pagos</h3>
                  <div className="table-wrap">
                    <table className="table">
                      <thead>
                        <tr>
                          <th>Fecha</th>
                          <th>Medio</th>
                          <th>Monto</th>
                          <th>Estado</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pagos.map((pago, index) => (
                          <tr key={index}>
                            <td>{date(pick(pago, ['fecha', 'fecha_pago', 'created_at']))}</td>
                            <td>{text(pick(pago, ['medio', 'metodo', 'medio_pago']))}</td>
                            <td className="cell-num">{money(pick(pago, ['monto', 'importe', 'total']))}</td>
                            <td>
                              <Badge value={pick(pago, ['estado', 'status'], 'Registrado')} />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : null}

              {incidencias.length > 0 ? (
                <div>
                  <h3 style={{ marginBottom: 10 }}>Incidencias</h3>
                  <div className="table-wrap">
                    <table className="table">
                      <thead>
                        <tr>
                          <th>Titulo</th>
                          <th>Fecha</th>
                          <th>Estado</th>
                        </tr>
                      </thead>
                      <tbody>
                        {incidencias.map((incidencia, index) => (
                          <tr key={index}>
                            <td className="cell-strong">
                              {text(pick(incidencia, ['titulo', 'descripcion', 'asunto']))}
                            </td>
                            <td>{date(pick(incidencia, ['fecha', 'created_at', 'fecha_reporte']))}</td>
                            <td>
                              <Badge value={pick(incidencia, ['estado', 'status'], 'Abierta')} />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : null}

              {reservas.length > 0 ? (
                <div>
                  <h3 style={{ marginBottom: 10 }}>Reservas</h3>
                  <div className="table-wrap">
                    <table className="table">
                      <thead>
                        <tr>
                          <th>Area comun</th>
                          <th>Fecha</th>
                          <th>Estado</th>
                        </tr>
                      </thead>
                      <tbody>
                        {reservas.map((reserva, index) => (
                          <tr key={index}>
                            <td className="cell-strong">
                              {text(pick(reserva, ['area', 'area_comun', 'espacio', 'nombre']))}
                            </td>
                            <td>{date(pick(reserva, ['fecha', 'fecha_reserva', 'inicio']))}</td>
                            <td>
                              <Badge value={pick(reserva, ['estado', 'status'], 'Confirmada')} />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : null}
            </div>
          </AsyncSection>
        </Seccion>
      </div>
    </div>
  );
}
