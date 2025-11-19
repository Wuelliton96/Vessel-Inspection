import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { useAccessControl } from './hooks/useAccessControl';
import Layout from './components/Layout/Layout';
import Login from './pages/Login';
import PasswordUpdate from './pages/PasswordUpdate';
import Dashboard from './pages/Dashboard';
import Usuarios from './pages/Usuarios';
import Embarcacoes from './pages/Embarcacoes';
import Locais from './pages/Locais';
import Vistorias from './pages/Vistorias';
import NovaVistoria from './pages/NovaVistoria';
import VistoriadorVistoria from './pages/VistoriadorVistoria';
import PagamentosVistoriadores from './pages/PagamentosVistoriadores';
import Seguradoras from './pages/Seguradoras';
import Clientes from './pages/Clientes';
import ChecklistTemplates from './pages/ChecklistTemplates';
import FotosVistoria from './pages/FotosVistoria';
import Fotos from './pages/Fotos';
import Laudos from './pages/Laudos';
import LaudoForm from './pages/LaudoForm';
import AuditoriaLogs from './pages/AuditoriaLogs';

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
    <AuthProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
}

export default App;
