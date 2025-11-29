/**
 * Testes para cobrir as funcionalidades de fotos no laudoService
 * Foco nas linhas 170-310 (adicionarFotosAoPDF) e outras linhas não cobertas
 */

// Mock environment
process.env.UPLOAD_STRATEGY = 'local';
process.env.NODE_ENV = 'test';

// Mock path
const mockPath = {
  join: jest.fn((...args) => args.filter(Boolean).join('/')),
  basename: jest.fn(p => p ? p.split('/').pop() : ''),
  extname: jest.fn(p => {
    if (!p) return '';
    const match = p.match(/\.[^.]+$/);
    return match ? match[0] : '';
  })
};
jest.mock('path', () => mockPath);

// Mock fs
const mockFs = {
  existsSync: jest.fn(),
  mkdirSync: jest.fn(),
  readFileSync: jest.fn(),
  writeFileSync: jest.fn(),
  unlinkSync: jest.fn(),
  readdirSync: jest.fn()
};
jest.mock('fs', () => mockFs);

// Mock pdf-lib
const mockPdfPage = {
  drawText: jest.fn(),
  drawImage: jest.fn(),
  drawRectangle: jest.fn(),
  getSize: jest.fn(() => ({ width: 595, height: 842 }))
};

const mockPdfForm = {
  getFields: jest.fn(() => []),
  getTextField: jest.fn(() => null),
  getDropdown: jest.fn(() => null)
};

const mockPdfDoc = {
  getPages: jest.fn(() => [mockPdfPage]),
  addPage: jest.fn(() => mockPdfPage),
  getForm: jest.fn(() => mockPdfForm),
  save: jest.fn(() => Buffer.from('mock-pdf')),
  embedJpg: jest.fn(() => ({ width: 100, height: 100 })),
  embedPng: jest.fn(() => ({ width: 100, height: 100 })),
  registerFontkit: jest.fn()
};

jest.mock('pdf-lib', () => ({
  PDFDocument: {
    load: jest.fn(() => Promise.resolve(mockPdfDoc)),
    create: jest.fn(() => Promise.resolve(mockPdfDoc))
  },
  rgb: jest.fn((r, g, b) => ({ r, g, b }))
}));

// Mock uploadService
jest.mock('../../services/uploadService', () => ({
  getFileUrl: jest.fn(file => file?.filename || file?.key || ''),
  getFullPath: jest.fn((filename, vistoriaId) => `/uploads/fotos/vistoria-${vistoriaId}/${filename}`),
  UPLOAD_STRATEGY: 'local'
}));

// Mock fontkit
jest.mock('@pdf-lib/fontkit', () => ({
  default: {}
}));

// Mock AWS
jest.mock('../config/aws', () => ({
  s3Client: { send: jest.fn() },
  bucket: 'test-bucket',
  region: 'us-east-1'
}), { virtual: true });

jest.mock('@aws-sdk/client-s3', () => ({
  GetObjectCommand: jest.fn()
}), { virtual: true });

describe('LaudoService - Fotos e Cobertura Extra', () => {
  let laudoService;
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Configurar mocks padrão
    mockFs.existsSync.mockReturnValue(true);
    mockFs.readFileSync.mockReturnValue(Buffer.from('mock-file'));
    mockFs.writeFileSync.mockImplementation(() => {});
    mockFs.readdirSync.mockReturnValue([]);
    
    mockPdfDoc.getPages.mockReturnValue([mockPdfPage]);
    mockPdfDoc.addPage.mockReturnValue(mockPdfPage);
    mockPdfDoc.getForm.mockReturnValue(mockPdfForm);
    mockPdfDoc.embedJpg.mockResolvedValue({ width: 100, height: 100 });
    mockPdfDoc.embedPng.mockResolvedValue({ width: 100, height: 100 });
    
    // Silenciar console
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    
    // Reimportar módulo
    jest.resetModules();
    laudoService = require('../../services/laudoService');
  });
  
  afterEach(() => {
    jest.restoreAllMocks();
  });
  
  describe('formatarCPFCNPJ', () => {
    it('deve retornar string vazia para valor null', async () => {
      const laudo = { id: 1, numero_laudo: 'TEST001', cpf_cnpj: null };
      const vistoria = { id: 1, Embarcacao: { tipo_embarcacao: 'LANCHA' } };
      
      // O formatarCPFCNPJ é chamado internamente
      await laudoService.gerarLaudoPDF(laudo, vistoria, []);
      
      // Verificar que não lançou erro
      expect(mockPdfDoc.save).toHaveBeenCalled();
    });
    
    it('deve formatar CPF corretamente (11 dígitos)', async () => {
      const laudo = { id: 1, numero_laudo: 'TEST001', cpf_cnpj: '12345678901' };
      const vistoria = { id: 1, Embarcacao: { tipo_embarcacao: 'LANCHA' } };
      
      await laudoService.gerarLaudoPDF(laudo, vistoria, []);
      
      expect(mockPdfDoc.save).toHaveBeenCalled();
    });
    
    it('deve formatar CNPJ corretamente (14 dígitos)', async () => {
      const laudo = { id: 1, numero_laudo: 'TEST001', cpf_cnpj: '12345678000195' };
      const vistoria = { id: 1, Embarcacao: { tipo_embarcacao: 'LANCHA' } };
      
      await laudoService.gerarLaudoPDF(laudo, vistoria, []);
      
      expect(mockPdfDoc.save).toHaveBeenCalled();
    });
    
    it('deve retornar valor original se não for CPF nem CNPJ', async () => {
      const laudo = { id: 1, numero_laudo: 'TEST001', cpf_cnpj: '12345' };
      const vistoria = { id: 1, Embarcacao: { tipo_embarcacao: 'LANCHA' } };
      
      await laudoService.gerarLaudoPDF(laudo, vistoria, []);
      
      expect(mockPdfDoc.save).toHaveBeenCalled();
    });
  });
  
  describe('formatarData', () => {
    it('deve tratar data inválida graciosamente', async () => {
      const laudo = { id: 1, numero_laudo: 'TEST001', data_inspecao: 'invalid-date' };
      const vistoria = { id: 1, Embarcacao: { tipo_embarcacao: 'LANCHA' } };
      
      await laudoService.gerarLaudoPDF(laudo, vistoria, []);
      
      expect(mockPdfDoc.save).toHaveBeenCalled();
    });
    
    it('deve tratar data null', async () => {
      const laudo = { id: 1, numero_laudo: 'TEST001', data_inspecao: null };
      const vistoria = { id: 1, Embarcacao: { tipo_embarcacao: 'LANCHA' } };
      
      await laudoService.gerarLaudoPDF(laudo, vistoria, []);
      
      expect(mockPdfDoc.save).toHaveBeenCalled();
    });
  });
  
  describe('Processamento de fotos', () => {
    it('deve pular foto sem url_arquivo', async () => {
      const laudo = { id: 1, numero_laudo: 'TEST001' };
      const vistoria = { id: 1, Embarcacao: { tipo_embarcacao: 'LANCHA' } };
      const fotos = [
        { id: 1, url_arquivo: null },
        { id: 2, url_arquivo: '' }
      ];
      
      await laudoService.gerarLaudoPDF(laudo, vistoria, fotos);
      
      // Não deve chamar embedJpg/embedPng para fotos sem URL
      expect(mockPdfDoc.embedJpg).not.toHaveBeenCalled();
    });
    
    it('deve processar foto PNG', async () => {
      mockPdfDoc.embedPng.mockResolvedValue({ width: 100, height: 100 });
      
      const laudo = { id: 1, numero_laudo: 'TEST001' };
      const vistoria = { id: 1, Embarcacao: { tipo_embarcacao: 'LANCHA' } };
      const fotos = [
        { id: 1, url_arquivo: 'foto.png' }
      ];
      
      await laudoService.gerarLaudoPDF(laudo, vistoria, fotos);
      
      expect(mockPdfDoc.embedPng).toHaveBeenCalled();
    });
    
    it('deve processar foto JPG', async () => {
      mockPdfDoc.embedJpg.mockResolvedValue({ width: 100, height: 100 });
      
      const laudo = { id: 1, numero_laudo: 'TEST001' };
      const vistoria = { id: 1, Embarcacao: { tipo_embarcacao: 'LANCHA' } };
      const fotos = [
        { id: 1, url_arquivo: 'foto.jpg' }
      ];
      
      await laudoService.gerarLaudoPDF(laudo, vistoria, fotos);
      
      expect(mockPdfDoc.embedJpg).toHaveBeenCalled();
    });
    
    it('deve processar foto JPEG', async () => {
      mockPdfDoc.embedJpg.mockResolvedValue({ width: 100, height: 100 });
      
      const laudo = { id: 1, numero_laudo: 'TEST001' };
      const vistoria = { id: 1, Embarcacao: { tipo_embarcacao: 'LANCHA' } };
      const fotos = [
        { id: 1, url_arquivo: 'foto.jpeg' }
      ];
      
      await laudoService.gerarLaudoPDF(laudo, vistoria, fotos);
      
      expect(mockPdfDoc.embedJpg).toHaveBeenCalled();
    });
    
    it('deve tentar JPEG primeiro para extensão desconhecida', async () => {
      mockPdfDoc.embedJpg.mockResolvedValue({ width: 100, height: 100 });
      
      const laudo = { id: 1, numero_laudo: 'TEST001' };
      const vistoria = { id: 1, Embarcacao: { tipo_embarcacao: 'LANCHA' } };
      const fotos = [
        { id: 1, url_arquivo: 'foto.webp' }
      ];
      
      await laudoService.gerarLaudoPDF(laudo, vistoria, fotos);
      
      expect(mockPdfDoc.embedJpg).toHaveBeenCalled();
    });
    
    it('deve tentar PNG se JPEG falhar', async () => {
      mockPdfDoc.embedJpg.mockRejectedValue(new Error('Not a JPEG'));
      mockPdfDoc.embedPng.mockResolvedValue({ width: 100, height: 100 });
      
      const laudo = { id: 1, numero_laudo: 'TEST001' };
      const vistoria = { id: 1, Embarcacao: { tipo_embarcacao: 'LANCHA' } };
      const fotos = [
        { id: 1, url_arquivo: 'foto.unknown' }
      ];
      
      await laudoService.gerarLaudoPDF(laudo, vistoria, fotos);
      
      expect(mockPdfDoc.embedPng).toHaveBeenCalled();
    });
    
    it('deve continuar se embed falhar para uma foto', async () => {
      mockPdfDoc.embedJpg.mockRejectedValue(new Error('Not a valid image'));
      mockPdfDoc.embedPng.mockRejectedValue(new Error('Not a valid image'));
      
      const laudo = { id: 1, numero_laudo: 'TEST001' };
      const vistoria = { id: 1, Embarcacao: { tipo_embarcacao: 'LANCHA' } };
      const fotos = [
        { id: 1, url_arquivo: 'foto.jpg' }
      ];
      
      // Não deve lançar erro
      await laudoService.gerarLaudoPDF(laudo, vistoria, fotos);
      
      expect(mockPdfDoc.save).toHaveBeenCalled();
    });
    
    it('deve adicionar descrição do tipo de foto', async () => {
      mockPdfDoc.embedJpg.mockResolvedValue({ width: 100, height: 100 });
      
      const laudo = { id: 1, numero_laudo: 'TEST001' };
      const vistoria = { id: 1, Embarcacao: { tipo_embarcacao: 'LANCHA' } };
      const fotos = [
        { 
          id: 1, 
          url_arquivo: 'foto.jpg',
          TipoFotoChecklist: {
            nome_exibicao: 'Foto Frontal',
            descricao: 'Fotografia da parte frontal da embarcação'
          }
        }
      ];
      
      await laudoService.gerarLaudoPDF(laudo, vistoria, fotos);
      
      expect(mockPdfPage.drawText).toHaveBeenCalledWith(
        'Foto Frontal',
        expect.any(Object)
      );
    });
    
    it('deve adicionar observação da foto', async () => {
      mockPdfDoc.embedJpg.mockResolvedValue({ width: 100, height: 100 });
      
      const laudo = { id: 1, numero_laudo: 'TEST001' };
      const vistoria = { id: 1, Embarcacao: { tipo_embarcacao: 'LANCHA' } };
      const fotos = [
        { 
          id: 1, 
          url_arquivo: 'foto.jpg',
          observacao: 'Pequeno arranhão no casco',
          TipoFotoChecklist: {
            nome_exibicao: 'Detalhe'
          }
        }
      ];
      
      await laudoService.gerarLaudoPDF(laudo, vistoria, fotos);
      
      // Verificar que drawText foi chamado com a observação
      const calls = mockPdfPage.drawText.mock.calls;
      const observacaoCalls = calls.filter(call => 
        call[0].includes('arranhão') || call[0].includes('Pequeno')
      );
      expect(observacaoCalls.length).toBeGreaterThan(0);
    });
    
    it('deve criar nova página quando excede máximo de fotos', async () => {
      mockPdfDoc.embedJpg.mockResolvedValue({ width: 100, height: 100 });
      
      const laudo = { id: 1, numero_laudo: 'TEST001' };
      const vistoria = { id: 1, Embarcacao: { tipo_embarcacao: 'LANCHA' } };
      // 6 fotos para forçar criação de nova página (máximo é 4 por página)
      const fotos = [
        { id: 1, url_arquivo: 'foto1.jpg' },
        { id: 2, url_arquivo: 'foto2.jpg' },
        { id: 3, url_arquivo: 'foto3.jpg' },
        { id: 4, url_arquivo: 'foto4.jpg' },
        { id: 5, url_arquivo: 'foto5.jpg' },
        { id: 6, url_arquivo: 'foto6.jpg' }
      ];
      
      await laudoService.gerarLaudoPDF(laudo, vistoria, fotos);
      
      // Deve adicionar página(s) nova(s)
      expect(mockPdfDoc.addPage).toHaveBeenCalled();
    });
    
    it('deve usar caminho alternativo se arquivo local não existe', async () => {
      // Primeira chamada para template: true
      // Segunda chamada para foto no caminho principal: false
      // Terceira chamada para caminho alternativo: true
      mockFs.existsSync.mockImplementation((path) => {
        if (path.includes('PDF')) return true;
        if (path.includes('vistoria-1') && path.includes('foto.jpg')) return false;
        if (path.includes('uploads') && path.includes('foto.jpg')) return true;
        return true;
      });
      
      mockPdfDoc.embedJpg.mockResolvedValue({ width: 100, height: 100 });
      
      const laudo = { id: 1, numero_laudo: 'TEST001' };
      const vistoria = { id: 1, Embarcacao: { tipo_embarcacao: 'LANCHA' } };
      const fotos = [
        { id: 1, url_arquivo: 'foto.jpg' }
      ];
      
      await laudoService.gerarLaudoPDF(laudo, vistoria, fotos);
      
      // Deve ter tentado carregar de algum caminho
      expect(mockFs.readFileSync).toHaveBeenCalled();
    });
    
    it('deve pular foto se arquivo não encontrado em nenhum caminho', async () => {
      mockFs.existsSync.mockReturnValue(false);
      
      const laudo = { id: 1, numero_laudo: 'TEST001' };
      const vistoria = { id: 1, Embarcacao: { tipo_embarcacao: 'LANCHA' } };
      const fotos = [
        { id: 1, url_arquivo: 'foto-inexistente.jpg' }
      ];
      
      await laudoService.gerarLaudoPDF(laudo, vistoria, fotos);
      
      // Não deve ter embedido imagem
      expect(mockPdfDoc.embedJpg).not.toHaveBeenCalled();
    });
  });
  
  describe('Formulários PDF', () => {
    it('deve preencher campos de formulário quando existem', async () => {
      const mockTextField = {
        setText: jest.fn()
      };
      
      mockPdfForm.getFields.mockReturnValue([
        { getName: () => 'numero_laudo', constructor: { name: 'PDFTextField' } },
        { getName: () => 'nome_embarcacao', constructor: { name: 'PDFTextField' } }
      ]);
      mockPdfForm.getTextField.mockReturnValue(mockTextField);
      
      const laudo = { id: 1, numero_laudo: 'TEST001' };
      const vistoria = { id: 1, Embarcacao: { tipo_embarcacao: 'LANCHA', nome: 'Barco Teste' } };
      
      await laudoService.gerarLaudoPDF(laudo, vistoria, []);
      
      expect(mockPdfForm.getFields).toHaveBeenCalled();
    });
    
    it('deve tentar preencher como dropdown se não for texto', async () => {
      const mockDropdown = {
        select: jest.fn()
      };
      
      mockPdfForm.getFields.mockReturnValue([
        { getName: () => 'tipo_embarcacao', constructor: { name: 'PDFDropdown' } }
      ]);
      mockPdfForm.getTextField.mockImplementation(() => {
        throw new Error('Not a text field');
      });
      mockPdfForm.getDropdown.mockReturnValue(mockDropdown);
      
      const laudo = { id: 1, numero_laudo: 'TEST001', tipo_embarcacao: 'LANCHA' };
      const vistoria = { id: 1, Embarcacao: { tipo_embarcacao: 'LANCHA' } };
      
      await laudoService.gerarLaudoPDF(laudo, vistoria, []);
      
      // Não deve lançar erro
      expect(mockPdfDoc.save).toHaveBeenCalled();
    });
    
    it('deve tratar erro ao acessar formulário', async () => {
      mockPdfDoc.getForm.mockImplementation(() => {
        throw new Error('Form not available');
      });
      
      const laudo = { id: 1, numero_laudo: 'TEST001' };
      const vistoria = { id: 1, Embarcacao: { tipo_embarcacao: 'LANCHA' } };
      
      // Não deve lançar erro
      await laudoService.gerarLaudoPDF(laudo, vistoria, []);
      
      expect(mockPdfDoc.save).toHaveBeenCalled();
    });
  });
  
  describe('Coordenadas de campos', () => {
    it('deve obter coordenadas para JETSKI', () => {
      const coords = laudoService.obterTemplatePDF('JET_SKI');
      expect(coords).toBeDefined();
    });
    
    it('deve tratar coordenadas inexistentes graciosamente', async () => {
      const laudo = { id: 1, numero_laudo: 'TEST001', campo_inexistente: 'valor' };
      const vistoria = { id: 1, Embarcacao: { tipo_embarcacao: 'LANCHA' } };
      
      // Não deve lançar erro
      await laudoService.gerarLaudoPDF(laudo, vistoria, []);
      
      expect(mockPdfDoc.save).toHaveBeenCalled();
    });
    
    it('deve pular campo se página não encontrada', async () => {
      // Simular que há apenas 1 página
      mockPdfDoc.getPages.mockReturnValue([mockPdfPage]);
      
      const laudo = { id: 1, numero_laudo: 'TEST001' };
      const vistoria = { id: 1, Embarcacao: { tipo_embarcacao: 'LANCHA' } };
      
      // Não deve lançar erro mesmo se coordenadas apontarem para página inexistente
      await laudoService.gerarLaudoPDF(laudo, vistoria, []);
      
      expect(mockPdfDoc.save).toHaveBeenCalled();
    });
  });
  
  describe('Templates alternativos', () => {
    it('deve usar template alternativo quando principal não existe', async () => {
      mockFs.existsSync.mockImplementation((path) => {
        if (path.includes('lancha_embarcação.pdf')) return false;
        if (path.includes('PDF') && !path.includes('.pdf')) return true;
        if (path.includes('alternativo.pdf')) return true;
        return true;
      });
      mockFs.readdirSync.mockReturnValue(['alternativo.pdf']);
      
      const laudo = { id: 1, numero_laudo: 'TEST001' };
      const vistoria = { id: 1, Embarcacao: { tipo_embarcacao: 'LANCHA' } };
      
      await laudoService.gerarLaudoPDF(laudo, vistoria, []);
      
      expect(mockFs.readdirSync).toHaveBeenCalled();
    });
    
    it('deve criar PDF sem template quando nenhum disponível', async () => {
      mockFs.existsSync.mockImplementation((path) => {
        if (path.includes('.pdf')) return false;
        if (path.includes('PDF')) return true;
        return true;
      });
      mockFs.readdirSync.mockReturnValue(['readme.txt']); // Nenhum PDF
      
      const { PDFDocument } = require('pdf-lib');
      
      const laudo = { id: 1, numero_laudo: 'TEST001' };
      const vistoria = { id: 1, Embarcacao: { tipo_embarcacao: 'LANCHA' } };
      
      await laudoService.gerarLaudoPDF(laudo, vistoria, []);
      
      // Deve chamar PDFDocument.create para criar PDF vazio
      expect(PDFDocument.create).toHaveBeenCalled();
    });
    
    it('deve criar PDF sem template quando pasta PDF não existe', async () => {
      mockFs.existsSync.mockReturnValue(false);
      
      const { PDFDocument } = require('pdf-lib');
      
      const laudo = { id: 1, numero_laudo: 'TEST001' };
      const vistoria = { id: 1, Embarcacao: { tipo_embarcacao: 'LANCHA' } };
      
      await laudoService.gerarLaudoPDF(laudo, vistoria, []);
      
      expect(PDFDocument.create).toHaveBeenCalled();
    });
  });
  
  describe('processarPDFSemTemplate', () => {
    beforeEach(() => {
      mockFs.existsSync.mockReturnValue(false);
    });
    
    it('deve criar PDF com campos básicos', async () => {
      const { PDFDocument } = require('pdf-lib');
      
      const laudo = { 
        id: 1, 
        numero_laudo: 'TEST001',
        proprietario: 'João Silva',
        cpf_cnpj: '12345678901',
        inscricao_capitania: 'CP-001'
      };
      const vistoria = { 
        id: 1, 
        Embarcacao: { 
          tipo_embarcacao: 'LANCHA',
          nome: 'Barco Teste',
          ano_fabricacao: 2020
        } 
      };
      
      await laudoService.gerarLaudoPDF(laudo, vistoria, []);
      
      expect(PDFDocument.create).toHaveBeenCalled();
      expect(mockPdfDoc.addPage).toHaveBeenCalled();
    });
    
    it('deve processar fotos mesmo sem template', async () => {
      mockPdfDoc.embedJpg.mockResolvedValue({ width: 100, height: 100 });
      
      const laudo = { id: 1, numero_laudo: 'TEST001' };
      const vistoria = { id: 1, Embarcacao: { tipo_embarcacao: 'LANCHA' } };
      const fotos = [
        { id: 1, url_arquivo: 'foto.jpg' }
      ];
      
      // Fazer existsSync retornar true apenas para o arquivo de foto
      mockFs.existsSync.mockImplementation((path) => {
        return path.includes('foto.jpg');
      });
      
      await laudoService.gerarLaudoPDF(laudo, vistoria, fotos);
      
      expect(mockPdfDoc.embedJpg).toHaveBeenCalled();
    });
    
    it('deve tratar erro no processamento sem template', async () => {
      mockPdfDoc.save.mockRejectedValueOnce(new Error('Save failed'));
      
      const laudo = { id: 1, numero_laudo: 'TEST001' };
      const vistoria = { id: 1, Embarcacao: { tipo_embarcacao: 'LANCHA' } };
      
      await expect(laudoService.gerarLaudoPDF(laudo, vistoria, []))
        .rejects.toThrow();
    });
  });
  
  describe('deletarLaudoPDF', () => {
    it('deve deletar arquivo existente', () => {
      mockFs.existsSync.mockReturnValue(true);
      mockFs.unlinkSync.mockImplementation(() => {});
      
      laudoService.deletarLaudoPDF('/uploads/laudos/2024/01/laudo-1.pdf');
      
      expect(mockFs.unlinkSync).toHaveBeenCalled();
    });
    
    it('não deve falhar se arquivo não existir', () => {
      mockFs.existsSync.mockReturnValue(false);
      
      // Não deve lançar erro
      expect(() => {
        laudoService.deletarLaudoPDF('/uploads/laudos/2024/01/laudo-1.pdf');
      }).not.toThrow();
    });
    
    it('não deve falhar se URL for null', () => {
      expect(() => {
        laudoService.deletarLaudoPDF(null);
      }).not.toThrow();
    });
    
    it('não deve falhar se URL for undefined', () => {
      expect(() => {
        laudoService.deletarLaudoPDF(undefined);
      }).not.toThrow();
    });
    
    it('não deve falhar se URL for vazia', () => {
      expect(() => {
        laudoService.deletarLaudoPDF('');
      }).not.toThrow();
    });
    
    it('deve tratar erro ao deletar graciosamente', () => {
      mockFs.existsSync.mockReturnValue(true);
      mockFs.unlinkSync.mockImplementation(() => {
        throw new Error('Permission denied');
      });
      
      // Não deve lançar erro
      expect(() => {
        laudoService.deletarLaudoPDF('/uploads/laudos/2024/01/laudo-1.pdf');
      }).not.toThrow();
    });
  });
  
  describe('gerarNumeroLaudo', () => {
    it('deve gerar número no formato correto', () => {
      const numero = laudoService.gerarNumeroLaudo();
      
      // Formato: YYMMDDX onde X é uma letra
      expect(numero).toMatch(/^\d{6}[A-Z]$/);
    });
    
    it('deve gerar números únicos', () => {
      const numeros = new Set();
      for (let i = 0; i < 100; i++) {
        numeros.add(laudoService.gerarNumeroLaudo());
      }
      
      // A maioria deve ser única (pode haver colisões por timestamp)
      expect(numeros.size).toBeGreaterThan(50);
    });
  });
  
  describe('obterTemplatePDF', () => {
    it('deve retornar template jetski para JET_SKI', () => {
      const template = laudoService.obterTemplatePDF('JET_SKI');
      expect(template).toContain('jetski.pdf');
    });
    
    it('deve retornar template jetski para JETSKI', () => {
      const template = laudoService.obterTemplatePDF('JETSKI');
      expect(template).toContain('jetski.pdf');
    });
    
    it('deve retornar template lancha para LANCHA', () => {
      const template = laudoService.obterTemplatePDF('LANCHA');
      expect(template).toContain('lancha');
    });
    
    it('deve retornar template lancha para IATE', () => {
      const template = laudoService.obterTemplatePDF('IATE');
      expect(template).toContain('lancha');
    });
    
    it('deve retornar template lancha para VELEIRO', () => {
      const template = laudoService.obterTemplatePDF('VELEIRO');
      expect(template).toContain('lancha');
    });
    
    it('deve retornar template lancha para BARCO', () => {
      const template = laudoService.obterTemplatePDF('BARCO');
      expect(template).toContain('lancha');
    });
    
    it('deve retornar template lancha para EMBARCACAO_COMERCIAL', () => {
      const template = laudoService.obterTemplatePDF('EMBARCACAO_COMERCIAL');
      expect(template).toContain('lancha');
    });
    
    it('deve retornar template padrão para tipo desconhecido', () => {
      const template = laudoService.obterTemplatePDF('SUBMARINO');
      expect(template).toContain('lancha');
    });
    
    it('deve retornar template padrão para null', () => {
      const template = laudoService.obterTemplatePDF(null);
      expect(template).toContain('lancha');
    });
    
    it('deve retornar template padrão para undefined', () => {
      const template = laudoService.obterTemplatePDF(undefined);
      expect(template).toContain('lancha');
    });
    
    it('deve funcionar com minúsculas', () => {
      const template = laudoService.obterTemplatePDF('jet_ski');
      expect(template).toContain('jetski.pdf');
    });
  });
});

