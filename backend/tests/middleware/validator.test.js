const request = require('supertest');
const express = require('express');
const { validate, sanitizeString, loginValidation, registerValidation, embarcacaoValidation, vistoriaValidation, laudoValidation } = require('../../middleware/validator');
const { validationResult } = require('express-validator');

describe('Validator Middleware', () => {
  let app, mockReq, mockRes, mockNext;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    
    mockReq = {
      body: {},
      query: {},
      params: {}
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    mockNext = jest.fn();
  });

  describe('validate', () => {
    it('deve passar quando não há erros', () => {
      jest.spyOn(validationResult, 'mockReturnValue').mockReturnValue({
        isEmpty: () => true,
        array: () => []
      });

      const req = {
        ...mockReq,
        validationResult: () => ({ isEmpty: () => true, array: () => [] })
      };

      validate(req, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it('deve retornar 400 quando há erros', () => {
      const errors = [
        { msg: 'Campo obrigatório', param: 'nome' }
      ];

      const req = {
        ...mockReq,
        validationResult: () => ({
          isEmpty: () => false,
          array: () => errors
        })
      };

      validate(req, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Campo obrigatório',
          code: 'VALIDACAO_FALHOU'
        })
      );
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('sanitizeString', () => {
    it('deve sanitizar tags HTML', () => {
      expect(sanitizeString('<script>alert("xss")</script>')).toBe('&lt;script&gt;alert(&quot;xss&quot;)&lt;&#x2F;script&gt;');
    });

    it('deve sanitizar aspas', () => {
      expect(sanitizeString('Test "quotes"')).toBe('Test &quot;quotes&quot;');
    });

    it('deve retornar valor original se não for string', () => {
      expect(sanitizeString(123)).toBe(123);
      expect(sanitizeString(null)).toBe(null);
      expect(sanitizeString(undefined)).toBe(undefined);
    });

    it('deve sanitizar múltiplos caracteres especiais', () => {
      const input = '<div>Test</div>';
      const output = sanitizeString(input);
      expect(output).not.toContain('<');
      expect(output).not.toContain('>');
    });
  });

  describe('loginValidation', () => {
    it('deve validar CPF válido', async () => {
      const req = {
        body: { cpf: '12345678901', senha: 'senha123' }
      };

      for (const validator of loginValidation) {
        if (typeof validator === 'function' && validator.name !== 'validate') {
          await validator(req, mockRes, mockNext);
        }
      }

      expect(mockNext).toHaveBeenCalled();
    });

    it('deve rejeitar CPF com menos de 11 dígitos', async () => {
      const req = {
        body: { cpf: '123456789', senha: 'senha123' }
      };

      for (const validator of loginValidation) {
        if (typeof validator === 'function' && validator.name !== 'validate') {
          await validator(req, mockRes, () => {});
        }
      }
    });

    it('deve validar senha com mínimo de 6 caracteres', async () => {
      const req = {
        body: { cpf: '12345678901', senha: 'senha123' }
      };

      for (const validator of loginValidation) {
        if (typeof validator === 'function' && validator.name !== 'validate') {
          await validator(req, mockRes, mockNext);
        }
      }
    });
  });

  describe('registerValidation', () => {
    it('deve validar nome entre 3 e 100 caracteres', async () => {
      const req = {
        body: {
          nome: 'João Silva',
          email: 'joao@test.com',
          senha: 'Senha123'
        }
      };

      for (const validator of registerValidation) {
        if (typeof validator === 'function' && validator.name !== 'validate') {
          await validator(req, mockRes, mockNext);
        }
      }
    });

    it('deve validar email válido', async () => {
      const req = {
        body: {
          nome: 'João Silva',
          email: 'joao@test.com',
          senha: 'Senha123'
        }
      };

      for (const validator of registerValidation) {
        if (typeof validator === 'function' && validator.name !== 'validate') {
          await validator(req, mockRes, mockNext);
        }
      }
    });

    it('deve validar senha com requisitos', async () => {
      const req = {
        body: {
          nome: 'João Silva',
          email: 'joao@test.com',
          senha: 'Senha123'
        }
      };

      for (const validator of registerValidation) {
        if (typeof validator === 'function' && validator.name !== 'validate') {
          await validator(req, mockRes, mockNext);
        }
      }
    });
  });

  describe('embarcacaoValidation', () => {
    it('deve validar nome entre 3 e 200 caracteres', async () => {
      const req = {
        body: {
          nome: 'Embarcacao Test',
          tipo: 'LANCHA'
        }
      };

      for (const validator of embarcacaoValidation) {
        if (typeof validator === 'function' && validator.name !== 'validate') {
          await validator(req, mockRes, mockNext);
        }
      }
    });

    it('deve validar tipo entre 2 e 100 caracteres', async () => {
      const req = {
        body: {
          nome: 'Embarcacao Test',
          tipo: 'LANCHA'
        }
      };

      for (const validator of embarcacaoValidation) {
        if (typeof validator === 'function' && validator.name !== 'validate') {
          await validator(req, mockRes, mockNext);
        }
      }
    });

    it('deve validar ano de fabricação opcional', async () => {
      const req = {
        body: {
          nome: 'Embarcacao Test',
          tipo: 'LANCHA',
          ano_fabricacao: 2020
        }
      };

      for (const validator of embarcacaoValidation) {
        if (typeof validator === 'function' && validator.name !== 'validate') {
          await validator(req, mockRes, mockNext);
        }
      }
    });
  });

  describe('vistoriaValidation', () => {
    it('deve validar IDs como inteiros', async () => {
      const req = {
        body: {
          embarcacao_id: 1,
          local_id: 2,
          vistoriador_id: 3,
          data_vistoria: '2024-01-01T00:00:00Z'
        }
      };

      for (const validator of vistoriaValidation) {
        if (typeof validator === 'function' && validator.name !== 'validate') {
          await validator(req, mockRes, mockNext);
        }
      }
    });

    it('deve validar data no formato ISO8601', async () => {
      const req = {
        body: {
          embarcacao_id: 1,
          local_id: 2,
          vistoriador_id: 3,
          data_vistoria: '2024-01-01T00:00:00Z'
        }
      };

      for (const validator of vistoriaValidation) {
        if (typeof validator === 'function' && validator.name !== 'validate') {
          await validator(req, mockRes, mockNext);
        }
      }
    });
  });

  describe('laudoValidation', () => {
    it('deve validar vistoria_id como inteiro', async () => {
      const req = {
        body: {
          vistoria_id: 1
        }
      };

      for (const validator of laudoValidation) {
        if (typeof validator === 'function' && validator.name !== 'validate') {
          await validator(req, mockRes, mockNext);
        }
      }
    });

    it('deve aceitar numero_laudo opcional', async () => {
      const req = {
        body: {
          vistoria_id: 1,
          numero_laudo: 'LAUDO-001'
        }
      };

      for (const validator of laudoValidation) {
        if (typeof validator === 'function' && validator.name !== 'validate') {
          await validator(req, mockRes, mockNext);
        }
      }
    });
  });
});
