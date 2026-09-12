import { useState, useSyncExternalStore } from "react";
import { request } from "../api/http.js";
import {
  connectionKey,
  getConnections,
  subscribeConnections,
} from "../api/connectionStatus.js";

const NAMES = {
  usuarios: "ms-usuarios",
  residentes: "ms-residentes",
  pagos: "ms-pagos",
  incidencias: "ms-incidencias",
  ficha: "ms-ficha-residente",
  analitico: "ms-analitico",
};

export default function ServiceStatus({
  service,
  checks,
  sessionProbe = false,
}) {
  const connections = useSyncExternalStore(
    subscribeConnections,
    getConnections,
  );
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const results = checks.map(
    (c) => connections[connectionKey(service, c.path)],
  );
  const responds = (r) =>
    r?.state === "ok" || (sessionProbe && r?.status === 401);
  const problem = results.some((r) => r?.state === "error" && !responds(r));
  const checking = busy || results.some((r) => r?.state === "loading");
  const good = results.length > 0 && results.every(responds);
  const label = checking
    ? "Comprobando"
    : problem
      ? "Hay un problema"
      : good
        ? sessionProbe
          ? "Responde"
          : "Conectado"
        : "Sin comprobar";
  async function check() {
    setOpen(true);
    setBusy(true);
    await Promise.allSettled(
      checks.map((c) => request(service, c.path, { params: c.params })),
    );
    setBusy(false);
  }
  return (
    <div className="service-status">
      <button
        type="button"
        className={`btn btn--ghost btn--sm service-status--${problem ? "error" : good ? "ok" : "idle"}`}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        {NAMES[service]} · {label}
      </button>
      {open && (
        <div className="service-details">
          <p>
            {sessionProbe &&
              "La comprobación consulta la sesión: un HTTP 401 es esperado antes de iniciar sesión y confirma que el servicio responde. "}
            Estado de las consultas de esta pantalla; no representa la salud de
            todo el servidor.
          </p>
          {checks.map((c, i) => (
            <div key={c.path} className="service-result">
              <code>GET {c.path}</code>
              <span>
                {results[i]?.message || "Todavía no se ha consultado."}
              </span>
              {results[i]?.checkedAt && (
                <small>
                  Última comprobación:{" "}
                  {new Date(results[i].checkedAt).toLocaleTimeString("es-PE")}
                </small>
              )}
            </div>
          ))}
          <button
            className="btn btn--primary btn--sm"
            disabled={checking}
            onClick={check}
          >
            {checking ? "Comprobando…" : "Comprobar conexión"}
          </button>
          <p className="cell-muted">
            Si el navegador bloquea la respuesta, no puede distinguir entre
            CORS, red o servidor inaccesible. No se muestra “desconectado” sin
            evidencia.
          </p>
        </div>
      )}
    </div>
  );
}
