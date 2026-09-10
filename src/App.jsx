import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './auth/AuthContext.jsx';
import Layout from './components/Layout.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import Login from './pages/Login/index.jsx';
import Register from './pages/Register/index.jsx';
import Dashboard from './pages/Dashboard/index.jsx';
import Residentes from './pages/Residentes/index.jsx';
import FichaResidente from './pages/Residentes/Ficha.jsx';
import Pagos from './pages/Pagos/index.jsx';
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
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route path="/" element={<Dashboard />} />
            <Route path="/residentes" element={<Residentes />} />
            <Route path="/residentes/:id" element={<FichaResidente />} />
            <Route path="/pagos" element={<Pagos />} />
            <Route path="/incidencias" element={<Incidencias />} />
            <Route path="/reservas" element={<Reservas />} />
            <Route path="/analitica" element={<Analitica />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
