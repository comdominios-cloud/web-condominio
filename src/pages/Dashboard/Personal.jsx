import { Link } from 'react-router-dom';
import { useResident } from '../../auth/ResidentContext.jsx';
import { ResidentGate } from '../Residentes/MiPerfil.jsx';
import { fullName, unitLabel, isOwner, residenceLabel } from '../../utils/domain.js';

export default function Personal() {
  const { data } = useResident();
  const owner = isOwner(data);
  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>{owner ? 'Mi propiedad' : 'Mi hogar'}</h1>
          <p>{owner ? 'Consulta tu unidad y su estado de cuenta como propietario.' : 'Consulta tu ficha como residente y los servicios de la unidad donde vives.'}</p>
        </div>
      </div>
      <ResidentGate>
        <section className="highlight" style={{ marginBottom: 24 }}>
          <h2>Hola, {fullName(data)}</h2>
          <p>{residenceLabel(data)} · {unitLabel(data?.unidad || data?.unidad_id)}</p>
        </section>
        <div className="grid grid--2">
          {[
            ...(owner ? [['/mi-unidad', 'Mi unidad', 'Consulta los datos del inmueble asociado a tu ficha: edificio, piso y superficie.']] : []),
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
