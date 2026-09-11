import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './auth/AuthContext.jsx';
import Layout from './components/Layout.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import Login from './pages/Login/index.jsx';
import Register from './pages/Register/index.jsx';
import Dashboard from './pages/Dashboard/index.jsx';
import Residentes from './pages/Residentes/index.jsx';
import FichaResidente from './pages/Residentes/Ficha.jsx';
import Pagos from './pages/Pagos/EstadoCuenta.jsx';
import Personal from './pages/Dashboard/Personal.jsx';
import MiPerfil from './pages/Residentes/MiPerfil.jsx';
import MiActividad from './pages/Residentes/MiActividad.jsx';
import { ResidentProvider } from './auth/ResidentContext.jsx';
import { useAuth } from './auth/AuthContext.jsx';
import { isAdmin } from './utils/domain.js';

function RolePage({ admin, resident }) {
  const { user } = useAuth();
  return isAdmin(user) ? admin : resident;
}
import Incidencias from './pages/Incidencias/index.jsx';
import Reservas from './pages/Reservas/index.jsx';
import Analitica from './pages/Analitica/index.jsx';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          <Route
            element={
              <ProtectedRoute>
                <ResidentProvider>
                  <Layout />
                </ResidentProvider>
              </ProtectedRoute>
            }
          >
            <Route path="/" element={<RolePage admin={<Dashboard />} resident={<Personal />} />} />
            <Route
              path="/residentes"
              element={
                <ProtectedRoute adminOnly>
                  <Residentes />
                </ProtectedRoute>
              }
            />
            <Route
              path="/residentes/:id"
              element={
                <ProtectedRoute adminOnly>
                  <FichaResidente />
                </ProtectedRoute>
              }
            />
            <Route
              path="/mi-perfil"
              element={<RolePage admin={<Navigate to="/" replace />} resident={<MiPerfil />} />}
            />
            <Route path="/pagos" element={<Pagos />} />
            <Route
              path="/incidencias"
              element={
                <RolePage admin={<Incidencias />} resident={<MiActividad kind="incidencias" />} />
              }
            />
            <Route
              path="/reservas"
              element={<RolePage admin={<Reservas />} resident={<MiActividad kind="reservas" />} />}
            />
            <Route
              path="/analitica"
              element={
                <ProtectedRoute adminOnly>
                  <Analitica />
                </ProtectedRoute>
              }
            />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
