const {
  construirS3Key,
  validarConfigS3,
  criarErroResposta,
  tratarErroS3
} = require('../../utils/fotoHelpers');

// Mock do console
const originalConsole = global.console;
beforeAll(() => {
  global.console = {
    ...originalConsole,
    log: jest.fn(),
    error: jest.fn()
  };
});

afterAll(() => {
  global.console = originalConsole;
});

describe('Foto Helpers - Testes Adicionais', () => {
  describe('construirS3Key', () => {
    it('deve construir key com vistoria_id quando url_arquivo não tem caminho completo', () => {
      const key = construirS3Key('foto.jpg', 123);
      
      expect(key).toBe('vistorias/id-123/foto.jpg');
    });

    it('deve manter key quando já tem caminho completo', () => {
      const key = construirS3Key('vistorias/id-123/foto.jpg', 123);
      
      expect(key).toBe('vistorias/id-123/foto.jpg');
    });

    it('deve lançar erro quando não tem vistoria_id e url não tem caminho', () => {
      expect(() => {
        construirS3Key('foto.jpg', null);
      }).toThrow('vistoria_id não disponível');
    });

    it('deve construir key corretamente com diferentes formatos de arquivo', () => {
      expect(construirS3Key('foto.png', 456)).toBe('vistorias/id-456/foto.png');
      expect(construirS3Key('imagem.jpeg', 789)).toBe('vistorias/id-789/imagem.jpeg');
    });
  });

  describe('validarConfigS3', () => {
    it('deve lançar erro quando bucket não está configurado', () => {
      expect(() => {
        validarConfigS3(null, 'key', 1, 'url.jpg');
      }).toThrow('Bucket S3 não configurado');
    });

    it('deve lançar erro quando key não está configurada', () => {
      expect(() => {
        validarConfigS3('bucket', null, 1, 'url.jpg');
      }).toThrow('Key do arquivo não encontrada');
    });

    it('deve passar quando bucket e key estão configurados', () => {
      expect(() => {
        validarConfigS3('bucket', 'key', 1, 'url.jpg');
      }).not.toThrow();
    });
  });

  describe('criarErroResposta', () => {
    it('deve criar resposta de erro com status 500', () => {
      const erro = criarErroResposta(500, 'Erro interno', 'Detalhes', 1, 'url.jpg');
      
      expect(erro.status).toBe(500);
      expect(erro.json.error).toBe('Erro interno');
    });

    it('deve criar resposta de erro com status 404', () => {
      const erro = criarErroResposta(404, 'Não encontrado', 'Detalhes', 2, 'url2.jpg');
      
      expect(erro.status).toBe(404);
      expect(erro.json.error).toBe('Não encontrado');
    });

    it('deve incluir foto_id e url_arquivo na resposta', () => {
      const erro = criarErroResposta(500, 'Erro', 'Detalhes', 123, 'foto.jpg');
      
      expect(erro.json.foto_id).toBe(123);
      expect(erro.json.url_arquivo).toBe('foto.jpg');
    });

    it('deve incluir campos extras quando fornecidos', () => {
      const erro = criarErroResposta(500, 'Erro', 'Detalhes', 1, 'url.jpg', { campo_extra: 'valor' });
      
      expect(erro.json.campo_extra).toBe('valor');
    });
  });

  describe('tratarErroS3', () => {
    let mockRes, mockFoto;

    beforeEach(() => {
      mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      mockFoto = {
        id: 1,
        url_arquivo: 'foto.jpg'
      };
    });

    it('deve tratar erro de credenciais inválidas', () => {
      const erro = {
        name: 'InvalidAccessKeyId',
        message: 'Invalid credentials'
      };

      const resultado = tratarErroS3(erro, mockRes, mockFoto, 'bucket', 'key');

      expect(resultado.status).toBe(500);
      expect(resultado.json.error).toContain('Credenciais AWS');
    });

    it('deve tratar erro de bucket não encontrado', () => {
      const erro = {
        name: 'NoSuchBucket',
        message: 'Bucket not found'
      };

      const resultado = tratarErroS3(erro, mockRes, mockFoto, 'bucket', 'key');

      expect(resultado.status).toBe(500);
      expect(resultado.json.error).toContain('Bucket');
    });

    it('deve tratar erro de arquivo não encontrado', () => {
      const erro = {
        name: 'NoSuchKey',
        message: 'Key not found'
      };

      const resultado = tratarErroS3(erro, mockRes, mockFoto, 'bucket', 'key');

      expect(resultado.status).toBe(404);
      expect(resultado.json.error).toContain('não foi encontrado');
    });

    it('deve tratar erro genérico do S3', () => {
      const erro = {
        name: 'S3ServiceException',
        message: 'Generic error'
      };

      const resultado = tratarErroS3(erro, mockRes, mockFoto, 'bucket', 'key');

      expect(resultado.status).toBe(500);
      expect(resultado.json.error).toBeDefined();
    });

    it('deve incluir foto_id e url_arquivo no erro', () => {
      const erro = {
        name: 'NoSuchKey',
        message: 'Key not found'
      };

      const resultado = tratarErroS3(erro, mockRes, mockFoto, 'bucket', 'key');

      expect(resultado.json.foto_id).toBe(1);
      expect(resultado.json.url_arquivo).toBeDefined();
    });
  });
});
