import PageConnections from './PageConnections.jsx';
import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext.jsx';
import { isApiConfigured } from '../api/config.js';
import { initials } from '../utils/format.js';
import { isAdmin, isOwner, residenceLabel } from '../utils/domain.js';
import { useResident } from '../auth/ResidentContext.jsx';
import { fullName } from '../utils/domain.js';
import Brand from './Brand.jsx';
import {
  IconAlert,
  IconCalendar,
  IconChart,
  IconDashboard,
  IconLogout,
  IconMenu,
  IconMoney,
  IconUsers,
} from './Icons.jsx';

const NAV_GROUPS = [
  {
    label: 'Gestión',
    items: [
      { to: '/', label: 'Dashboard', icon: <IconDashboard />, end: true },
      { to: '/residentes', label: 'Residentes', icon: <IconUsers /> },
      { to: '/pagos', label: 'Cuotas y pagos', icon: <IconMoney /> },
    ],
  },
  {
    label: 'Comunidad',
    items: [
      { to: '/incidencias', label: 'Incidencias', icon: <IconAlert /> },
      { to: '/reservas', label: 'Áreas comunes', icon: <IconCalendar /> },
    ],
  },
  {
    label: 'Inteligencia',
    items: [{ to: '/analitica', label: 'Analítica', icon: <IconChart /> }],
  },
];

const TITLES = {
  '/': ['Panel general', 'Resumen operativo del condominio'],
  '/residentes': ['Residentes', 'Directorio de residentes y unidades'],
  '/pagos': ['Cuotas y pagos', 'Emision de cuotas y pagos registrados'],
  '/incidencias': ['Incidencias', 'Reportes y seguimiento de la comunidad'],
  '/reservas': ['Áreas comunes', 'Reservas de espacios compartidos'],
  '/analitica': ['Analítica', 'Indicadores calculados sobre Athena'],
};

function currentTitle(pathname) {
  if (pathname.startsWith('/residentes/') && pathname !== '/residentes') {
    return ['Ficha del residente', 'Vista consolidada del residente y su unidad'];
  }

  return TITLES[pathname] || ['condominios.net', 'Administracion del condominio'];
}

export default function Layout() {
  const { user, logout } = useAuth();
  const admin = isAdmin(user);
  const profile = useResident();
  const owner = isOwner(profile.data);
  const displayName = profile.data ? fullName(profile.data) : user?.nombre || user?.email;
  const groups = admin
    ? NAV_GROUPS
    : [
        {
          label: owner ? 'Mi propiedad' : 'Mi hogar',
          items: [
            { to: '/', label: 'Mi resumen', icon: <IconDashboard />, end: true },
            { to: '/mi-perfil', label: 'Mi perfil', icon: <IconUsers /> },
            ...(owner ? [{ to: '/mi-unidad', label: 'Mi unidad', icon: <IconDashboard /> }] : []),
            { to: '/pagos', label: 'Mis cuotas y pagos', icon: <IconMoney /> },
            { to: '/incidencias', label: 'Mis incidencias', icon: <IconAlert /> },
            { to: '/reservas', label: 'Mis reservas', icon: <IconCalendar /> },
          ],
        },
      ];
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  const [title, subtitle] = admin
    ? currentTitle(location.pathname)
    : [
        groups[0].items.find((i) => i.to === location.pathname)?.label || 'Mi hogar',
        'Tu información personal y tu unidad',
      ];

  const salir = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="app-shell">
      {open ? <div className="sidebar-backdrop" onClick={() => setOpen(false)} /> : null}

      <aside className={open ? 'sidebar is-open' : 'sidebar'}>
        <div className="sidebar-brand">
          <Brand size={32} />
        </div>

        <nav className="sidebar-nav">
          {groups.map((group) => (
            <div key={group.label}>
              <div className="sidebar-label">{group.label}</div>
              {group.items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) => (isActive ? 'nav-item is-active' : 'nav-item')}
                >
                  {item.icon}
                  {item.label}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        <div className="sidebar-footer">
          <button type="button" className="btn btn--ghost btn--sm btn--block" onClick={salir}>
            <IconLogout />
            Cerrar sesión
          </button>
        </div>
      </aside>

      <div className="main-area">
        <header className="topbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button
              type="button"
              className="mobile-toggle"
              onClick={() => setOpen((value) => !value)}
              aria-label="Abrir menú"
            >
              <IconMenu />
            </button>
            <div>
              <div className="topbar-title">{title}</div>
              <div className="topbar-sub">{subtitle}</div>
            </div>
          </div>

          <div className="topbar-right">
            <div style={{ textAlign: 'right', lineHeight: 1.3 }}>
              <div style={{ fontWeight: 700, color: 'var(--ink)', fontSize: 14 }}>
                {displayName || 'Usuario'}
              </div>
              <div style={{ fontSize: 12.5, color: 'var(--muted)' }}>
                {admin ? 'Administrador' : residenceLabel(profile.data)}
              </div>
            </div>
            <span className="avatar">{initials(displayName)}</span>
          </div>
        </header>

        {isApiConfigured() ? null : (
          <div style={{ padding: '16px 32px 0' }}>
            <div className="alert alert--info">
              Falta definir <strong style={{ margin: '0 4px' }}>VITE_API_BASE_URL</strong> con la
              URL del balanceador. Configurala en el archivo <code>.env</code> o en las variables de
              entorno de AWS Amplify para que la SPA consuma los microservicios.
            </div>
          </div>
        )}

        <PageConnections />
        <Outlet />

        <div style={{ flex: 1 }} />
      </div>
    </div>
  );
}
