import { Link, Navigate } from "react-router-dom";
import { useResident } from "../../auth/ResidentContext.jsx";
import { ResidentGate } from "./MiPerfil.jsx";
import { useApi } from "../../hooks/useApi.js";
import { request } from "../../api/http.js";
import { isOwner, unitLabel } from "../../utils/domain.js";
import { Loading, ErrorState } from "../../components/States.jsx";

export default function MiUnidad() {
  const profile = useResident();
  const owner = isOwner(profile.data);
  const unit = useApi(
    () => request("residentes", `/unidades/${profile.data.unidad_id}`),
    [profile.data?.unidad_id],
    { enabled: owner && profile.data?.activo !== false },
  );
  if (!profile.loading && profile.data && !owner)
    return <Navigate to="/" replace />;
  return (
    <div className="page">
      <h1>Mi unidad como propietario</h1>
      <p>
        Datos de la unidad asociada a tu ficha. No incluye otras propiedades ni
        información privada de otros vecinos.
      </p>
      <ResidentGate>
        {unit.loading ? (
          <Loading />
        ) : unit.error ? (
          <ErrorState error={unit.error} onRetry={unit.reload} />
        ) : (
          unit.data && (
            <section className="card card-body stack" style={{ marginTop: 20 }}>
              <h2>{unitLabel(unit.data)}</h2>
              <div className="detail-grid">
                {[
                  [
                    "Edificio",
                    unit.data.edificio?.nombre ?? unit.data.edificio_id,
                  ],
                  ["Piso", unit.data.piso],
                  ["Superficie (m²)", unit.data.area_m2],
                ].map(([label, value]) => (
                  <div className="detail-item" key={label}>
                    <div className="detail-label">{label}</div>
                    <div className="detail-value">
                      {value ?? "No registrado"}
                    </div>
                  </div>
                ))}
              </div>
              <div className="toolbar">
                <Link className="btn btn--primary" to="/pagos">
                  Ver estado de cuenta de mi unidad
                </Link>
                <Link className="btn btn--ghost" to="/mi-perfil">
                  Revisar mi ficha
                </Link>
                <button className="btn btn--ghost" onClick={unit.reload}>
                  Actualizar unidad
                </button>
              </div>
            </section>
          )
        )}
      </ResidentGate>
    </div>
  );
}
