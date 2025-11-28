const { s3Client, s3, bucket, region } = require('../../config/aws');

// Mock do console para evitar logs durante testes
const originalConsole = global.console;
beforeAll(() => {
  global.console = {
    ...originalConsole,
    warn: jest.fn(),
    log: jest.fn()
  };
});

afterAll(() => {
  global.console = originalConsole;
});

describe('AWS Config', () => {
  it('deve exportar s3Client', () => {
    expect(s3Client).toBeDefined();
    expect(s3Client).toHaveProperty('config');
  });

  it('deve exportar alias s3', () => {
    expect(s3).toBeDefined();
    expect(s3).toBe(s3Client);
  });

  it('deve exportar bucket', () => {
    expect(bucket).toBeDefined();
    expect(typeof bucket).toBe('string');
  });

  it('deve exportar region', () => {
    expect(region).toBeDefined();
    expect(typeof region).toBe('string');
  });

  it('deve usar região padrão se AWS_REGION não estiver configurado', () => {
    const originalRegion = process.env.AWS_REGION;
    delete process.env.AWS_REGION;
    
    // Recarregar módulo para pegar nova configuração
    jest.resetModules();
    const { region: newRegion } = require('../../config/aws');
    
    expect(newRegion).toBe('us-east-1');
    
    if (originalRegion) {
      process.env.AWS_REGION = originalRegion;
    }
  });
});

