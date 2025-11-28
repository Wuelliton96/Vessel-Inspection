const getImageCompressTransform = require('../../middleware/imageCompress');
const sharp = require('sharp');

// Mock do sharp
jest.mock('sharp', () => {
  const mockSharp = jest.fn(() => ({
    resize: jest.fn().mockReturnThis(),
    jpeg: jest.fn().mockReturnThis(),
    on: jest.fn().mockReturnThis()
  }));
  return mockSharp;
});

// Mock do console.error
const originalConsoleError = console.error;
beforeAll(() => {
  console.error = jest.fn();
});

afterAll(() => {
  console.error = originalConsoleError;
});

describe('Image Compress Middleware', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deve retornar um transform stream do sharp', () => {
    const transform = getImageCompressTransform();
    
    expect(sharp).toHaveBeenCalled();
    expect(transform).toBeDefined();
  });

  it('deve configurar resize corretamente', () => {
    getImageCompressTransform();
    
    const sharpInstance = sharp();
    expect(sharpInstance.resize).toHaveBeenCalledWith(1920, 1920, {
      fit: 'inside',
      withoutEnlargement: true
    });
  });

  it('deve configurar compressão JPEG corretamente', () => {
    getImageCompressTransform();
    
    const sharpInstance = sharp();
    expect(sharpInstance.jpeg).toHaveBeenCalledWith({
      quality: 75,
      mozjpeg: true,
      progressive: true
    });
  });

  it('deve configurar handler de erro', () => {
    getImageCompressTransform();
    
    const sharpInstance = sharp();
    expect(sharpInstance.on).toHaveBeenCalledWith('error', expect.any(Function));
  });
});

