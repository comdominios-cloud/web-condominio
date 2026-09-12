import { clearConnections } from '../api/connectionStatus.js';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { TOKEN_STORAGE_KEY, USER_STORAGE_KEY } from '../api/config.js';
import { iniciarSesion, registrar, miCuenta } from '../api/usuarios.js';

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

  if (typeof payload === 'string') return null;

  const direct =
    payload.token || payload.access_token || payload.accessToken || payload.jwt || payload.id_token;

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

  return { id: source.id, residente_id: source.residente_id ?? null, email, nombre, rol };
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

  const [checking, setChecking] = useState(() => Boolean(readStored(TOKEN_STORAGE_KEY)));
  const [sessionError, setSessionError] = useState(null);
  const [sessionAttempt, setSessionAttempt] = useState(0);
  useEffect(() => {
    if (!token) {
      setChecking(false);
      return;
    }
    let active = true;
    setChecking(true);
    setSessionError(null);
    miCuenta()
      .then((payload) => {
        if (!active) return;
        const next = extractUser(payload);
        setUser(next);
        writeStored(USER_STORAGE_KEY, JSON.stringify(next));
      })
      .catch((error) => {
        if (!active) return;
        if (error.status === 401 || error.status === 403) {
          setToken(null);
          setUser(null);
          writeStored(TOKEN_STORAGE_KEY, null);
          writeStored(USER_STORAGE_KEY, null);
        } else setSessionError(error);
      })
      .finally(() => {
        if (active) setChecking(false);
      });
    return () => {
      active = false;
    };
  }, [token, sessionAttempt]);

  const persist = useCallback((nextToken, nextUser) => {
    clearConnections();
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
    [persist],
  );

  const register = useCallback(
    async (datos) => {
      const payload = await registrar(datos);
      const nextToken = extractToken(payload);
      if (!nextToken)
        throw new Error(
          'La cuenta pudo haberse creado, pero no se recibió una sesión válida. Intenta iniciar sesión.',
        );
      const nextUser = extractUser(payload, datos.email);
      persist(nextToken, nextUser);
      return nextUser;
    },
    [persist],
  );

  const logout = useCallback(() => persist(null, null), [persist]);

  const value = useMemo(
    () => ({
      token,
      user,
      isAuthenticated: Boolean(token),
      checking,
      sessionError,
      retrySession: () => setSessionAttempt((v) => v + 1),
      login,
      register,
      logout,
    }),
    [token, user, checking, sessionError, login, register, logout],
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
