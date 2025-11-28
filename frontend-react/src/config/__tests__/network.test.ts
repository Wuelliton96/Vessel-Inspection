import { getLocalIPAddress, getNetworkInfo, logNetworkInfo } from '../network';

// Mock RTCPeerConnection
global.RTCPeerConnection = jest.fn().mockImplementation(() => ({
  createDataChannel: jest.fn(),
  createOffer: jest.fn(),
  setLocalDescription: jest.fn(),
  close: jest.fn(),
  onicecandidate: null,
}));

describe('network', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock window.location
    Object.defineProperty(window, 'location', {
      value: {
        port: '3001',
        protocol: 'http:',
        host: 'localhost:3001',
        origin: 'http://localhost:3001',
      },
      writable: true,
    });
  });

  describe('getLocalIPAddress', () => {
    it('deve retornar IP quando candidato ICE é encontrado', async () => {
      const mockPC = {
        createDataChannel: jest.fn(),
        createOffer: jest.fn().mockResolvedValue({}),
        setLocalDescription: jest.fn().mockResolvedValue(undefined),
        close: jest.fn(),
        onicecandidate: null,
      };

      (global.RTCPeerConnection as jest.Mock).mockImplementation(() => mockPC);

      const promise = getLocalIPAddress();

      // Simular candidato ICE
      setTimeout(() => {
        if (mockPC.onicecandidate) {
          mockPC.onicecandidate({
            candidate: {
              candidate: 'candidate:1 1 UDP 2130706431 192.168.1.100 54321 typ host',
            },
          });
        }
      }, 100);

      const ip = await promise;
      expect(ip).toBe('192.168.1.100');
      expect(mockPC.close).toHaveBeenCalled();
    });

    it('deve retornar N/A quando não há candidatos', async () => {
      const mockPC = {
        createDataChannel: jest.fn(),
        createOffer: jest.fn().mockResolvedValue({}),
        setLocalDescription: jest.fn().mockResolvedValue(undefined),
        close: jest.fn(),
        onicecandidate: null,
      };

      (global.RTCPeerConnection as jest.Mock).mockImplementation(() => mockPC);

      const promise = getLocalIPAddress();

      // Simular fim dos candidatos sem IPs
      setTimeout(() => {
        if (mockPC.onicecandidate) {
          mockPC.onicecandidate(null);
        }
      }, 100);

      // Aguardar timeout
      await new Promise(resolve => setTimeout(resolve, 2100));

      const ip = await promise;
      expect(ip).toBe('N/A');
    });

    it('deve retornar N/A quando createOffer falha', async () => {
      const mockPC = {
        createDataChannel: jest.fn(),
        createOffer: jest.fn().mockRejectedValue(new Error('Failed')),
        setLocalDescription: jest.fn(),
        close: jest.fn(),
        onicecandidate: null,
      };

      (global.RTCPeerConnection as jest.Mock).mockImplementation(() => mockPC);

      const ip = await getLocalIPAddress();
      expect(ip).toBe('N/A');
    });

    it('deve retornar N/A quando há erro na criação do RTCPeerConnection', async () => {
      (global.RTCPeerConnection as jest.Mock).mockImplementation(() => {
        throw new Error('RTCPeerConnection failed');
      });

      const ip = await getLocalIPAddress();
      expect(ip).toBe('N/A');
    });

    it('deve ignorar IP 0.0.0.0', async () => {
      const mockPC = {
        createDataChannel: jest.fn(),
        createOffer: jest.fn().mockResolvedValue({}),
        setLocalDescription: jest.fn().mockResolvedValue(undefined),
        close: jest.fn(),
        onicecandidate: null,
      };

      (global.RTCPeerConnection as jest.Mock).mockImplementation(() => mockPC);

      const promise = getLocalIPAddress();

      // Simular candidato com IP 0.0.0.0
      setTimeout(() => {
        if (mockPC.onicecandidate) {
          mockPC.onicecandidate({
            candidate: {
              candidate: 'candidate:1 1 UDP 2130706431 0.0.0.0 54321 typ host',
            },
          });
        }
      }, 100);

      // Aguardar timeout
      await new Promise(resolve => setTimeout(resolve, 2100));

      const ip = await promise;
      expect(ip).toBe('N/A');
    });
  });

  describe('getNetworkInfo', () => {
    it('deve retornar informações de rede corretas', async () => {
      const mockPC = {
        createDataChannel: jest.fn(),
        createOffer: jest.fn().mockResolvedValue({}),
        setLocalDescription: jest.fn().mockResolvedValue(undefined),
        close: jest.fn(),
        onicecandidate: null,
      };

      (global.RTCPeerConnection as jest.Mock).mockImplementation(() => mockPC);

      const promise = getNetworkInfo();

      setTimeout(() => {
        if (mockPC.onicecandidate) {
          mockPC.onicecandidate({
            candidate: {
              candidate: 'candidate:1 1 UDP 2130706431 192.168.1.100 54321 typ host',
            },
          });
        }
      }, 100);

      const info = await promise;

      expect(info).toEqual({
        ip: '192.168.1.100',
        port: '3001',
        protocol: 'http:',
        urlLocal: 'http://localhost:3001',
        urlRede: 'http://192.168.1.100:3001',
        host: 'localhost:3001',
        origin: 'http://localhost:3001',
      });
    });

    it('deve usar porta padrão quando window.location.port está vazio', async () => {
      Object.defineProperty(window, 'location', {
        value: {
          port: '',
          protocol: 'http:',
          host: 'localhost',
          origin: 'http://localhost',
        },
        writable: true,
      });

      const mockPC = {
        createDataChannel: jest.fn(),
        createOffer: jest.fn().mockResolvedValue({}),
        setLocalDescription: jest.fn().mockResolvedValue(undefined),
        close: jest.fn(),
        onicecandidate: null,
      };

      (global.RTCPeerConnection as jest.Mock).mockImplementation(() => mockPC);

      const promise = getNetworkInfo();

      setTimeout(() => {
        if (mockPC.onicecandidate) {
          mockPC.onicecandidate({
            candidate: {
              candidate: 'candidate:1 1 UDP 2130706431 192.168.1.100 54321 typ host',
            },
          });
        }
      }, 100);

      const info = await promise;

      expect(info.port).toBe('3001');
    });
  });

  describe('logNetworkInfo', () => {
    let consoleLogSpy: jest.SpyInstance;

    beforeEach(() => {
      consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
    });

    afterEach(() => {
      consoleLogSpy.mockRestore();
    });

    it('deve logar informações de rede em desenvolvimento', async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      const mockPC = {
        createDataChannel: jest.fn(),
        createOffer: jest.fn().mockResolvedValue({}),
        setLocalDescription: jest.fn().mockResolvedValue(undefined),
        close: jest.fn(),
        onicecandidate: null,
      };

      (global.RTCPeerConnection as jest.Mock).mockImplementation(() => mockPC);

      const promise = logNetworkInfo();

      setTimeout(() => {
        if (mockPC.onicecandidate) {
          mockPC.onicecandidate({
            candidate: {
              candidate: 'candidate:1 1 UDP 2130706431 192.168.1.100 54321 typ host',
            },
          });
        }
      }, 100);

      await promise;

      expect(consoleLogSpy).toHaveBeenCalled();
      expect(consoleLogSpy).toHaveBeenCalledWith('='.repeat(60));
      expect(consoleLogSpy).toHaveBeenCalledWith('INFORMACOES DE REDE - FRONTEND');

      process.env.NODE_ENV = originalEnv;
    });

    it('não deve logar informações de rede em produção', async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      await logNetworkInfo();

      expect(consoleLogSpy).not.toHaveBeenCalled();

      process.env.NODE_ENV = originalEnv;
    });
  });
});

