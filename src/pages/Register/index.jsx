import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext.jsx';
import AuthAside from '../../components/AuthAside.jsx';

import { passwordError } from '../../utils/domain.js';

export default function Register() {
  const { register, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    email: '',
    password: '',
    confirmacion: '',
  });

  const [error, setError] = useState(null);
  const [enviando, setEnviando] = useState(false);

  if (isAuthenticated) return <Navigate to="/" replace />;

  const cambiar = (campo) => (event) => setForm({ ...form, [campo]: event.target.value });

  const enviar = async (event) => {
    event.preventDefault();
    setError(null);

    if (passwordError(form.password)) {
      setError(passwordError(form.password));
      return;
    }

    if (form.password !== form.confirmacion) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    setEnviando(true);

    try {
      await register({ email: form.email, password: form.password });

      navigate('/mi-perfil', { replace: true });
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
        lead="Crea tu acceso personal y completa tu ficha para consultar la información de tu unidad."
        points={[
          'Tu perfil conectado al padrón de residentes',
          'Historial de cuotas y pagos de tu unidad',
          'Consulta del estado de tus incidencias',
          'Consulta de tus reservas de áreas comunes',
        ]}
      />

      <section className="auth-panel">
        <form className="auth-form" onSubmit={enviar}>
          <h1>Crear cuenta</h1>
          <p>Completa tus datos para unirte a la plataforma.</p>

          <hr className="auth-sep" />

          {error ? (
            <div className="alert alert--error" style={{ marginBottom: 16 }} role="alert">
              {error}
            </div>
          ) : null}

          <div className="field">
            <label htmlFor="email-registro">Correo electrónico</label>
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

          <div className="alert alert--info" style={{ marginBottom: 16 }}>
            Crearás una cuenta de residente. Después completarás tus datos y tu unidad para aparecer
            en el padrón. Las cuentas de administración las habilita el responsable del condominio.
          </div>

          <div className="field">
            <label htmlFor="password-registro">Contraseña</label>
            <input
              id="password-registro"
              minLength={8}
              maxLength={72}
              className="input"
              type="password"
              autoComplete="new-password"
              placeholder="Mínimo 8 caracteres"
              value={form.password}
              onChange={cambiar('password')}
              required
            />
          </div>

          <div className="field">
            <label htmlFor="confirmacion">Repetir contraseña</label>
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
            ¿Ya tienes cuenta? <Link to="/login">Inicia sesión</Link>
          </p>
        </form>
      </section>
    </div>
  );
}
