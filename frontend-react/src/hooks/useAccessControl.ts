import { useAuth } from '../contexts/AuthContext';

export const useAccessControl = () => {
  const { usuario } = useAuth();

  const isAdmin = usuario?.nivelAcessoId === 1;
  const isVistoriador = usuario?.nivelAcessoId === 2;

  const canAccess = (requiredLevel: 'admin' | 'vistoriador' | 'all') => {
    if (requiredLevel === 'all') return true;
    if (requiredLevel === 'admin') return isAdmin;
    if (requiredLevel === 'vistoriador') return isVistoriador || isAdmin;
    return false;
  };

  const getVisibleMenuItems = () => {
    if (isAdmin) {
      return [
        { path: '/', label: 'Dashboard', icon: 'Home' },
        { path: '/embarcacoes', label: 'Embarcações', icon: 'Ship' },
        { path: '/locais', label: 'Locais', icon: 'MapPin' },
        { path: '/vistorias', label: 'Vistorias', icon: 'ClipboardCheck' },
        { path: '/fotos', label: 'Fotos', icon: 'Camera' },
        { path: '/laudos', label: 'Laudos', icon: 'FileText' },
        { path: '/usuarios', label: 'Gerenciar Usuários', icon: 'Ship' },
      ];
    } else if (isVistoriador) {
      return [
        { path: '/', label: 'Dashboard', icon: 'Home' },
        { path: '/vistorias', label: 'Vistorias', icon: 'ClipboardCheck' },
      ];
    }
    return [];
  };

  return {
    isAdmin,
    isVistoriador,
    canAccess,
    getVisibleMenuItems,
    userLevel: usuario?.nivelAcesso?.nome || 'DESCONHECIDO'
  };
};
