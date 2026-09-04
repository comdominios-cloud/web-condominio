/**
 * Punto de entrada de web-condominio.
 *
 * ANDAMIAJE: solo monta la aplicacion React.
 * Rutas, paginas y llamadas a las APIs se implementan mas adelante.
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
