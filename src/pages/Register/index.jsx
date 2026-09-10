import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext.jsx';
import AuthAside from '../../components/AuthAside.jsx';

const ROLES = ['Residente', 'Administrador', 'Propietario'];

export default function Register() {
  const { register, login, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    nombre: '',
    email: '',
    password: '',
    confirmacion: '',
    rol: 'Residente',
  });

  const [error, setError] = useState(null);
  const [aviso, setAviso] = useState(null);
  const [enviando, setEnviando] = useState(false);

  if (isAuthenticated) return <Navigate to="/" replace />;

  const cambiar = (campo) => (event) => setForm({ ...form, [campo]: event.target.value });

  const enviar = async (event) => {
    event.preventDefault();
    setError(null);
    setAviso(null);

    if (form.password.length < 6) {
      setError('La contrasena debe tener al menos 6 caracteres.');
      return;
    }

    if (form.password !== form.confirmacion) {
      setError('Las contrasenas no coinciden.');
      return;
    }

    setEnviando(true);

    try {
      await register({
        nombre: form.nombre,
        email: form.email,
        password: form.password,
        rol: form.rol,
      });

      try {
        await login({ email: form.email, password: form.password });
        navigate('/', { replace: true });
        return;
      } catch {
        setAviso('Cuenta creada correctamente. Ya puedes iniciar sesion.');
      }
    } catch (err) {
      setError(err.message || 'No se pudo crear la cuenta.');
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="auth">
      <AuthAside
        claim={['Crea tu cuenta', 'y toma el control']}
        lead="Registra tu usuario para acceder al panel de administracion de tu condominio y consultar toda la informacion en linea."
        points={[
          'Acceso inmediato al panel del condominio',
          'Historial de cuotas y pagos de tu unidad',
          'Reporte de incidencias en pocos clics',
          'Reserva de areas comunes desde cualquier lugar',
        ]}
      />

      <section className="auth-panel">
        <form className="auth-form" onSubmit={enviar} noValidate>
          <h1>Crear cuenta</h1>
          <p>Completa tus datos para unirte a la plataforma.</p>

          <hr className="auth-sep" />

          {error ? (
            <div className="alert alert--error" style={{ marginBottom: 16 }} role="alert">
              {error}
            </div>
          ) : null}

          {aviso ? (
            <div className="alert alert--success" style={{ marginBottom: 16 }}>
              {aviso}
            </div>
          ) : null}

          <div className="field">
            <label htmlFor="nombre">Nombre completo</label>
            <input
              id="nombre"
              className="input"
              type="text"
              autoComplete="name"
              placeholder="Ana Torres Vega"
              value={form.nombre}
              onChange={cambiar('nombre')}
              required
            />
          </div>

          <div className="field">
            <label htmlFor="email-registro">Correo electronico</label>
            <input
              id="email-registro"
              className="input"
              type="email"
              autoComplete="email"
              placeholder="tucorreo@condominio.com"
              value={form.email}
              onChange={cambiar('email')}
              required
            />
          </div>

          <div className="field">
            <label htmlFor="rol">Perfil</label>
            <select id="rol" className="input" value={form.rol} onChange={cambiar('rol')}>
              {ROLES.map((rol) => (
                <option key={rol} value={rol}>
                  {rol}
                </option>
              ))}
            </select>
          </div>

          <div className="field">
            <label htmlFor="password-registro">Contrasena</label>
            <input
              id="password-registro"
              className="input"
              type="password"
              autoComplete="new-password"
              placeholder="Minimo 6 caracteres"
              value={form.password}
              onChange={cambiar('password')}
              required
            />
          </div>

          <div className="field">
            <label htmlFor="confirmacion">Repetir contrasena</label>
            <input
              id="confirmacion"
              className="input"
              type="password"
              autoComplete="new-password"
              placeholder="••••••••"
              value={form.confirmacion}
              onChange={cambiar('confirmacion')}
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
            {enviando ? 'Creando cuenta...' : 'Crear cuenta'}
          </button>

          <p className="auth-switch">
            ¿Ya tienes cuenta? <Link to="/login">Inicia sesion</Link>
          </p>
        </form>
      </section>
    </div>
  );
}
