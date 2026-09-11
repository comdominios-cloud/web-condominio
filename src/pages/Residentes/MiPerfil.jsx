import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext.jsx';
import { useResident } from '../../auth/ResidentContext.jsx';
import ResidentForm from '../../components/ResidentForm.jsx';
import { Loading, ErrorState } from '../../components/States.jsx';
import { fullName, unitLabel } from '../../utils/domain.js';

export function ResidentGate({ children }) {
  const profile = useResident();
  if (profile.loading) return <Loading label="Consultando tu ficha…" />;
  if (profile.error) return <ErrorState error={profile.error} onRetry={profile.reload} />;
  if (!profile.data)
    return (
      <div className="card card-body stack">
        <h2>Completa tu ficha de residente</h2>
        <p>
          Tu cuenta de acceso ya existe. Falta registrar tus datos y unidad para consultar tus
          cuotas, pagos y reservas.
        </p>
        <Link className="btn btn--primary" to="/mi-perfil">
          Completar mi ficha
        </Link>
      </div>
    );
  if (profile.data.activo === false)
    return (
      <div className="card card-body">
        <h2>Ficha inactiva</h2>
        <p>Contacta a administración para revisar tu inscripción en el padrón.</p>
      </div>
    );
  return children;
}

export default function MiPerfil() {
  const { user } = useAuth();
  const profile = useResident();
  const [editing, setEditing] = useState(false);
  const [notice, setNotice] = useState('');
  if (profile.loading) return <Loading label="Consultando tu ficha…" />;
  if (profile.error) return <ErrorState error={profile.error} onRetry={profile.reload} />;
  const resident = profile.data;
  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>Mi perfil</h1>
          <p>Tu cuenta y tus datos en el padrón del condominio.</p>
        </div>
        <button className="btn btn--ghost" onClick={profile.reload}>
          Actualizar
        </button>
      </div>
      {notice && (
        <div className="alert alert--success" role="status">
          {notice}
        </div>
      )}
      <section className="card card-body stack">
        {!resident || editing ? (
          <>
            <h2>{resident ? 'Editar mis datos' : 'Completar mi ficha'}</h2>
            <ResidentForm
              key={resident?.id || 'new'}
              resident={resident}
              email={user.email}
              onSaved={() => {
                setNotice('Ficha guardada en el padrón.');
                setEditing(false);
                profile.reload();
              }}
              onCancel={resident ? () => setEditing(false) : undefined}
            />
          </>
        ) : (
          <>
            <h2>{fullName(resident)}</h2>
            <div className="detail-grid">
              {[
                ['Correo', resident.email],
                ['Documento', resident.documento],
                ['Teléfono', resident.telefono || 'No registrado'],
                ['Unidad', unitLabel(resident.unidad || resident.unidad_id)],
                ['Relación', resident.tipo],
                ['Estado', resident.activo ? 'Activo' : 'Inactivo'],
              ].map(([label, value]) => (
                <div className="detail-item" key={label}>
                  <div className="detail-label">{label}</div>
                  <div className="detail-value">{value}</div>
                </div>
              ))}
            </div>
            <p className="cell-muted">
              Para cambiar de unidad o corregir tu documento, contacta a administración.
            </p>
            <div className="toolbar">
              <button className="btn btn--primary" onClick={() => setEditing(true)}>
                Editar mis datos
              </button>
              <Link className="btn btn--ghost" to="/pagos">
                Ver mis cuotas y pagos
              </Link>
            </div>
          </>
        )}
      </section>
    </div>
  );
}
