import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext.jsx';
import { isAdmin } from '../utils/domain.js';
import { Loading, ErrorState } from './States.jsx';

export default function ProtectedRoute({ children, adminOnly = false }) {
  const { user, isAuthenticated, checking, sessionError, retrySession, logout } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (checking) return <Loading label="Validando tu sesión…" />;
  if (sessionError)
    return (
      <div className="page">
        <ErrorState error={sessionError} onRetry={retrySession} />
        <button className="btn btn--ghost" onClick={logout}>
          Cerrar sesión
        </button>
      </div>
    );
  if (adminOnly && !isAdmin(user)) return <Navigate to="/" replace />;

  return children;
}
