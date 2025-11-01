import React, { useState } from 'react';
import styled from 'styled-components';
import { useAuth } from '../../contexts/AuthContext';
import { authService } from '../../services/api';
import { LogOut, User, Ship, Key } from 'lucide-react';
import ChangePasswordModal from '../ChangePasswordModal';

const HeaderContainer = styled.header`
  background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%);
  color: white;
  padding: 1rem 2rem;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  display: flex;
  justify-content: space-between;
  align-items: center;
  
  @media (max-width: 768px) {
    padding: 1rem;
    position: relative;
  }
`;

const Logo = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1.5rem;
  font-weight: bold;
  
  @media (max-width: 768px) {
    font-size: 1.2rem;
    margin-left: 2rem; /* Espaço para o botão do menu */
  }
`;

const UserInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  
  @media (max-width: 768px) {
    gap: 0.5rem;
  }
`;

const UserDetails = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9rem;
  
  @media (max-width: 768px) {
    font-size: 0.8rem;
    display: none; /* Ocultar em mobile para economizar espaço */
  }
`;

const LogoutButton = styled.button`
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.3);
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.2s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.3);
    transform: translateY(-1px);
  }
  
  @media (max-width: 768px) {
    padding: 0.4rem 0.8rem;
    font-size: 0.8rem;
  }
`;

const ChangePasswordButton = styled.button`
  background: rgba(255, 255, 255, 0.15);
  border: 1px solid rgba(255, 255, 255, 0.25);
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.2s ease;
  margin-right: 0.5rem;

  &:hover {
    background: rgba(255, 255, 255, 0.25);
    transform: translateY(-1px);
  }
  
  @media (max-width: 768px) {
    padding: 0.4rem 0.8rem;
    font-size: 0.8rem;
  }
`;

const Header: React.FC = () => {
  const { usuario, logout } = useAuth();
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [changePasswordLoading, setChangePasswordLoading] = useState(false);

  const handleChangePassword = async (currentPassword: string, newPassword: string) => {
    setChangePasswordLoading(true);
    try {
      console.log('=== INICIANDO ALTERAÇÃO DE SENHA ===');
      console.log('Chamando authService.changePassword...');
      
      await authService.changePassword(currentPassword, newPassword);
      
      console.log('Senha alterada com sucesso!');
      console.log('=== ALTERAÇÃO CONCLUÍDA COM SUCESSO ===');
    } catch (error: any) {
      console.error('Erro ao alterar senha:', error);
      console.error('Erro completo:', JSON.stringify(error, null, 2));
      console.error('Response data:', error.response?.data);
      console.error('Response status:', error.response?.status);
      throw error;
    } finally {
      setChangePasswordLoading(false);
    }
  };

  return (
    <>
      <HeaderContainer>
        <Logo>
          <Ship size={28} />
          Sistema de Vistorias Náuticas
        </Logo>
        
        <UserInfo>
          <UserDetails>
            <User size={16} />
            <span>{usuario?.nome}</span>
          </UserDetails>
          
          <ChangePasswordButton onClick={() => setShowChangePasswordModal(true)}>
            <Key size={16} />
            Alterar Senha
          </ChangePasswordButton>
          
          <LogoutButton onClick={logout}>
            <LogOut size={16} />
            Sair
          </LogoutButton>
        </UserInfo>
      </HeaderContainer>

      <ChangePasswordModal
        isOpen={showChangePasswordModal}
        onClose={() => setShowChangePasswordModal(false)}
        onSubmit={handleChangePassword}
        loading={changePasswordLoading}
      />
    </>
  );
};

export default Header;


