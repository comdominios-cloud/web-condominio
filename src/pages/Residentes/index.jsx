import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { listarResidentes } from '../../api/residentes.js';
import { useApi } from '../../hooks/useApi.js';
import DataTable from '../../components/DataTable.jsx';
import Badge from '../../components/Badge.jsx';
import { IconRefresh, IconSearch } from '../../components/Icons.jsx';
import { matches, number, pick, text } from '../../utils/format.js';

export default function Residentes() {
  const { data, loading, error, reload } = useApi(() => listarResidentes(), [], { initialData: [] });

  const [filtro, setFiltro] = useState('');

  const residentes = data || [];

  const visibles = useMemo(
    () => residentes.filter((residente) => matches(residente, filtro)),
    [residentes, filtro]
  );

  const columnas = [
    {
      key: 'nombre',
      header: 'Residente',
      render: (row, index) => {
        const id = pick(row, ['id', 'residente_id', 'residenteId', 'uuid', '_id'], index);

        return (
          <>
            <Link className="cell-strong" to={`/residentes/${id}`}>
              {text(pick(row, ['nombre', 'nombres', 'nombre_completo', 'name', 'full_name']))}
            </Link>
            <div className="cell-muted" style={{ fontSize: 12.5 }}>
              {text(pick(row, ['email', 'correo']), 'sin correo')}
            </div>
          </>
        );
      },
    },
    {
      key: 'documento',
      header: 'Documento',
      className: 'cell-num',
      render: (row) => text(pick(row, ['dni', 'documento', 'doc_identidad', 'numero_documento'])),
    },
    {
      key: 'unidad',
      header: 'Unidad',
      className: 'cell-num',
      render: (row) => text(pick(row, ['unidad', 'unidad_id', 'departamento', 'numero_unidad'])),
    },
    {
      key: 'edificio',
      header: 'Edificio',
      render: (row) => text(pick(row, ['edificio', 'edificio_id', 'torre', 'bloque'])),
    },
    {
      key: 'telefono',
      header: 'Telefono',
      className: 'cell-num',
      render: (row) => text(pick(row, ['telefono', 'celular', 'phone'])),
    },
    {
      key: 'estado',
      header: 'Estado',
      render: (row) => <Badge value={pick(row, ['estado', 'status'], 'Activo')} />,
    },
  ];

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>Directorio de residentes</h1>
          <p>
            Padron consolidado del condominio. Los datos provienen de <strong>ms-residentes</strong>
            {' '}(<code>GET /residentes</code>).
          </p>
        </div>

        <div className="toolbar">
          <span style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
            <span style={{ position: 'absolute', left: 12, color: 'var(--muted)', display: 'flex' }}>
              <IconSearch />
            </span>
            <input
              className="input"
              style={{ paddingLeft: 36 }}
              type="search"
              placeholder="Buscar residente, unidad, correo..."
              value={filtro}
              onChange={(event) => setFiltro(event.target.value)}
            />
          </span>

          <button type="button" className="btn btn--ghost btn--sm" onClick={reload}>
            <IconRefresh />
            Actualizar
          </button>
        </div>
      </div>

      <section className="card">
        <div className="card-head">
          <h2>{number(visibles.length)} residentes</h2>
          <span className="badge badge--orange">ms-residentes · 9001</span>
        </div>

        <DataTable
          columns={columnas}
          rows={visibles}
          rowKey={(row, index) => pick(row, ['id', 'residente_id', 'uuid', '_id'], index)}
          loading={loading}
          error={error}
          onRetry={reload}
          emptyTitle={filtro ? 'Sin coincidencias' : 'Aun no hay residentes'}
          emptyText={
            filtro
              ? 'Prueba con otro termino de busqueda.'
              : 'Cuando ms-residentes registre datos apareceran aqui.'
          }
        />
      </section>
    </div>
  );
}
