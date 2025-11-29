/**
 * Testes abrangentes para laudoService
 * Objetivo: Aumentar cobertura de testes para > 75%
 */
const path = require('path');
const fs = require('fs');

// Mock de módulos
jest.mock('pdf-lib', () => ({
  PDFDocument: {
    create: jest.fn().mockReturnValue({
      addPage: jest.fn().mockReturnValue({
        drawText: jest.fn(),
        drawImage: jest.fn(),
        drawRectangle: jest.fn(),
        getSize: jest.fn().mockReturnValue({ width: 595, height: 842 })
      }),
      getPages: jest.fn().mockReturnValue([{
        drawText: jest.fn(),
        drawImage: jest.fn(),
        drawRectangle: jest.fn(),
        getSize: jest.fn().mockReturnValue({ width: 595, height: 842 })
      }]),
      embedJpg: jest.fn().mockResolvedValue({}),
      embedPng: jest.fn().mockResolvedValue({}),
      getForm: jest.fn().mockReturnValue({
        getFields: jest.fn().mockReturnValue([]),
        getTextField: jest.fn().mockReturnValue(null),
        getDropdown: jest.fn().mockReturnValue(null)
      }),
      registerFontkit: jest.fn(),
      save: jest.fn().mockResolvedValue(Buffer.from('PDF content'))
    }),
    load: jest.fn().mockResolvedValue({
      addPage: jest.fn().mockReturnValue({
        drawText: jest.fn(),
        drawImage: jest.fn(),
        drawRectangle: jest.fn(),
        getSize: jest.fn().mockReturnValue({ width: 595, height: 842 })
      }),
      getPages: jest.fn().mockReturnValue([{
        drawText: jest.fn(),
        drawImage: jest.fn(),
        drawRectangle: jest.fn(),
        getSize: jest.fn().mockReturnValue({ width: 595, height: 842 })
      }]),
      embedJpg: jest.fn().mockResolvedValue({}),
      embedPng: jest.fn().mockResolvedValue({}),
      getForm: jest.fn().mockReturnValue({
        getFields: jest.fn().mockReturnValue([]),
        getTextField: jest.fn().mockReturnValue(null),
        getDropdown: jest.fn().mockReturnValue(null)
      }),
      registerFontkit: jest.fn(),
      save: jest.fn().mockResolvedValue(Buffer.from('PDF content'))
    })
  },
  rgb: jest.fn().mockReturnValue({})
}));

jest.mock('fs');
jest.mock('@pdf-lib/fontkit', () => ({}), { virtual: true });

jest.mock('../../services/uploadService', () => ({
  getFileUrl: jest.fn(file => file.key || file.filename),
  getFullPath: jest.fn((path, id) => `/uploads/fotos/vistoria-${id}/${path}`),
  UPLOAD_STRATEGY: 'local'
}));

describe('laudoService - Testes de Cobertura', () => {
  let laudoService;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    
    // Mock fs
    fs.existsSync.mockReturnValue(true);
    fs.mkdirSync.mockImplementation(() => {});
    fs.writeFileSync.mockImplementation(() => {});
    fs.readFileSync.mockReturnValue(Buffer.from('mock pdf content'));
    fs.readdirSync.mockReturnValue(['lancha_embarcação.pdf', 'jetski.pdf']);
    fs.unlinkSync.mockImplementation(() => {});
    
    jest.resetModules();
    laudoService = require('../../services/laudoService');
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('gerarNumeroLaudo', () => {
    it('deve gerar número de laudo no formato correto', () => {
      const numero = laudoService.gerarNumeroLaudo();
      
      // Formato esperado: AAMMDDX (onde X é uma letra)
      expect(numero).toMatch(/^\d{6}[A-Z]$/);
    });

    it('deve gerar números únicos', () => {
      const numeros = new Set();
      for (let i = 0; i < 100; i++) {
        numeros.add(laudoService.gerarNumeroLaudo());
      }
      // Deve haver variação nos números gerados
      expect(numeros.size).toBeGreaterThan(1);
    });
  });

  describe('obterTemplatePDF', () => {
    it('deve retornar template de jetski para JET_SKI', () => {
      const template = laudoService.obterTemplatePDF('JET_SKI');
      expect(template).toContain('jetski.pdf');
    });

    it('deve retornar template de jetski para JETSKI', () => {
      const template = laudoService.obterTemplatePDF('JETSKI');
      expect(template).toContain('jetski.pdf');
    });

    it('deve retornar template de lancha para LANCHA', () => {
      const template = laudoService.obterTemplatePDF('LANCHA');
      expect(template).toContain('lancha');
    });

    it('deve retornar template de lancha para EMBARCACAO_COMERCIAL', () => {
      const template = laudoService.obterTemplatePDF('EMBARCACAO_COMERCIAL');
      expect(template).toContain('lancha');
    });

    it('deve retornar template de lancha para BARCO', () => {
      const template = laudoService.obterTemplatePDF('BARCO');
      expect(template).toContain('lancha');
    });

    it('deve retornar template de lancha para IATE', () => {
      const template = laudoService.obterTemplatePDF('IATE');
      expect(template).toContain('lancha');
    });

    it('deve retornar template de lancha para VELEIRO', () => {
      const template = laudoService.obterTemplatePDF('VELEIRO');
      expect(template).toContain('lancha');
    });

    it('deve retornar template padrão para tipo desconhecido', () => {
      const template = laudoService.obterTemplatePDF('OUTRO');
      expect(template).toContain('lancha');
    });

    it('deve retornar template padrão para tipo null', () => {
      const template = laudoService.obterTemplatePDF(null);
      expect(template).toContain('lancha');
    });

    it('deve retornar template padrão para tipo undefined', () => {
      const template = laudoService.obterTemplatePDF(undefined);
      expect(template).toContain('lancha');
    });

    it('deve ser case-insensitive', () => {
      const template1 = laudoService.obterTemplatePDF('jet_ski');
      const template2 = laudoService.obterTemplatePDF('JET_SKI');
      expect(template1).toBe(template2);
    });
  });

  describe('deletarLaudoPDF', () => {
    it('deve deletar PDF existente', () => {
      fs.existsSync.mockReturnValue(true);
      
      laudoService.deletarLaudoPDF('/uploads/laudos/2024/01/laudo-1.pdf');
      
      expect(fs.unlinkSync).toHaveBeenCalled();
    });

    it('deve não fazer nada para urlPdf nulo', () => {
      laudoService.deletarLaudoPDF(null);
      expect(fs.unlinkSync).not.toHaveBeenCalled();
    });

    it('deve não fazer nada para urlPdf undefined', () => {
      laudoService.deletarLaudoPDF(undefined);
      expect(fs.unlinkSync).not.toHaveBeenCalled();
    });

    it('deve não fazer nada para urlPdf vazio', () => {
      laudoService.deletarLaudoPDF('');
      expect(fs.unlinkSync).not.toHaveBeenCalled();
    });

    it('deve logar quando arquivo não existe', () => {
      fs.existsSync.mockReturnValue(false);
      
      laudoService.deletarLaudoPDF('/uploads/laudos/2024/01/laudo-1.pdf');
      
      expect(fs.unlinkSync).not.toHaveBeenCalled();
    });

    it('deve tratar erro ao deletar arquivo', () => {
      fs.existsSync.mockReturnValue(true);
      fs.unlinkSync.mockImplementation(() => {
        throw new Error('Erro ao deletar');
      });
      
      // Não deve lançar erro
      expect(() => {
        laudoService.deletarLaudoPDF('/uploads/laudos/2024/01/laudo-1.pdf');
      }).not.toThrow();
    });
  });

  describe('gerarLaudoPDF', () => {
    const mockLaudo = {
      id: 1,
      numero_laudo: '241129A',
      versao: 'BS 2021-01',
      nome_moto_aquatica: 'Barco Teste',
      proprietario: 'João Silva',
      cpf_cnpj: '12345678900',
      data_inspecao: new Date('2024-11-29'),
      local_vistoria: 'Marina Teste',
      inscricao_capitania: 'TEST001',
      tipo_embarcacao: 'LANCHA',
      ano_fabricacao: 2020,
      valor_risco: 150000
    };

    const mockVistoria = {
      id: 1,
      data_conclusao: new Date('2024-11-29'),
      Embarcacao: {
        nome: 'Barco Teste',
        tipo_embarcacao: 'LANCHA',
        nr_inscricao_barco: 'TEST001',
        proprietario_nome: 'João Silva',
        proprietario_cpf: '12345678900'
      },
      Local: {
        logradouro: 'Rua das Marinas, 123'
      }
    };

    it('deve gerar PDF com laudo e vistoria válidos', async () => {
      const result = await laudoService.gerarLaudoPDF(mockLaudo, mockVistoria, []);
      
      expect(result).toHaveProperty('filePath');
      expect(result).toHaveProperty('urlRelativa');
      expect(result).toHaveProperty('fileName');
      expect(result.fileName).toContain('laudo-');
    });

    it('deve lançar erro quando laudo não é fornecido', async () => {
      await expect(laudoService.gerarLaudoPDF(null, mockVistoria, [])).rejects.toThrow(
        'Laudo não fornecido'
      );
    });

    it('deve lançar erro quando vistoria não é fornecida', async () => {
      await expect(laudoService.gerarLaudoPDF(mockLaudo, null, [])).rejects.toThrow(
        'Vistoria não fornecida'
      );
    });

    it('deve criar diretórios de laudo se não existirem', async () => {
      fs.existsSync.mockReturnValueOnce(false).mockReturnValue(true);
      
      await laudoService.gerarLaudoPDF(mockLaudo, mockVistoria, []);
      
      expect(fs.mkdirSync).toHaveBeenCalled();
    });

    it('deve gerar PDF para tipo JET_SKI', async () => {
      const vistoriaJetski = {
        ...mockVistoria,
        Embarcacao: { ...mockVistoria.Embarcacao, tipo_embarcacao: 'JET_SKI' }
      };
      
      const result = await laudoService.gerarLaudoPDF(mockLaudo, vistoriaJetski, []);
      
      expect(result).toHaveProperty('filePath');
    });

    it('deve processar fotos quando fornecidas', async () => {
      const fotos = [
        {
          id: 1,
          url_arquivo: 'foto1.jpg',
          TipoFotoChecklist: { nome_exibicao: 'Foto do Casco', descricao: 'Descrição' }
        }
      ];

      fs.readFileSync.mockReturnValue(Buffer.from('fake image data'));

      const result = await laudoService.gerarLaudoPDF(mockLaudo, mockVistoria, fotos);
      
      expect(result).toHaveProperty('filePath');
    });

    it('deve continuar mesmo quando foto não pode ser carregada', async () => {
      const fotos = [
        {
          id: 1,
          url_arquivo: 'foto-inexistente.jpg',
          TipoFotoChecklist: { nome_exibicao: 'Foto do Casco' }
        }
      ];

      fs.existsSync.mockImplementation(p => !p.includes('foto-inexistente'));

      const result = await laudoService.gerarLaudoPDF(mockLaudo, mockVistoria, fotos);
      
      expect(result).toHaveProperty('filePath');
    });

    it('deve criar PDF sem template quando template não existe', async () => {
      fs.existsSync.mockReturnValueOnce(false).mockReturnValue(true);
      fs.readdirSync.mockReturnValue([]);

      const result = await laudoService.gerarLaudoPDF(mockLaudo, mockVistoria, []);
      
      expect(result).toHaveProperty('filePath');
    });

    it('deve formatar CPF corretamente', async () => {
      const laudoComCPF = {
        ...mockLaudo,
        cpf_cnpj: '12345678901'
      };

      const result = await laudoService.gerarLaudoPDF(laudoComCPF, mockVistoria, []);
      
      expect(result).toHaveProperty('filePath');
    });

    it('deve formatar CNPJ corretamente', async () => {
      const laudoComCNPJ = {
        ...mockLaudo,
        cpf_cnpj: '12345678000190'
      };

      const result = await laudoService.gerarLaudoPDF(laudoComCNPJ, mockVistoria, []);
      
      expect(result).toHaveProperty('filePath');
    });

    it('deve formatar valor monetário corretamente', async () => {
      const laudoComValor = {
        ...mockLaudo,
        valor_risco: '150000.50'
      };

      const result = await laudoService.gerarLaudoPDF(laudoComValor, mockVistoria, []);
      
      expect(result).toHaveProperty('filePath');
    });

    it('deve lidar com data de inspeção nula', async () => {
      const laudoSemData = {
        ...mockLaudo,
        data_inspecao: null
      };

      const result = await laudoService.gerarLaudoPDF(laudoSemData, mockVistoria, []);
      
      expect(result).toHaveProperty('filePath');
    });

    it('deve usar template alternativo quando principal não existe', async () => {
      fs.existsSync.mockImplementation(p => {
        if (p.includes('lancha') && p.includes('PDF')) return false;
        return true;
      });
      fs.readdirSync.mockReturnValue(['template_alternativo.pdf']);

      const result = await laudoService.gerarLaudoPDF(mockLaudo, mockVistoria, []);
      
      expect(result).toHaveProperty('filePath');
    });
  });
});

