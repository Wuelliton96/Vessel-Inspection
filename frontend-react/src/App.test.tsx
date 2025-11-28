import React from 'react';

// Mock react-router-dom
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  BrowserRouter: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Routes: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Route: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Navigate: ({ to }: { to: string }) => <div>Navigate to {to}</div>,
  useLocation: () => ({ pathname: '/', search: '', hash: '', state: null, key: 'default' }),
  useNavigate: () => mockNavigate,
  Link: ({ to, children }: { to: string; children: React.ReactNode }) => <a href={to}>{children}</a>,
  NavLink: ({ to, children }: { to: string; children: React.ReactNode }) => <a href={to}>{children}</a>,
  Outlet: () => <div />,
}));

// Mock styled-components
jest.mock('styled-components', () => {
  const actual = jest.requireActual('styled-components');
  return {
    ...actual,
    default: (tag: any) => (strings: TemplateStringsArray, ...values: any[]) => {
      const StyledComponent = ({ children, ...props }: any) => {
        const Component = typeof tag === 'string' ? tag : tag;
        return React.createElement(Component, props, children);
      };
      StyledComponent.displayName = `styled.${typeof tag === 'string' ? tag : 'Component'}`;
      return StyledComponent;
    },
  };
});

// Mock dos outros módulos necessários
jest.mock('./contexts/AuthContext', () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  useAuth: () => ({ user: null, login: jest.fn(), logout: jest.fn(), isAuthenticated: false }),
}));

jest.mock('./hooks/useAccessControl', () => ({
  useAccessControl: () => ({ isAdmin: false, isVistoriador: false }),
}));

jest.mock('./config/queryClient', () => ({
  queryClient: {
    invalidateQueries: jest.fn(),
    setQueryData: jest.fn(),
  },
}));

jest.mock('@tanstack/react-query', () => ({
  QueryClientProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  QueryClient: jest.fn(() => ({
    invalidateQueries: jest.fn(),
    setQueryData: jest.fn(),
  })),
}));

jest.mock('./components/Layout/Layout', () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

jest.mock('./pages/Login', () => ({
  __esModule: true,
  default: () => <div>Login</div>,
}));

jest.mock('./pages/PasswordUpdate', () => ({
  __esModule: true,
  default: () => <div>PasswordUpdate</div>,
}));

describe('App Component', () => {
  test('App module can be imported', () => {
    const App = require('./App').default;
    expect(App).toBeDefined();
  });

  test('App is a valid React component', () => {
    const App = require('./App').default;
    expect(typeof App).toBe('function');
  });
});

