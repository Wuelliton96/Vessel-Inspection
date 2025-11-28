const { 
  validate, 
  sanitizeString, 
  loginValidation, 
  registerValidation,
  embarcacaoValidation,
  vistoriaValidation,
  laudoValidation
} = require('../../middleware/validator');
const { body, validationResult } = require('express-validator');

// Mock do express-validator
jest.mock('express-validator', () => ({
  body: jest.fn((field) => ({
    notEmpty: jest.fn().mockReturnThis(),
    isLength: jest.fn().mockReturnThis(),
    isEmail: jest.fn().mockReturnThis(),
    isInt: jest.fn().mockReturnThis(),
    isFloat: jest.fn().mockReturnThis(),
    isISO8601: jest.fn().mockReturnThis(),
    matches: jest.fn().mockReturnThis(),
    optional: jest.fn().mockReturnThis(),
    trim: jest.fn().mockReturnThis(),
    escape: jest.fn().mockReturnThis(),
    normalizeEmail: jest.fn().mockReturnThis(),
    custom: jest.fn().mockReturnThis(),
    withMessage: jest.fn().mockReturnThis()
  })),
  validationResult: jest.fn()
}));

describe('Validator Middleware', () => {
  let mockReq, mockRes, mockNext;

  beforeEach(() => {
    mockReq = {
      body: {}
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    mockNext = jest.fn();
    jest.clearAllMocks();
  });

  describe('validate', () => {
    it('deve passar quando não há erros', () => {
      validationResult.mockReturnValue({
        isEmpty: () => true,
        array: () => []
      });

      validate(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it('deve retornar erro quando há erros de validação', () => {
      validationResult.mockReturnValue({
        isEmpty: () => false,
        array: () => [
          { msg: 'Campo obrigatório' },
          { msg: 'Valor inválido' }
        ]
      });

      validate(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Campo obrigatório',
        message: 'Campo obrigatório',
        details: [
          { msg: 'Campo obrigatório' },
          { msg: 'Valor inválido' }
        ],
        code: 'VALIDACAO_FALHOU'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('deve usar mensagem padrão quando não há msg', () => {
      validationResult.mockReturnValue({
        isEmpty: () => false,
        array: () => [
          {}
        ]
      });

      validate(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Dados invalidos',
        message: 'Por favor, verifique os dados informados.',
        details: [{}],
        code: 'VALIDACAO_FALHOU'
      });
    });
  });

  describe('sanitizeString', () => {
    it('deve sanitizar string com caracteres perigosos', () => {
      const input = '<script>alert("xss")</script>';
      const result = sanitizeString(input);
      
      expect(result).toBe('&lt;script&gt;alert(&quot;xss&quot;)&lt;&#x2F;script&gt;');
    });

    it('deve retornar valor original se não for string', () => {
      expect(sanitizeString(123)).toBe(123);
      expect(sanitizeString(null)).toBe(null);
      expect(sanitizeString(undefined)).toBe(undefined);
      expect(sanitizeString({})).toEqual({});
    });

    it('deve sanitizar todos os caracteres perigosos', () => {
      const input = '<>"\'/';
      const result = sanitizeString(input);
      
      expect(result).toContain('&lt;');
      expect(result).toContain('&gt;');
      expect(result).toContain('&quot;');
      expect(result).toContain('&#x27;');
      expect(result).toContain('&#x2F;');
    });
  });

  describe('loginValidation', () => {
    it('deve ser um array de validadores', () => {
      expect(Array.isArray(loginValidation)).toBe(true);
      expect(loginValidation.length).toBeGreaterThan(0);
    });
  });

  describe('registerValidation', () => {
    it('deve ser um array de validadores', () => {
      expect(Array.isArray(registerValidation)).toBe(true);
      expect(registerValidation.length).toBeGreaterThan(0);
    });
  });

  describe('embarcacaoValidation', () => {
    it('deve ser um array de validadores', () => {
      expect(Array.isArray(embarcacaoValidation)).toBe(true);
      expect(embarcacaoValidation.length).toBeGreaterThan(0);
    });
  });

  describe('vistoriaValidation', () => {
    it('deve ser um array de validadores', () => {
      expect(Array.isArray(vistoriaValidation)).toBe(true);
      expect(vistoriaValidation.length).toBeGreaterThan(0);
    });
  });

  describe('laudoValidation', () => {
    it('deve ser um array de validadores', () => {
      expect(Array.isArray(laudoValidation)).toBe(true);
      expect(laudoValidation.length).toBeGreaterThan(0);
    });
  });
});

