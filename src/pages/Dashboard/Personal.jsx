import { Link } from 'react-router-dom';
import { useResident } from '../../auth/ResidentContext.jsx';
import { ResidentGate } from '../Residentes/MiPerfil.jsx';
import { fullName, unitLabel } from '../../utils/domain.js';

export default function Personal() {
  const { data } = useResident();
  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>Mi hogar</h1>
          <p>Tu información y los servicios de tu unidad, en un solo lugar.</p>
        </div>
      </div>
      <ResidentGate>
        <section className="highlight" style={{ marginBottom: 24 }}>
          <h2>Hola, {fullName(data)}</h2>
          <p>{unitLabel(data?.unidad || data?.unidad_id)}</p>
        </section>
        <div className="grid grid--2">
          {[
            [
              '/pagos',
              'Mis cuotas y pagos',
              'Consulta el saldo de tu unidad, los vencimientos y los pagos registrados.',
            ],
            [
              '/mi-perfil',
              'Mi perfil',
              'Revisa tu inscripción en el padrón y actualiza tus datos de contacto.',
            ],
            [
              '/incidencias',
              'Mis incidencias',
              'Consulta el seguimiento de los reportes asociados a tu ficha.',
            ],
            [
              '/reservas',
              'Mis reservas',
              'Revisa las reservas de áreas comunes asociadas a tu ficha.',
            ],
          ].map(([to, title, description]) => (
            <section className="card card-body stack" key={to}>
              <h2>{title}</h2>
              <p>{description}</p>
              <Link className="btn btn--ghost" to={to}>
                Ver {title.toLowerCase()}
              </Link>
            </section>
          ))}
        </div>
      </ResidentGate>
    </div>
  );
}
