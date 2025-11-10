import React from 'react';
import styled from 'styled-components';
import { NavLink } from 'react-router-dom';
import { 
  Home, 
  Ship, 
  MapPin, 
  ClipboardCheck, 
  FileText, 
  Camera,
  Users,
  DollarSign,
  Shield,
  UserCheck
} from 'lucide-react';
import { useAccessControl } from '../../hooks/useAccessControl';

const SidebarContainer = styled.aside`
  width: 250px;
  background: #f8fafc;
  border-right: 1px solid #e2e8f0;
  height: calc(100vh - 80px);
  overflow-y: auto;
  
  @media (max-width: 768px) {
    width: 100%;
    height: auto;
    position: fixed;
    top: 80px;
    left: 0;
    z-index: 1000;
    transform: translateX(-100%);
    transition: transform 0.3s ease;
    
    &.open {
      transform: translateX(0);
    }
  }
`;

const Nav = styled.nav`
  padding: 1rem 0;
`;

const NavItem = styled(NavLink)`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1.5rem;
  color: #64748b;
  text-decoration: none;
  transition: all 0.2s ease;
  border-left: 3px solid transparent;

  &:hover {
    background: #f1f5f9;
    color: #1e40af;
  }

  &.active {
    background: #dbeafe;
    color: #1e40af;
    border-left-color: #3b82f6;
    font-weight: 600;
  }
  
  @media (max-width: 768px) {
    padding: 1rem 1.5rem;
    font-size: 1.1rem;
  }
`;

const NavIcon = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  
  @media (max-width: 768px) {
    width: 24px;
    height: 24px;
  }
`;

const MobileMenuButton = styled.button`
  display: none;
  
  @media (max-width: 768px) {
    display: block;
    position: fixed;
    top: 20px;
    left: 20px;
    z-index: 1001;
    background: rgba(255, 255, 255, 0.9);
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    padding: 0.5rem;
    cursor: pointer;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }
`;

const Sidebar: React.FC = () => {
  const { getVisibleMenuItems } = useAccessControl();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  
  const visibleItems = getVisibleMenuItems();
  
  const iconMap = {
    Home,
    Ship,
    MapPin,
    ClipboardCheck,
    Camera,
    FileText,
    Users,
    DollarSign,
    Shield,
    UserCheck
  };

  return (
    <>
      <MobileMenuButton onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
        ☰
      </MobileMenuButton>
      
      <SidebarContainer className={isMobileMenuOpen ? 'open' : ''}>
        <Nav>
          {visibleItems.map((item) => {
            const IconComponent = iconMap[item.icon as keyof typeof iconMap];
            return (
              <NavItem 
                key={item.path} 
                to={item.path} 
                end={item.path === '/'}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <NavIcon>
                  <IconComponent size={20} />
                </NavIcon>
                {item.label}
              </NavItem>
            );
          })}
        </Nav>
      </SidebarContainer>
    </>
  );
};

export default Sidebar;


