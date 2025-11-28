// Mock para react-router-dom usado nos testes
import React from 'react';

export const mockNavigate = jest.fn();
export const mockUseParams = jest.fn(() => ({ vistoriaId: '1', id: undefined }));

export const BrowserRouter: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div data-testid="browser-router">{children}</div>
);

export const Routes: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div data-testid="routes">{children}</div>
);

export const Route: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div data-testid="route">{children}</div>
);

export const Navigate: React.FC<{ to: string }> = ({ to }) => (
  <div data-testid="navigate">Navigate to {to}</div>
);

export const useNavigate = () => mockNavigate;

export const useParams = () => mockUseParams();

export const useLocation = () => ({
  pathname: '/',
  search: '',
  hash: '',
  state: null,
  key: 'default'
});

export const Link: React.FC<{ to: string; children: React.ReactNode }> = ({ to, children }) => (
  <a href={to}>{children}</a>
);

export const NavLink: React.FC<{ to: string; children: React.ReactNode }> = ({ to, children }) => (
  <a href={to}>{children}</a>
);

export const Outlet: React.FC = () => <div data-testid="outlet" />;

