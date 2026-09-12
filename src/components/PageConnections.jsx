import { useLocation } from "react-router-dom";
import { useAuth } from "../auth/AuthContext.jsx";
import { useResident } from "../auth/ResidentContext.jsx";
import { isAdmin } from "../utils/domain.js";
import ServiceStatus from "./ServiceStatus.jsx";

export default function PageConnections() {
  const { pathname } = useLocation();
  const { user } = useAuth();
  const profile = useResident();
  const admin = isAdmin(user);
  const id = profile.data?.id ?? user?.residente_id;
  const unit = profile.data?.unidad_id;
  const groups = { usuarios: [{ path: "/auth/me" }] };
  if (!admin)
    groups.residentes = [
      {
        path: id != null ? `/residentes/${id}` : "/residentes",
        params: { limit: 200 },
      },
    ];
  if (admin && (pathname === "/" || pathname === "/residentes"))
    groups.residentes = [
      { path: "/residentes", params: { limit: 200 } },
      { path: "/unidades", params: { limit: 200 } },
    ];
  if (pathname.startsWith("/residentes/")) {
    const routeId = pathname.split("/")[2];
    groups.residentes = [{ path: `/residentes/${routeId}` }];
    groups.ficha = [{ path: `/ficha/${routeId}` }];
  }
  if (!admin && pathname === "/mi-perfil" && !profile.data)
    groups.residentes.push({ path: "/unidades", params: { limit: 200 } });
  if (!admin && pathname === "/mi-unidad" && unit != null)
    groups.residentes.push({ path: `/unidades/${unit}` });
  if (admin && pathname === "/pagos")
    groups.residentes = [{ path: "/unidades", params: { limit: 200 } }];
  if (pathname === "/pagos" && (admin || unit != null))
    groups.pagos = ["/cuotas", "/pagos"].map((path) => ({
      path,
      params: admin ? undefined : { unidad_id: unit },
    }));
  if (["/incidencias", "/reservas"].includes(pathname) && (admin || id != null))
    groups.incidencias = [
      {
        path: pathname,
        params: admin ? undefined : { residente_id: id, unidad_id: unit },
      },
    ];
  if (pathname === "/analitica" && admin)
    groups.analitico = [
      "morosidad-por-edificio",
      "recaudacion-mensual",
      "prediccion-area-comun",
    ].map((p) => ({ path: `/analitica/${p}` }));
  return (
    <section
      className="page-connections"
      aria-label="Conexiones de esta pantalla"
    >
      <p>Microservicios de esta pantalla</p>
      <div className="connection-grid">
        {Object.entries(groups).map(([service, checks]) => (
          <ServiceStatus
            key={`${pathname}:${service}`}
            service={service}
            checks={checks}
          />
        ))}
      </div>
    </section>
  );
}
