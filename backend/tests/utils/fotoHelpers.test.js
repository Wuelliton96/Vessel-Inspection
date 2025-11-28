const {
  construirS3Key,
  validarConfigS3,
  criarErroResposta,
  tratarErroS3,
  configurarHeadersCORS,
  processarStreamS3
} = require('../../utils/fotoHelpers');

// Mock do console
const originalConsoleLog = console.log;
const originalConsoleError = console.error;

beforeAll(() => {
  console.log = jest.fn();
  console.error = jest.fn();
});

afterAll(() => {
  console.log = originalConsoleLog;
  console.error = originalConsoleError;
});

describe('Foto Helpers', () => {
  describe('construirS3Key', () => {
    it('deve retornar key original se já começar com vistorias/', () => {
      const key = construirS3Key('vistorias/id-123/foto.jpg', 123);
      expect(key).toBe('vistorias/id-123/foto.jpg');
    });

    it('deve construir key completa quando não começa com vistorias/', () => {
      const key = construirS3Key('foto.jpg', 123);
      expect(key).toBe('vistorias/id-123/foto.jpg');
    });

    it('deve lançar erro quando vistoriaId não está disponível', () => {
      expect(() => {
        construirS3Key('foto.jpg', null);
      }).toThrow('Não foi possível determinar o caminho completo da imagem no S3');
    });

    it('deve lançar erro quando vistoriaId é undefined', () => {
      expect(() => {
        construirS3Key('foto.jpg', undefined);
      }).toThrow('Não foi possível determinar o caminho completo da imagem no S3');
    });
  });

  describe('validarConfigS3', () => {
    it('deve lançar erro quando bucket não está configurado', () => {
      expect(() => {
        validarConfigS3(null, 'key', 1, 'url');
      }).toThrow('Bucket S3 não configurado');
    });

    it('deve lançar erro quando key não está configurada', () => {
      expect(() => {
        validarConfigS3('bucket', null, 1, 'url');
      }).toThrow('Key do arquivo não encontrada');
    });

    it('deve passar quando bucket e key estão configurados', () => {
      expect(() => {
        validarConfigS3('bucket', 'key', 1, 'url');
      }).not.toThrow();
    });
  });

  describe('criarErroResposta', () => {
    it('deve criar objeto de erro com campos básicos', () => {
      const erro = criarErroResposta('Erro teste', 'Detalhes', 1, 'url.jpg');
      
      expect(erro).toMatchObject({
        error: 'Erro teste',
        details: 'Detalhes',
        foto_id: 1,
        url_arquivo: 'url.jpg'
      });
    });

    it('deve incluir campos extras', () => {
      const erro = criarErroResposta('Erro', 'Detalhes', 1, 'url.jpg', { extra: 'valor' });
      
      expect(erro).toHaveProperty('extra', 'valor');
    });
  });

  describe('tratarErroS3', () => {
    let mockRes, mockFoto;

    beforeEach(() => {
      mockRes = {
        headersSent: false,
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      mockFoto = {
        id: 1,
        url_arquivo: 'foto.jpg'
      };
    });

    it('deve retornar null quando headers já foram enviados', () => {
      mockRes.headersSent = true;
      const erro = { name: 'NoSuchKey' };
      
      const result = tratarErroS3(erro, mockRes, mockFoto, 'bucket', 'key');
      
      expect(result).toBeNull();
    });

    it('deve tratar erro de credenciais inválidas', () => {
      const erro = {
        name: 'InvalidAccessKeyId',
        message: 'Credenciais inválidas'
      };
      
      const result = tratarErroS3(erro, mockRes, mockFoto, 'bucket', 'key');
      
      expect(result).toMatchObject({
        status: 500,
        json: expect.objectContaining({
          error: 'Erro de configuração AWS'
        })
      });
    });

    it('deve tratar erro de bucket não encontrado', () => {
      const erro = {
        name: 'NoSuchBucket',
        message: 'Bucket não encontrado'
      };
      
      const result = tratarErroS3(erro, mockRes, mockFoto, 'bucket', 'key');
      
      expect(result).toMatchObject({
        status: 500,
        json: expect.objectContaining({
          error: 'Bucket S3 não encontrado'
        })
      });
    });

    it('deve tratar erro de arquivo não encontrado', () => {
      const erro = {
        name: 'NoSuchKey',
        message: 'Arquivo não encontrado'
      };
      
      const result = tratarErroS3(erro, mockRes, mockFoto, 'bucket', 'key');
      
      expect(result).toMatchObject({
        status: 404,
        json: expect.objectContaining({
          error: 'Imagem não encontrada no S3'
        })
      });
    });

    it('deve tratar erro usando code quando name não está disponível', () => {
      const erro = {
        code: 'NoSuchBucket',
        message: 'Bucket não encontrado'
      };
      
      const result = tratarErroS3(erro, mockRes, mockFoto, 'bucket', 'key');
      
      expect(result).toMatchObject({
        status: 500
      });
    });

    it('deve retornar null para erros não tratados', () => {
      const erro = {
        name: 'UnknownError',
        message: 'Erro desconhecido'
      };
      
      const result = tratarErroS3(erro, mockRes, mockFoto, 'bucket', 'key');
      
      expect(result).toBeNull();
    });
  });

  describe('configurarHeadersCORS', () => {
    let mockReq, mockRes;

    beforeEach(() => {
      mockReq = {
        headers: {
          origin: 'http://example.com'
        }
      };
      mockRes = {
        headersSent: false,
        setHeader: jest.fn()
      };
    });

    it('deve configurar headers CORS corretamente', () => {
      const result = configurarHeadersCORS(mockRes, mockReq, 'image/jpeg', 1024);
      
      expect(result).toBe(true);
      expect(mockRes.setHeader).toHaveBeenCalledWith('Access-Control-Allow-Origin', 'http://example.com');
      expect(mockRes.setHeader).toHaveBeenCalledWith('Access-Control-Allow-Credentials', 'true');
      expect(mockRes.setHeader).toHaveBeenCalledWith('Content-Type', 'image/jpeg');
      expect(mockRes.setHeader).toHaveBeenCalledWith('Content-Length', 1024);
    });

    it('deve usar * quando origin não está disponível', () => {
      mockReq.headers = {};
      configurarHeadersCORS(mockRes, mockReq, 'image/jpeg', 1024);
      
      expect(mockRes.setHeader).toHaveBeenCalledWith('Access-Control-Allow-Origin', '*');
    });

    it('deve retornar false quando headers já foram enviados', () => {
      mockRes.headersSent = true;
      
      const result = configurarHeadersCORS(mockRes, mockReq, 'image/jpeg', 1024);
      
      expect(result).toBe(false);
    });
  });

  describe('processarStreamS3', () => {
    let mockRes;

    beforeEach(() => {
      mockRes = {
        headersSent: false,
        send: jest.fn(),
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
    });

    it('deve processar stream e enviar buffer', async () => {
      const chunks = [Buffer.from('chunk1'), Buffer.from('chunk2')];
      const mockStream = {
        [Symbol.asyncIterator]: async function* () {
          for (const chunk of chunks) {
            yield chunk;
          }
        }
      };

      const mockS3Response = {
        Body: mockStream
      };

      await processarStreamS3(mockS3Response, mockRes, 1);

      expect(mockRes.send).toHaveBeenCalled();
    });

    it('não deve enviar quando headers já foram enviados', async () => {
      mockRes.headersSent = true;
      
      const chunks = [Buffer.from('chunk1')];
      const mockStream = {
        [Symbol.asyncIterator]: async function* () {
          for (const chunk of chunks) {
            yield chunk;
          }
        }
      };

      const mockS3Response = {
        Body: mockStream
      };

      await processarStreamS3(mockS3Response, mockRes, 1);

      expect(mockRes.send).not.toHaveBeenCalled();
    });
  });
});

