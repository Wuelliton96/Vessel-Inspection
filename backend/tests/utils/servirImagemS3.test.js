const { servirImagemS3 } = require('../../utils/servirImagemS3');
const { GetObjectCommand, HeadObjectCommand } = require('@aws-sdk/client-s3');

// Mock dos módulos
jest.mock('../../utils/fotoHelpers', () => ({
  construirS3Key: jest.fn(),
  validarConfigS3: jest.fn(),
  tratarErroS3: jest.fn(),
  configurarHeadersCORS: jest.fn().mockReturnValue(true),
  processarStreamS3: jest.fn().mockResolvedValue()
}));

jest.mock('../../services/uploadService', () => ({
  getFullPath: jest.fn().mockReturnValue('https://example.com/image.jpg')
}));

const { construirS3Key, validarConfigS3, tratarErroS3, configurarHeadersCORS, processarStreamS3 } = require('../../utils/fotoHelpers');
const { getFullPath } = require('../../services/uploadService');

describe('Servir Imagem S3', () => {
  let mockReq, mockRes, mockFoto, mockS3Client, awsConfig;

  beforeEach(() => {
    jest.clearAllMocks();

    mockReq = {
      headers: {
        origin: 'http://localhost:3000'
      }
    };

    mockRes = {
      headersSent: false,
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      setHeader: jest.fn(),
      redirect: jest.fn()
    };

    mockFoto = {
      id: 1,
      url_arquivo: 'foto.jpg',
      vistoria_id: 123
    };

    mockS3Client = {
      send: jest.fn()
    };

    awsConfig = {
      s3Client: mockS3Client,
      bucket: 'test-bucket'
    };
  });

  it('deve servir imagem do S3 com sucesso', async () => {
    construirS3Key.mockReturnValue('vistorias/id-123/foto.jpg');
    
    const mockHeadResult = {
      ContentType: 'image/jpeg',
      ContentLength: 1024
    };

    const mockGetResult = {
      ContentType: 'image/jpeg',
      ContentLength: 1024,
      Body: {
        pipe: jest.fn()
      }
    };

    mockS3Client.send
      .mockResolvedValueOnce(mockHeadResult)
      .mockResolvedValueOnce(mockGetResult);

    await servirImagemS3(mockFoto, mockReq, mockRes, awsConfig);

    expect(construirS3Key).toHaveBeenCalledWith('foto.jpg', 123);
    expect(validarConfigS3).toHaveBeenCalled();
    expect(mockS3Client.send).toHaveBeenCalledTimes(2);
    expect(configurarHeadersCORS).toHaveBeenCalled();
    expect(processarStreamS3).toHaveBeenCalled();
  });

  it('deve retornar 404 quando imagem não existe no S3', async () => {
    construirS3Key.mockReturnValue('vistorias/id-123/foto.jpg');
    
    const noSuchKeyError = {
      name: 'NoSuchKey',
      code: 'NoSuchKey'
    };

    mockS3Client.send.mockRejectedValueOnce(noSuchKeyError);

    await servirImagemS3(mockFoto, mockReq, mockRes, awsConfig);

    expect(mockRes.status).toHaveBeenCalledWith(404);
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: 'Imagem não encontrada no S3'
      })
    );
  });

  it('deve tratar erro S3 e retornar resposta de erro', async () => {
    construirS3Key.mockReturnValue('vistorias/id-123/foto.jpg');
    
    const s3Error = {
      name: 'InvalidAccessKeyId',
      message: 'Invalid credentials'
    };

    const erroTratado = {
      status: 500,
      json: {
        error: 'Erro de configuração AWS'
      }
    };

    tratarErroS3.mockReturnValue(erroTratado);
    mockS3Client.send.mockRejectedValueOnce(s3Error);

    await servirImagemS3(mockFoto, mockReq, mockRes, awsConfig);

    expect(tratarErroS3).toHaveBeenCalledWith(s3Error, mockRes, mockFoto, 'test-bucket', 'vistorias/id-123/foto.jpg');
    expect(mockRes.status).toHaveBeenCalledWith(500);
    expect(mockRes.json).toHaveBeenCalledWith(erroTratado.json);
  });

  it('deve usar fallback de URL pública quando erro S3 não é tratado', async () => {
    construirS3Key.mockReturnValue('vistorias/id-123/foto.jpg');
    
    const s3Error = {
      name: 'UnknownError',
      message: 'Unknown error'
    };

    tratarErroS3.mockReturnValue(null);
    mockS3Client.send.mockRejectedValueOnce(s3Error);

    await servirImagemS3(mockFoto, mockReq, mockRes, awsConfig);

    expect(getFullPath).toHaveBeenCalledWith('foto.jpg', 123);
    expect(mockRes.redirect).toHaveBeenCalledWith(302, 'https://example.com/image.jpg');
  });

  it('deve tratar erro no fallback', async () => {
    construirS3Key.mockReturnValue('vistorias/id-123/foto.jpg');
    
    const s3Error = {
      name: 'UnknownError',
      message: 'Unknown error'
    };

    tratarErroS3.mockReturnValue(null);
    getFullPath.mockImplementation(() => {
      throw new Error('Fallback error');
    });
    mockS3Client.send.mockRejectedValueOnce(s3Error);

    await servirImagemS3(mockFoto, mockReq, mockRes, awsConfig);

    expect(mockRes.status).toHaveBeenCalledWith(500);
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: 'Erro ao acessar imagem no S3'
      })
    );
  });

  it('deve não processar quando headers já foram enviados', async () => {
    mockRes.headersSent = true;
    construirS3Key.mockReturnValue('vistorias/id-123/foto.jpg');
    
    const noSuchKeyError = {
      name: 'NoSuchKey',
      code: 'NoSuchKey'
    };

    mockS3Client.send.mockRejectedValueOnce(noSuchKeyError);

    await servirImagemS3(mockFoto, mockReq, mockRes, awsConfig);

    expect(mockRes.json).not.toHaveBeenCalled();
  });

  it('deve configurar Content-Type e Content-Length corretamente', async () => {
    construirS3Key.mockReturnValue('vistorias/id-123/foto.jpg');
    
    const mockHeadResult = {
      ContentType: 'image/png',
      ContentLength: 2048
    };

    const mockGetResult = {
      ContentType: 'image/png',
      ContentLength: 2048,
      Body: {
        pipe: jest.fn()
      }
    };

    mockS3Client.send
      .mockResolvedValueOnce(mockHeadResult)
      .mockResolvedValueOnce(mockGetResult);

    await servirImagemS3(mockFoto, mockReq, mockRes, awsConfig);

    expect(configurarHeadersCORS).toHaveBeenCalledWith(
      mockRes,
      mockReq,
      'image/png',
      2048
    );
  });
});
