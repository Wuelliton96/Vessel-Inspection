import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { logNetworkInfo } from './config/network';

// Exibir informacoes de rede ao inicializar
logNetworkInfo().catch(err => console.error('[NETWORK] Erro ao carregar info:', err));

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

reportWebVitals();
