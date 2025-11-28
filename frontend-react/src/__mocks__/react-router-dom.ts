// Mock para react-router-dom usado nos testes
import React from 'react';

export const mockNavigate = jest.fn();
export const mockUseParams = jest.fn(() => ({}));

export const BrowserRouter = ({ children }: { children: React.ReactNode }) => (
  <div data-testid="browser-router">{children}</div>
);

export const Routes = ({ children }: { children: React.ReactNode }) => (
  <div data-testid="routes">{children}</div>
);

export const Route = ({ children }: { children: React.ReactNode }) => (
  <div data-testid="route">{children}</div>
);

export const Navigate = ({ to }: { to: string }) => (
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

export const Link = ({ to, children }: { to: string; children: React.ReactNode }) => (
  <a href={to}>{children}</a>
);

export const NavLink = ({ to, children }: { to: string; children: React.ReactNode }) => (
  <a href={to}>{children}</a>
);

export const Outlet = () => <div data-testid="outlet" />;

