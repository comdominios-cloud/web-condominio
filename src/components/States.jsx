import { IconRefresh } from './Icons.jsx';

export function Loading({ label = 'Cargando informacion...' }) {
  return (
    <div className="state">
      <div className="spinner" />
      <p>{label}</p>
    </div>
  );
}

export function ErrorState({ error, onRetry }) {
  return (
    <div className="state">
      <h3>No se pudo cargar la informacion</h3>
      <p>{error?.message || 'Ocurrio un error inesperado.'}</p>
      {onRetry ? (
        <button type="button" className="btn btn--ghost btn--sm" onClick={onRetry} style={{ marginTop: 16 }}>
          <IconRefresh />
          Reintentar
        </button>
      ) : null}
    </div>
  );
}

export function EmptyState({ title = 'Sin registros', description }) {
  return (
    <div className="state">
      <h3>{title}</h3>
      {description ? <p>{description}</p> : null}
    </div>
  );
}

export function AsyncSection({ loading, error, isEmpty, onRetry, emptyTitle, emptyText, children }) {
  if (loading) return <Loading />;
  if (error) return <ErrorState error={error} onRetry={onRetry} />;
  if (isEmpty) return <EmptyState title={emptyTitle} description={emptyText} />;
  return children;
}
