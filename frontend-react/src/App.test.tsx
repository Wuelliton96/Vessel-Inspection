// Mock react-router-dom inline
jest.mock('react-router-dom', () => {
  const React = require('react');
  return {
    BrowserRouter: ({ children }: { children: any }) => React.createElement('div', null, children),
    Routes: ({ children }: { children: any }) => React.createElement('div', null, children),
    Route: ({ children }: { children: any }) => React.createElement('div', null, children),
    Navigate: ({ to }: { to: string }) => React.createElement('div', null, `Navigate to ${to}`),
    useLocation: () => ({ pathname: '/', search: '', hash: '', state: null, key: 'default' }),
    useNavigate: () => jest.fn(),
    Link: ({ to, children }: { to: string; children: any }) => React.createElement('a', { href: to }, children),
    NavLink: ({ to, children }: { to: string; children: any }) => React.createElement('a', { href: to }, children),
    Outlet: () => React.createElement('div', null),
  };
});

// Mock styled-components
jest.mock('styled-components', () => {
  const actual = jest.requireActual('styled-components');
  const React = require('react');
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
jest.mock('./contexts/AuthContext', () => {
  const React = require('react');
  return {
    AuthProvider: ({ children }: { children: any }) => React.createElement('div', null, children),
    useAuth: () => ({ user: null, login: jest.fn(), logout: jest.fn(), isAuthenticated: false }),
  };
});

jest.mock('./hooks/useAccessControl', () => ({
  useAccessControl: () => ({ isAdmin: false, isVistoriador: false }),
}));

jest.mock('./config/queryClient', () => ({
  queryClient: {
    invalidateQueries: jest.fn(),
    setQueryData: jest.fn(),
  },
}));

jest.mock('@tanstack/react-query', () => {
  const React = require('react');
  return {
    QueryClientProvider: ({ children }: { children: any }) => React.createElement('div', null, children),
    QueryClient: jest.fn(() => ({
      invalidateQueries: jest.fn(),
      setQueryData: jest.fn(),
    })),
  };
});

jest.mock('./components/Layout/Layout', () => {
  const React = require('react');
  return {
    __esModule: true,
    default: ({ children }: { children: any }) => React.createElement('div', null, children),
  };
});

jest.mock('./pages/Login', () => {
  const React = require('react');
  return {
    __esModule: true,
    default: () => React.createElement('div', null, 'Login'),
  };
});

jest.mock('./pages/PasswordUpdate', () => {
  const React = require('react');
  return {
    __esModule: true,
    default: () => React.createElement('div', null, 'PasswordUpdate'),
  };
});

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

export {};
