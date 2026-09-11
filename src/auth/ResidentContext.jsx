import { createContext, useContext } from 'react';
import { useAuth } from './AuthContext.jsx';
import { listarResidentes, obtenerResidente } from '../api/residentes.js';
import { useApi } from '../hooks/useApi.js';
import { isAdmin, selectResident } from '../utils/domain.js';

const ResidentContext = createContext(null);

export function ResidentProvider({ children }) {
  const { user } = useAuth();
  const state = useApi(
    async () => {
      if (user.residente_id != null) return obtenerResidente(user.residente_id);
      // Current accounts API has no endpoint to attach an existing account to a resident.
      // Fall back only to a unique exact email, never to a name, unit or first row.
      const resident = selectResident(await listarResidentes(), user);
      return resident ? obtenerResidente(resident.id) : null;
    },
    [user?.id, user?.email, user?.residente_id],
    { enabled: Boolean(user) && !isAdmin(user) },
  );
  return <ResidentContext.Provider value={state}>{children}</ResidentContext.Provider>;
}

export const useResident = () => useContext(ResidentContext);
