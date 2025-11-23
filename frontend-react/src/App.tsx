import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { useAccessControl } from './hooks/useAccessControl';
import { queryClient } from './config/queryClient';
import Layout from './components/Layout/Layout';
import Login from './pages/Login';
import PasswordUpdate from './pages/PasswordUpdate';

// Lazy loading de componentes para melhor performance
const Dashboard = React.lazy(() => import('./pages/Dashboard'));
const Usuarios = React.lazy(() => import('./pages/Usuarios'));
const Embarcacoes = React.lazy(() => import('./pages/Embarcacoes'));
const Locais = React.lazy(() => import('./pages/Locais'));
const Vistorias = React.lazy(() => import('./pages/Vistorias'));
const NovaVistoria = React.lazy(() => import('./pages/NovaVistoria'));
const VistoriadorVistoria = React.lazy(() => import('./pages/VistoriadorVistoria'));
const PagamentosVistoriadores = React.lazy(() => import('./pages/PagamentosVistoriadores'));
const Seguradoras = React.lazy(() => import('./pages/Seguradoras'));
const Clientes = React.lazy(() => import('./pages/Clientes'));
const ChecklistTemplates = React.lazy(() => import('./pages/ChecklistTemplates'));
const FotosVistoria = React.lazy(() => import('./pages/FotosVistoria'));
const Fotos = React.lazy(() => import('./pages/Fotos'));
const Laudos = React.lazy(() => import('./pages/Laudos'));
const LaudoForm = React.lazy(() => import('./pages/LaudoForm'));
const AuditoriaLogs = React.lazy(() => import('./pages/AuditoriaLogs'));

// Componente de loading para Suspense
const LoadingFallback: React.FC = () => (
  <div style={{ 
    display: 'flex', 
    justifyContent: 'center', 
    alignItems: 'center', 
    height: '100vh',
    flexDirection: 'column',
    gap: '1rem',
    color: '#6b7280'
  }}>
    <div style={{ 
      width: '40px', 
      height: '40px', 
      border: '4px solid #e5e7eb',
      borderTop: '4px solid #3b82f6',
      borderRadius: '50%',
      animation: 'spin 1s linear infinite'
    }} />
    <p>Carregando...</p>
    <style>{`
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `}</style>
  </div>
);

const AppRoutes: React.FC = () => {
  const { isAuthenticated, usuario } = useAuth();
  const { canAccess } = useAccessControl();
  const location = useLocation();

  // Se estiver autenticado e precisar atualizar senha, redirecionar para página de atualização
  // A página de atualização deve ser renderizada SEM o Layout (standalone)
  if (isAuthenticated && usuario && usuario.deveAtualizarSenha === true && location.pathname === '/password-update') {
    return (
      <Routes>
        <Route path="/password-update" element={<PasswordUpdate />} />
        <Route path="*" element={<Navigate to="/password-update" replace />} />
      </Routes>
    );
  }

  // Se estiver autenticado e precisar atualizar senha mas não estiver na rota, redirecionar
  if (isAuthenticated && usuario && usuario.deveAtualizarSenha === true && location.pathname !== '/password-update') {
    return <Navigate to="/password-update" replace />;
  }

  if (isAuthenticated) {
    return (
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
                   <Route
                     path="/embarcacoes"
                     element={
                       canAccess('admin') ?
                         <Embarcacoes /> :
                         <Navigate to="/" replace />
                     }
                   />
                   <Route
                     path="/locais"
                     element={
                       canAccess('admin') ?
                         <Locais /> :
                         <Navigate to="/" replace />
                     }
                   />
                 <Route path="/vistorias" element={<Vistorias />} />
                 <Route 
                   path="/vistorias/nova" 
                   element={
                     canAccess('admin') ? 
                       <NovaVistoria /> : 
                       <Navigate to="/vistorias" replace />
                   } 
                 />
                 <Route path="/vistoria/:id" element={<VistoriadorVistoria />} />
          <Route 
            path="/fotos" 
            element={
              canAccess('admin') ? 
                <Fotos /> : 
                <Navigate to="/" replace />
            } 
          />
          <Route 
            path="/laudos" 
            element={
              canAccess('admin') ? 
                <Laudos /> : 
                <Navigate to="/" replace />
            } 
          />
          <Route 
            path="/laudos/:id/editar" 
            element={
              canAccess('admin') ? 
                <LaudoForm /> : 
                <Navigate to="/" replace />
            } 
          />
          <Route 
            path="/vistorias/:vistoriaId/laudo/novo" 
            element={
              canAccess('admin') ? 
                <LaudoForm /> : 
                <Navigate to="/" replace />
            } 
          />
          <Route 
            path="/usuarios" 
            element={
              canAccess('admin') ? 
                <Usuarios /> : 
                <Navigate to="/" replace />
            } 
          />
          <Route 
            path="/pagamentos" 
            element={
              canAccess('admin') ? 
                <PagamentosVistoriadores /> : 
                <Navigate to="/" replace />
            } 
          />
          <Route 
            path="/seguradoras" 
            element={
              canAccess('admin') ? 
                <Seguradoras /> : 
                <Navigate to="/" replace />
            } 
          />
          <Route 
            path="/clientes" 
            element={
              canAccess('admin') ? 
                <Clientes /> : 
                <Navigate to="/" replace />
            } 
          />
          <Route 
            path="/checklists" 
            element={
              canAccess('admin') ? 
                <ChecklistTemplates /> : 
                <Navigate to="/" replace />
            } 
          />
          <Route 
            path="/vistoria/:id/fotos" 
            element={
              canAccess('admin') ? 
                <FotosVistoria /> : 
                <Navigate to="/" replace />
            } 
          />
          <Route 
            path="/auditoria" 
            element={
              usuario?.id === 1 ? 
                <AuditoriaLogs /> : 
                <Navigate to="/" replace />
            } 
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/password-update" element={<PasswordUpdate />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
};

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <Suspense fallback={<LoadingFallback />}>
            <AppRoutes />
          </Suspense>
        </Router>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
