import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { useAccessControl } from './hooks/useAccessControl';
import Layout from './components/Layout/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Usuarios from './pages/Usuarios';
import Embarcacoes from './pages/Embarcacoes';
import Locais from './pages/Locais';
import Vistorias from './pages/Vistorias';
import VistoriadorVistoria from './pages/VistoriadorVistoria';
import PagamentosVistoriadores from './pages/PagamentosVistoriadores';
import Seguradoras from './pages/Seguradoras';
import Clientes from './pages/Clientes';
import ChecklistTemplates from './pages/ChecklistTemplates';
import FotosVistoria from './pages/FotosVistoria';
import Fotos from './pages/Fotos';
import PasswordUpdateModal from './components/PasswordUpdateModal';

const AppRoutes: React.FC = () => {
  const { isAuthenticated, usuario, token, updatePassword, logout } = useAuth();
  const { canAccess } = useAccessControl();
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordUpdateLoading, setPasswordUpdateLoading] = useState(false);

  useEffect(() => {
    // Verificar se o usuário precisa atualizar a senha
    console.log('=== DEBUG MODAL SENHA ===');
    console.log('isAuthenticated:', isAuthenticated);
    console.log('usuario:', usuario);
    console.log('deveAtualizarSenha:', usuario?.deveAtualizarSenha);
    console.log('Tipo do campo:', typeof usuario?.deveAtualizarSenha);
    
    if (isAuthenticated && usuario && usuario.deveAtualizarSenha === true) {
      console.log('Usuário deve atualizar senha, mostrando modal');
      setShowPasswordModal(true);
    } else {
      console.log('Usuário NÃO precisa atualizar senha');
      setShowPasswordModal(false);
    }
    console.log('=== FIM DEBUG ===');
  }, [isAuthenticated, usuario]);

  const handlePasswordUpdate = async (novaSenha: string) => {
    if (!token) return;
    
    setPasswordUpdateLoading(true);
    try {
      await updatePassword(token, novaSenha);
      setShowPasswordModal(false);
    } catch (error) {
      console.error('Erro ao atualizar senha:', error);
      throw error;
    } finally {
      setPasswordUpdateLoading(false);
    }
  };

  const handleCloseModal = () => {
    // Quando o usuário clica em "Sair", faz logout
    logout();
  };

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
                <div>Laudos (em desenvolvimento)</div> : 
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
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        
        <PasswordUpdateModal
          isOpen={showPasswordModal}
          onClose={handleCloseModal}
          onSubmit={handlePasswordUpdate}
          loading={passwordUpdateLoading}
        />
      </Layout>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
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
