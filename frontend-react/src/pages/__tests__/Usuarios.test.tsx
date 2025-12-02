/**
 * Testes para página Usuarios
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

// Mock do useAuth
jest.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({
    usuario: {
      id: 1,
      nome: 'Admin',
      nivelAcesso: { nome: 'ADMIN' }
    }
  })
}));

// Mock dos serviços
jest.mock('../../services/api', () => ({
  usuarioService: {
    getAll: jest.fn().mockResolvedValue([]),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    resetPassword: jest.fn(),
    toggleStatus: jest.fn()
  }
}));

describe('Usuarios', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deve importar componente sem erro', async () => {
    // Importação dinâmica para evitar problemas com mocks
    const { default: Usuarios } = await import('../Usuarios');
    
    expect(Usuarios).toBeDefined();
  });
});



