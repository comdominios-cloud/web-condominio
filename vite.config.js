import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

const PUERTOS = {
  residentes: 'VITE_PORT_RESIDENTES',
  pagos: 'VITE_PORT_PAGOS',
  incidencias: 'VITE_PORT_INCIDENCIAS',
  ficha: 'VITE_PORT_FICHA',
  analitico: 'VITE_PORT_ANALITICO',
  usuarios: 'VITE_PORT_USUARIOS',
};

const POR_DEFECTO = {
  residentes: '9001',
  pagos: '9002',
  incidencias: '9003',
  ficha: '9004',
  analitico: '9005',
  usuarios: '9006',
};

// Replica en desarrollo el mismo proxy que hacen los rewrites de Amplify,
// para que el codigo se comporte igual en los dos entornos.
function proxyDeServicios(env) {
  const base = (env.VITE_API_BASE_URL || 'http://localhost').replace(/\/+$/, '');

  return Object.fromEntries(
    Object.entries(PUERTOS).map(([servicio, variable]) => {
      const puerto = env[variable] || POR_DEFECTO[servicio];

      return [
        `/api/${servicio}`,
        {
          target: `${base}:${puerto}`,
          changeOrigin: true,
          rewrite: (ruta) => ruta.replace(new RegExp(`^/api/${servicio}`), ''),
        },
      ];
    })
  );
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [react()],
    server: {
      port: 5173,
      host: true,
      proxy: proxyDeServicios(env),
    },
    build: {
      outDir: 'dist',
    },
  };
});
