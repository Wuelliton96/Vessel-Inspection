const { servirImagemS3 } = require('../../utils/servirImagemS3');
const { construirS3Key, validarConfigS3, tratarErroS3, configurarHeadersCORS, processarStreamS3 } = require('../../utils/fotoHelpers');
const { getFullPath } = require('../../services/uploadService');
const { GetObjectCommand, HeadObjectCommand } = require('@aws-sdk/client-s3');

// Mock dos helpers
jest.mock('../../utils/fotoHelpers');
jest.mock('../../services/uploadService');

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

describe('Servir Imagem S3', () => {
  let mockReq, mockRes, mockS3Client, awsConfig;

  beforeEach(() => {
    mockReq = {
      headers: {
        origin: 'http://example.com'
      }
    };
    mockRes = {
      headersSent: false,
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      setHeader: jest.fn(),
      redirect: jest.fn(),
      send: jest.fn()
    };
    mockS3Client = {
      send: jest.fn()
    };
    awsConfig = {
      s3Client: mockS3Client,
      bucket: 'test-bucket',
      region: 'us-east-1'
    };
    jest.clearAllMocks();
  });

  it('deve servir imagem do S3 com sucesso', async () => {
    const foto = {
      id: 1,
      url_arquivo: 'foto.jpg',
      vistoria_id: 123
    };

    construirS3Key.mockReturnValue('vistorias/id-123/foto.jpg');
    validarConfigS3.mockReturnValue(undefined);
    configurarHeadersCORS.mockReturnValue(true);

    const mockHeadResult = {
      ContentType: 'image/jpeg',
      ContentLength: 1024
    };

    const mockS3Response = {
      ContentType: 'image/jpeg',
      ContentLength: 1024,
      Body: {
        [Symbol.asyncIterator]: async function* () {
          yield Buffer.from('image data');
        }
      }
    };

    mockS3Client.send
      .mockResolvedValueOnce(mockHeadResult) // HeadObjectCommand
      .mockResolvedValueOnce(mockS3Response); // GetObjectCommand

    processarStreamS3.mockResolvedValue(undefined);

    await servirImagemS3(foto, mockReq, mockRes, awsConfig);

    expect(construirS3Key).toHaveBeenCalledWith('foto.jpg', 123);
    expect(validarConfigS3).toHaveBeenCalled();
    expect(configurarHeadersCORS).toHaveBeenCalled();
    expect(processarStreamS3).toHaveBeenCalled();
  });

  it('deve retornar 404 quando imagem não existe no S3', async () => {
    const foto = {
      id: 1,
      url_arquivo: 'foto.jpg',
      vistoria_id: 123
    };

    construirS3Key.mockReturnValue('vistorias/id-123/foto.jpg');
    validarConfigS3.mockReturnValue(undefined);

    const headError = {
      name: 'NoSuchKey',
      message: 'Key not found'
    };

    mockS3Client.send.mockRejectedValueOnce(headError);

    await servirImagemS3(foto, mockReq, mockRes, awsConfig);

    expect(mockRes.status).toHaveBeenCalledWith(404);
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: 'Imagem não encontrada no S3'
      })
    );
  });

  it('deve usar fallback para URL pública quando S3 falha', async () => {
    const foto = {
      id: 1,
      url_arquivo: 'foto.jpg',
      vistoria_id: 123
    };

    construirS3Key.mockReturnValue('vistorias/id-123/foto.jpg');
    validarConfigS3.mockReturnValue(undefined);
    tratarErroS3.mockReturnValue(null);
    getFullPath.mockReturnValue('http://example.com/foto.jpg');

    const s3Error = new Error('S3 Error');
    mockS3Client.send.mockRejectedValueOnce(s3Error);

    await servirImagemS3(foto, mockReq, mockRes, awsConfig);

    expect(getFullPath).toHaveBeenCalledWith('foto.jpg', 123);
    expect(mockRes.redirect).toHaveBeenCalledWith(302, 'http://example.com/foto.jpg');
  });

  it('deve tratar erro S3 específico', async () => {
    const foto = {
      id: 1,
      url_arquivo: 'foto.jpg',
      vistoria_id: 123
    };

    construirS3Key.mockReturnValue('vistorias/id-123/foto.jpg');
    validarConfigS3.mockReturnValue(undefined);

    const s3Error = {
      name: 'NoSuchBucket',
      message: 'Bucket not found'
    };

    tratarErroS3.mockReturnValue({
      status: 500,
      json: { error: 'Bucket S3 não encontrado' }
    });

    mockS3Client.send.mockRejectedValueOnce(s3Error);

    await servirImagemS3(foto, mockReq, mockRes, awsConfig);

    expect(tratarErroS3).toHaveBeenCalledWith(s3Error, mockRes, foto, 'test-bucket', 'vistorias/id-123/foto.jpg');
    expect(mockRes.status).toHaveBeenCalledWith(500);
  });
});

