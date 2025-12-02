/**
 * Testes unitários para laudoService com mocks completos
 * Evita dependências externas e problemas de I/O
 */

// Mocks devem ser definidos ANTES de importar o módulo
jest.mock('pdf-lib', () => ({
  PDFDocument: {
    create: jest.fn(() => ({
      addPage: jest.fn(() => ({
        drawText: jest.fn(),
        drawImage: jest.fn(),
        drawRectangle: jest.fn(),
        getSize: jest.fn(() => ({ width: 595, height: 842 }))
      })),
      getPages: jest.fn(() => [{
        drawText: jest.fn(),
        drawImage: jest.fn(),
        drawRectangle: jest.fn(),
        getSize: jest.fn(() => ({ width: 595, height: 842 }))
      }]),
      embedJpg: jest.fn(() => Promise.resolve({})),
      embedPng: jest.fn(() => Promise.resolve({})),
      getForm: jest.fn(() => ({
        getFields: jest.fn(() => []),
        getTextField: jest.fn(() => null),
        getDropdown: jest.fn(() => null)
      })),
      registerFontkit: jest.fn(),
      save: jest.fn(() => Promise.resolve(Buffer.from('PDF')))
    })),
    load: jest.fn(() => Promise.resolve({
      addPage: jest.fn(() => ({
        drawText: jest.fn(),
        drawImage: jest.fn(),
        drawRectangle: jest.fn(),
        getSize: jest.fn(() => ({ width: 595, height: 842 }))
      })),
      getPages: jest.fn(() => [{
        drawText: jest.fn(),
        drawImage: jest.fn(),
        drawRectangle: jest.fn(),
        getSize: jest.fn(() => ({ width: 595, height: 842 }))
      }]),
      embedJpg: jest.fn(() => Promise.resolve({})),
      embedPng: jest.fn(() => Promise.resolve({})),
      getForm: jest.fn(() => ({
        getFields: jest.fn(() => []),
        getTextField: jest.fn(() => null),
        getDropdown: jest.fn(() => null)
      })),
      registerFontkit: jest.fn(),
      save: jest.fn(() => Promise.resolve(Buffer.from('PDF')))
    }))
  },
  rgb: jest.fn(() => ({ r: 0, g: 0, b: 0 }))
}));

jest.mock('fs', () => ({
  existsSync: jest.fn(() => true),
  mkdirSync: jest.fn(),
  writeFileSync: jest.fn(),
  readFileSync: jest.fn(() => Buffer.from('mock file content')),
  readdirSync: jest.fn(() => ['lancha_embarcação.pdf', 'jetski.pdf']),
  unlinkSync: jest.fn()
}));

jest.mock('../../services/uploadService', () => ({
  getFileUrl: jest.fn(file => file.key || file.filename || 'test.jpg'),
  getFullPath: jest.fn((path, id) => `/uploads/fotos/vistoria-${id}/${path}`),
  UPLOAD_STRATEGY: 'local'
}));

describe('laudoService - Testes Unitários com Mocks', () => {
  let laudoService;
  let fs;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    
    jest.resetModules();
    fs = require('fs');
    laudoService = require('../../services/laudoService');
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('gerarNumeroLaudo', () => {
    it('deve gerar número com 7 caracteres', () => {
      const numero = laudoService.gerarNumeroLaudo();
      expect(numero).toHaveLength(7);
    });

    it('deve terminar com letra maiúscula', () => {
      const numero = laudoService.gerarNumeroLaudo();
      expect(numero).toMatch(/[A-Z]$/);
    });

    it('deve começar com 6 dígitos', () => {
      const numero = laudoService.gerarNumeroLaudo();
      expect(numero.slice(0, 6)).toMatch(/^\d{6}$/);
    });

    it('deve incluir ano atual', () => {
      const numero = laudoService.gerarNumeroLaudo();
      const anoAtual = new Date().getFullYear().toString().slice(2);
      expect(numero.startsWith(anoAtual)).toBe(true);
    });

    it('deve gerar números diferentes em chamadas consecutivas', () => {
      const numeros = new Set();
      for (let i = 0; i < 50; i++) {
        numeros.add(laudoService.gerarNumeroLaudo());
      }
      expect(numeros.size).toBeGreaterThan(1);
    });
  });

  describe('obterTemplatePDF', () => {
    it('deve retornar jetski.pdf para JET_SKI', () => {
      const result = laudoService.obterTemplatePDF('JET_SKI');
      expect(result).toContain('jetski.pdf');
    });

    it('deve retornar jetski.pdf para JETSKI (sem underscore)', () => {
      const result = laudoService.obterTemplatePDF('JETSKI');
      expect(result).toContain('jetski.pdf');
    });

    it('deve retornar lancha para LANCHA', () => {
      const result = laudoService.obterTemplatePDF('LANCHA');
      expect(result).toContain('lancha');
    });

    it('deve retornar lancha para EMBARCACAO_COMERCIAL', () => {
      const result = laudoService.obterTemplatePDF('EMBARCACAO_COMERCIAL');
      expect(result).toContain('lancha');
    });

    it('deve retornar lancha para BARCO', () => {
      const result = laudoService.obterTemplatePDF('BARCO');
      expect(result).toContain('lancha');
    });

    it('deve retornar lancha para IATE', () => {
      const result = laudoService.obterTemplatePDF('IATE');
      expect(result).toContain('lancha');
    });

    it('deve retornar lancha para VELEIRO', () => {
      const result = laudoService.obterTemplatePDF('VELEIRO');
      expect(result).toContain('lancha');
    });

    it('deve retornar lancha para tipo desconhecido', () => {
      const result = laudoService.obterTemplatePDF('TIPO_DESCONHECIDO');
      expect(result).toContain('lancha');
    });

    it('deve retornar lancha para null', () => {
      const result = laudoService.obterTemplatePDF(null);
      expect(result).toContain('lancha');
    });

    it('deve retornar lancha para undefined', () => {
      const result = laudoService.obterTemplatePDF(undefined);
      expect(result).toContain('lancha');
    });

    it('deve retornar lancha para string vazia', () => {
      const result = laudoService.obterTemplatePDF('');
      expect(result).toContain('lancha');
    });

    it('deve ser case-insensitive para jet_ski', () => {
      const upper = laudoService.obterTemplatePDF('JET_SKI');
      const lower = laudoService.obterTemplatePDF('jet_ski');
      const mixed = laudoService.obterTemplatePDF('Jet_Ski');
      expect(upper).toBe(lower);
      expect(upper).toBe(mixed);
    });
  });

  describe('deletarLaudoPDF', () => {
    it('deve deletar arquivo existente', () => {
      fs.existsSync.mockReturnValue(true);
      
      laudoService.deletarLaudoPDF('/uploads/laudos/2024/01/laudo-1.pdf');
      
      expect(fs.unlinkSync).toHaveBeenCalled();
    });

    it('não deve tentar deletar se urlPdf é null', () => {
      laudoService.deletarLaudoPDF(null);
      expect(fs.unlinkSync).not.toHaveBeenCalled();
    });

    it('não deve tentar deletar se urlPdf é undefined', () => {
      laudoService.deletarLaudoPDF(undefined);
      expect(fs.unlinkSync).not.toHaveBeenCalled();
    });

    it('não deve tentar deletar se urlPdf é string vazia', () => {
      laudoService.deletarLaudoPDF('');
      expect(fs.unlinkSync).not.toHaveBeenCalled();
    });

    it('não deve falhar se arquivo não existe', () => {
      fs.existsSync.mockReturnValue(false);
      
      expect(() => {
        laudoService.deletarLaudoPDF('/uploads/laudos/inexistente.pdf');
      }).not.toThrow();
    });

    it('não deve propagar erro de fs.unlinkSync', () => {
      fs.existsSync.mockReturnValue(true);
      fs.unlinkSync.mockImplementation(() => {
        throw new Error('Permissão negada');
      });
      
      expect(() => {
        laudoService.deletarLaudoPDF('/uploads/laudos/2024/01/laudo-1.pdf');
      }).not.toThrow();
    });
  });

  describe('gerarLaudoPDF', () => {
    const mockLaudo = {
      id: 1,
      numero_laudo: '241129A',
      nome_moto_aquatica: 'Barco Teste',
      proprietario: 'João Silva',
      cpf_cnpj: '12345678900',
      data_inspecao: new Date('2024-01-15')
    };

    const mockVistoria = {
      id: 1,
      Embarcacao: {
        nome: 'Barco Teste',
        tipo_embarcacao: 'LANCHA',
        nr_inscricao_barco: 'TEST001'
      },
      Local: {
        logradouro: 'Rua das Marinhas'
      }
    };

    it('deve gerar PDF com dados válidos', async () => {
      const result = await laudoService.gerarLaudoPDF(mockLaudo, mockVistoria, []);
      
      expect(result).toHaveProperty('filePath');
      expect(result).toHaveProperty('urlRelativa');
      expect(result).toHaveProperty('fileName');
    });

    it('deve lançar erro se laudo é null', async () => {
      await expect(laudoService.gerarLaudoPDF(null, mockVistoria, []))
        .rejects.toThrow('Laudo não fornecido');
    });

    it('deve lançar erro se vistoria é null', async () => {
      await expect(laudoService.gerarLaudoPDF(mockLaudo, null, []))
        .rejects.toThrow('Vistoria não fornecida');
    });

    it('deve criar diretórios se não existirem', async () => {
      fs.existsSync.mockReturnValue(false);
      
      await laudoService.gerarLaudoPDF(mockLaudo, mockVistoria, []);
      
      expect(fs.mkdirSync).toHaveBeenCalled();
    });

    it('deve salvar PDF no disco', async () => {
      await laudoService.gerarLaudoPDF(mockLaudo, mockVistoria, []);
      
      expect(fs.writeFileSync).toHaveBeenCalled();
    });

    it('deve usar template jetski para JET_SKI', async () => {
      const vistoriaJetski = {
        ...mockVistoria,
        Embarcacao: { ...mockVistoria.Embarcacao, tipo_embarcacao: 'JET_SKI' }
      };
      
      const result = await laudoService.gerarLaudoPDF(mockLaudo, vistoriaJetski, []);
      
      expect(result).toHaveProperty('filePath');
    });

    it('deve processar fotos quando fornecidas', async () => {
      const fotos = [{
        id: 1,
        url_arquivo: 'foto1.jpg',
        TipoFotoChecklist: { nome_exibicao: 'Foto do Casco' }
      }];
      
      const result = await laudoService.gerarLaudoPDF(mockLaudo, mockVistoria, fotos);
      
      expect(result).toHaveProperty('filePath');
    });

    it('deve continuar se foto não pode ser carregada', async () => {
      fs.existsSync.mockImplementation(path => {
        if (path.includes('foto-erro')) return false;
        return true;
      });
      
      const fotos = [{
        id: 1,
        url_arquivo: 'foto-erro.jpg',
        TipoFotoChecklist: { nome_exibicao: 'Foto Erro' }
      }];
      
      const result = await laudoService.gerarLaudoPDF(mockLaudo, mockVistoria, fotos);
      
      expect(result).toHaveProperty('filePath');
    });

    it('deve retornar fileName com id do laudo', async () => {
      const result = await laudoService.gerarLaudoPDF(mockLaudo, mockVistoria, []);
      
      expect(result.fileName).toContain('laudo-1');
    });
  });
});



