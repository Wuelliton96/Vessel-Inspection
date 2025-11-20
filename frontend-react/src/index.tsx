// IMPORTANTE: Desabilitar logs em produção ANTES de qualquer outra importação
import './utils/disableConsoleInProduction';

import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { logNetworkInfo } from './config/network';

// Exibir informacoes de rede ao inicializar (apenas em desenvolvimento)
if (process.env.NODE_ENV === 'development') {
  logNetworkInfo().catch(() => {
    // Erro silencioso
  });
}

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

reportWebVitals();
