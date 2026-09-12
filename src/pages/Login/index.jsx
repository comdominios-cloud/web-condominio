import ServiceStatus from "../../components/ServiceStatus.jsx";
import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext.jsx";
import AuthAside from "../../components/AuthAside.jsx";

export default function Login() {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState(null);
  const [enviando, setEnviando] = useState(false);

  if (isAuthenticated) return <Navigate to="/" replace />;

  const cambiar = (campo) => (event) =>
    setForm({ ...form, [campo]: event.target.value });

  const enviar = async (event) => {
    event.preventDefault();
    setError(null);
    setEnviando(true);

    try {
      await login(form);
      navigate(location.state?.from || "/", { replace: true });
    } catch (err) {
      setError(err.message || "No se pudo iniciar sesión.");
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="auth">
      <AuthAside
        claim={["Administracion eficiente,", "vecinos tranquilos"]}
        lead="condominios.net centraliza residentes, cuotas, incidencias y reservas de tu comunidad en una sola plataforma."
        points={[
          "Directorio de residentes y unidades siempre actualizado",
          "Cuotas emitidas y pagos registrados en linea",
          "Incidencias y reservas con seguimiento transparente",
          "Tableros analiticos sobre la data historica",
        ]}
      />

      <section className="auth-panel">
        <form className="auth-form" onSubmit={enviar}>
          <h1>Iniciar sesión</h1>
          <p>Ingresa con la cuenta que registraste en tu condominio.</p>

          <hr className="auth-sep" />
          <ServiceStatus
            sessionProbe
            service="usuarios"
            checks={[{ path: "/auth/me" }]}
          />

          {error ? (
            <div
              className="alert alert--error"
              style={{ marginBottom: 16 }}
              role="alert"
            >
              {error}
            </div>
          ) : null}

          <div className="field">
            <label htmlFor="email">Correo electrónico</label>
            <input
              id="email"
              className="input"
              type="email"
              autoComplete="email"
              placeholder="tucorreo@condominio.com"
              value={form.email}
              onChange={cambiar("email")}
              required
            />
          </div>

          <div className="field">
            <label htmlFor="password">Contraseña</label>
            <input
              id="password"
              className="input"
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              value={form.password}
              onChange={cambiar("password")}
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn--primary btn--block"
            style={{ marginTop: 22 }}
            disabled={enviando}
          >
            {enviando ? <span className="spinner spinner--sm" /> : null}
            {enviando ? "Verificando..." : "Entrar"}
          </button>

          <p className="auth-switch">
            ¿No tienes cuenta? <Link to="/register">Regístrate aquí</Link>
          </p>
        </form>
      </section>
    </div>
  );
}
