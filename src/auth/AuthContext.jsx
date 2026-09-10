import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { TOKEN_STORAGE_KEY, USER_STORAGE_KEY } from '../api/config.js';
import { iniciarSesion, registrar } from '../api/usuarios.js';

const AuthContext = createContext(null);

function readStored(key) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeStored(key, value) {
  try {
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, value);
  } catch {
    return;
  }
}

function extractToken(payload) {
  if (!payload) return null;

  if (typeof payload === 'string') return payload;

  const direct =
    payload.token ||
    payload.access_token ||
    payload.accessToken ||
    payload.jwt ||
    payload.id_token;

  if (typeof direct === 'string') return direct;

  if (payload.data) return extractToken(payload.data);

  return null;
}

function extractUser(payload, fallbackEmail) {
  const source =
    (payload && (payload.user || payload.usuario || payload.data?.user)) || payload || {};

  const email = source.email || source.correo || fallbackEmail || '';
  const nombre = source.nombre || source.name || source.nombres || email.split('@')[0] || 'Usuario';
  const rol = source.rol || source.role || source.perfil || 'Residente';

  return { email, nombre, rol };
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => readStored(TOKEN_STORAGE_KEY));

  const [user, setUser] = useState(() => {
    const raw = readStored(USER_STORAGE_KEY);

    if (!raw) return null;

    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  });

  const persist = useCallback((nextToken, nextUser) => {
    setToken(nextToken);
    setUser(nextUser);
    writeStored(TOKEN_STORAGE_KEY, nextToken);
    writeStored(USER_STORAGE_KEY, nextUser ? JSON.stringify(nextUser) : null);
  }, []);

  const login = useCallback(
    async (credenciales) => {
      const payload = await iniciarSesion(credenciales);
      const nextToken = extractToken(payload);
      const nextUser = extractUser(payload, credenciales.email);

      if (!nextToken) {
        throw new Error('El servicio de usuarios no devolvio un token de sesion.');
      }

      persist(nextToken, nextUser);

      return nextUser;
    },
    [persist]
  );

  const register = useCallback((datos) => registrar(datos), []);

  const logout = useCallback(() => persist(null, null), [persist]);

  const value = useMemo(
    () => ({ token, user, isAuthenticated: Boolean(token), login, register, logout }),
    [token, user, login, register, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth debe usarse dentro de AuthProvider.');
  }

  return context;
}
