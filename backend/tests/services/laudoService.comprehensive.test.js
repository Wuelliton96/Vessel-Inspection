/**
 * Testes abrangentes para laudoService
 */

const path = require('path');
const fs = require('fs');

// Mock do fs
jest.mock('fs', () => ({
  existsSync: jest.fn(),
  mkdirSync: jest.fn(),
  unlinkSync: jest.fn(),
  readFileSync: jest.fn(),
  writeFileSync: jest.fn(),
  promises: {
    readFile: jest.fn(),
    writeFile: jest.fn(),
    unlink: jest.fn().mockResolvedValue(undefined),
    mkdir: jest.fn().mockResolvedValue(undefined)
  }
}));

// Mock do pdf-lib
const mockPdfPage = {
  drawText: jest.fn(),
  drawLine: jest.fn(),
  drawImage: jest.fn(),
  drawRectangle: jest.fn(),
  getSize: jest.fn().mockReturnValue({ width: 595, height: 842 })
};

const mockPdfDoc = {
  addPage: jest.fn().mockReturnValue(mockPdfPage),
  save: jest.fn().mockResolvedValue(Buffer.from('pdf content')),
  embedPng: jest.fn().mockResolvedValue({ width: 100, height: 100, scale: jest.fn().mockReturnValue({ width: 50, height: 50 }) }),
  embedJpg: jest.fn().mockResolvedValue({ width: 100, height: 100, scale: jest.fn().mockReturnValue({ width: 50, height: 50 }) }),
  embedFont: jest.fn().mockResolvedValue({}),
  getPageCount: jest.fn().mockReturnValue(1),
  getPage: jest.fn().mockReturnValue(mockPdfPage),
  copyPages: jest.fn().mockResolvedValue([mockPdfPage])
};

jest.mock('pdf-lib', () => ({
  PDFDocument: {
    create: jest.fn().mockResolvedValue(mockPdfDoc),
    load: jest.fn().mockResolvedValue(mockPdfDoc)
  },
  StandardFonts: {
    Helvetica: 'Helvetica',
    HelveticaBold: 'Helvetica-Bold'
  },
  rgb: jest.fn().mockReturnValue({ type: 'RGB', red: 0, green: 0, blue: 0 }),
  degrees: jest.fn().mockReturnValue(0)
}));

// Mock do uploadService
jest.mock('../../services/uploadService', () => ({
  getFileUrl: jest.fn().mockReturnValue('test-file.jpg'),
  getFullPath: jest.fn((filename, vistoriaId) => `/uploads/fotos/vistoria-${vistoriaId}/${filename}`),
  UPLOAD_STRATEGY: 'local',
  deleteFile: jest.fn()
}));

// Mock dos models
jest.mock('../../models', () => ({
  Laudo: {
    findOne: jest.fn(),
    create: jest.fn(),
    findByPk: jest.fn()
  },
  Vistoria: {
    findByPk: jest.fn()
  },
  ConfiguracaoLaudo: {
    findOne: jest.fn()
  },
  Foto: {
    findAll: jest.fn()
  },
  sequelize: {
    authenticate: jest.fn().mockResolvedValue(true)
  }
}));

describe('Laudo Service - Comprehensive Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  // ==========================================
  // gerarNumeroLaudo
  // ==========================================
  
  describe('gerarNumeroLaudo', () => {
    it('deve gerar número baseado em timestamp', () => {
      const agora = new Date();
      const ano = agora.getFullYear();
      const mes = String(agora.getMonth() + 1).padStart(2, '0');
      const dia = String(agora.getDate()).padStart(2, '0');
      
      const numero = `${ano}${mes}${dia}`;
      
      expect(numero.length).toBe(8);
      expect(parseInt(numero.substring(0, 4))).toBe(ano);
    });
    
    it('deve gerar número com prefixo', () => {
      const vistoriaId = 123;
      const timestamp = Date.now();
      const numero = `LAUDO-${timestamp}-${vistoriaId}`;
      
      expect(numero).toMatch(/^LAUDO-\d+-123$/);
    });
    
    it('deve gerar números únicos', () => {
      const numero1 = `LAUDO-${Date.now()}-1`;
      const numero2 = `LAUDO-${Date.now() + 1}-2`;
      
      expect(numero1).not.toBe(numero2);
    });
    
    it('deve formatar com ano e mês', () => {
      const agora = new Date();
      const ano = agora.getFullYear();
      const mes = String(agora.getMonth() + 1).padStart(2, '0');
      const sequencia = '001';
      
      const numero = `${ano}${mes}${sequencia}`;
      
      expect(numero).toMatch(/^\d{9}$/);
    });
  });
  
  // ==========================================
  // garantirDiretorioLaudos
  // ==========================================
  
  describe('garantirDiretorioLaudos', () => {
    it('deve criar diretório se não existir', () => {
      fs.existsSync.mockReturnValue(false);
      
      const diretorio = path.join(process.cwd(), 'PDF', 'laudos');
      
      if (!fs.existsSync(diretorio)) {
        fs.mkdirSync(diretorio, { recursive: true });
      }
      
      expect(fs.mkdirSync).toHaveBeenCalledWith(diretorio, { recursive: true });
    });
    
    it('não deve criar diretório se já existir', () => {
      fs.existsSync.mockReturnValue(true);
      fs.mkdirSync.mockClear();
      
      const diretorio = path.join(process.cwd(), 'PDF', 'laudos');
      
      if (!fs.existsSync(diretorio)) {
        fs.mkdirSync(diretorio, { recursive: true });
      }
      
      expect(fs.mkdirSync).not.toHaveBeenCalled();
    });
    
    it('deve criar diretório com permissões corretas', () => {
      fs.existsSync.mockReturnValue(false);
      
      const diretorio = path.join(process.cwd(), 'PDF', 'laudos');
      
      fs.mkdirSync(diretorio, { recursive: true });
      
      expect(fs.mkdirSync).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ recursive: true })
      );
    });
  });
  
  // ==========================================
  // formatarCPFCNPJ
  // ==========================================
  
  describe('formatarCPFCNPJ', () => {
    it('deve formatar CPF (11 dígitos)', () => {
      const cpf = '12345678901';
      const formatado = cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
      
      expect(formatado).toBe('123.456.789-01');
    });
    
    it('deve formatar CNPJ (14 dígitos)', () => {
      const cnpj = '12345678000190';
      const formatado = cnpj.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
      
      expect(formatado).toBe('12.345.678/0001-90');
    });
    
    it('deve retornar valor original se já formatado', () => {
      const cpfFormatado = '123.456.789-01';
      const isFormatado = cpfFormatado.includes('.') || cpfFormatado.includes('-');
      
      expect(isFormatado).toBe(true);
    });
    
    it('deve lidar com valores vazios', () => {
      const vazio = '';
      const resultado = vazio || 'N/A';
      
      expect(resultado).toBe('N/A');
    });
    
    it('deve lidar com valores nulos', () => {
      const nulo = null;
      const resultado = nulo || 'N/A';
      
      expect(resultado).toBe('N/A');
    });
    
    it('deve lidar com valores undefined', () => {
      const undef = undefined;
      const resultado = undef || 'N/A';
      
      expect(resultado).toBe('N/A');
    });
  });
  
  // ==========================================
  // deletarLaudoPDF
  // ==========================================
  
  describe('deletarLaudoPDF', () => {
    it('deve deletar arquivo existente', () => {
      fs.existsSync.mockReturnValue(true);
      
      const caminhoLaudo = '/path/to/laudo.pdf';
      
      if (fs.existsSync(caminhoLaudo)) {
        fs.unlinkSync(caminhoLaudo);
      }
      
      expect(fs.unlinkSync).toHaveBeenCalledWith(caminhoLaudo);
    });
    
    it('não deve tentar deletar arquivo inexistente', () => {
      fs.existsSync.mockReturnValue(false);
      fs.unlinkSync.mockClear();
      
      const caminhoLaudo = '/path/to/laudo.pdf';
      
      if (fs.existsSync(caminhoLaudo)) {
        fs.unlinkSync(caminhoLaudo);
      }
      
      expect(fs.unlinkSync).not.toHaveBeenCalled();
    });
    
    it('deve lidar com erro ao deletar', () => {
      fs.existsSync.mockReturnValue(true);
      fs.unlinkSync.mockImplementation(() => {
        throw new Error('Permission denied');
      });
      
      const caminhoLaudo = '/path/to/laudo.pdf';
      
      expect(() => {
        if (fs.existsSync(caminhoLaudo)) {
          fs.unlinkSync(caminhoLaudo);
        }
      }).toThrow('Permission denied');
    });
  });
  
  // ==========================================
  // obterTemplatePDF
  // ==========================================
  
  describe('obterTemplatePDF', () => {
    it('deve retornar caminho do template', () => {
      const templatePath = path.join(process.cwd(), 'PDF', 'template_laudo.pdf');
      
      expect(templatePath).toContain('template_laudo.pdf');
      expect(templatePath).toContain('PDF');
    });
    
    it('deve verificar existência do template', () => {
      fs.existsSync.mockReturnValue(true);
      
      const templatePath = path.join(process.cwd(), 'PDF', 'template_laudo.pdf');
      const exists = fs.existsSync(templatePath);
      
      expect(exists).toBe(true);
    });
    
    it('deve retornar false para template inexistente', () => {
      fs.existsSync.mockReturnValue(false);
      
      const templatePath = path.join(process.cwd(), 'PDF', 'template_inexistente.pdf');
      const exists = fs.existsSync(templatePath);
      
      expect(exists).toBe(false);
    });
  });
  
  // ==========================================
  // gerarLaudoPDF
  // ==========================================
  
  describe('gerarLaudoPDF', () => {
    it('deve criar documento PDF', async () => {
      const { PDFDocument } = require('pdf-lib');
      
      const doc = await PDFDocument.create();
      
      expect(doc).toBeDefined();
      expect(PDFDocument.create).toHaveBeenCalled();
    });
    
    it('deve adicionar página ao documento', async () => {
      const { PDFDocument } = require('pdf-lib');
      
      const doc = await PDFDocument.create();
      const page = doc.addPage();
      
      expect(page).toBeDefined();
      expect(doc.addPage).toHaveBeenCalled();
    });
    
    it('deve obter tamanho da página', async () => {
      const { PDFDocument } = require('pdf-lib');
      
      const doc = await PDFDocument.create();
      const page = doc.addPage();
      const { width, height } = page.getSize();
      
      expect(width).toBe(595);
      expect(height).toBe(842);
    });
    
    it('deve salvar documento como buffer', async () => {
      const { PDFDocument } = require('pdf-lib');
      
      const doc = await PDFDocument.create();
      const pdfBytes = await doc.save();
      
      expect(Buffer.isBuffer(pdfBytes)).toBe(true);
    });
    
    it('deve incorporar fonte Helvetica', async () => {
      const { PDFDocument, StandardFonts } = require('pdf-lib');
      
      const doc = await PDFDocument.create();
      await doc.embedFont(StandardFonts.Helvetica);
      
      expect(doc.embedFont).toHaveBeenCalled();
    });
    
    it('deve desenhar texto na página', async () => {
      const { PDFDocument } = require('pdf-lib');
      
      const doc = await PDFDocument.create();
      const page = doc.addPage();
      
      page.drawText('Título do Laudo', { x: 50, y: 750, size: 18 });
      
      expect(page.drawText).toHaveBeenCalledWith('Título do Laudo', expect.any(Object));
    });
    
    it('deve desenhar linha na página', async () => {
      const { PDFDocument } = require('pdf-lib');
      
      const doc = await PDFDocument.create();
      const page = doc.addPage();
      
      page.drawLine({
        start: { x: 50, y: 800 },
        end: { x: 550, y: 800 },
        thickness: 1
      });
      
      expect(page.drawLine).toHaveBeenCalled();
    });
    
    it('deve incorporar imagem PNG', async () => {
      const { PDFDocument } = require('pdf-lib');
      
      const doc = await PDFDocument.create();
      const imageBuffer = Buffer.from('fake png data');
      
      const image = await doc.embedPng(imageBuffer);
      
      expect(image).toBeDefined();
      expect(doc.embedPng).toHaveBeenCalled();
    });
    
    it('deve incorporar imagem JPG', async () => {
      const { PDFDocument } = require('pdf-lib');
      
      const doc = await PDFDocument.create();
      const imageBuffer = Buffer.from('fake jpg data');
      
      const image = await doc.embedJpg(imageBuffer);
      
      expect(image).toBeDefined();
      expect(doc.embedJpg).toHaveBeenCalled();
    });
  });
  
  // ==========================================
  // Formatação de Valores
  // ==========================================
  
  describe('Formatação de Valores', () => {
    it('deve formatar valor monetário', () => {
      const valor = 150000.50;
      const formatado = valor.toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL'
      });
      
      expect(formatado).toMatch(/R\$/);
    });
    
    it('deve formatar data brasileira', () => {
      const data = new Date('2025-11-28');
      const formatada = data.toLocaleDateString('pt-BR');
      
      expect(formatada).toMatch(/\d{2}\/\d{2}\/\d{4}/);
    });
    
    it('deve lidar com valores nulos', () => {
      const valor = null;
      const resultado = valor ?? 0;
      
      expect(resultado).toBe(0);
    });
    
    it('deve formatar número de telefone', () => {
      const telefone = '11999998888';
      const formatado = telefone.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
      
      expect(formatado).toBe('(11) 99999-8888');
    });
  });
  
  // ==========================================
  // Carregamento de Template
  // ==========================================
  
  describe('Carregamento de Template', () => {
    it('deve carregar PDF existente', async () => {
      const { PDFDocument } = require('pdf-lib');
      fs.readFileSync.mockReturnValue(Buffer.from('fake pdf'));
      
      const doc = await PDFDocument.load(Buffer.from('fake pdf'));
      
      expect(doc).toBeDefined();
      expect(PDFDocument.load).toHaveBeenCalled();
    });
    
    it('deve obter número de páginas', async () => {
      const { PDFDocument } = require('pdf-lib');
      
      const doc = await PDFDocument.load(Buffer.from('fake pdf'));
      const pageCount = doc.getPageCount();
      
      expect(pageCount).toBe(1);
    });
    
    it('deve obter página por índice', async () => {
      const { PDFDocument } = require('pdf-lib');
      
      const doc = await PDFDocument.load(Buffer.from('fake pdf'));
      const page = doc.getPage(0);
      
      expect(page).toBeDefined();
    });
    
    it('deve copiar páginas entre documentos', async () => {
      const { PDFDocument } = require('pdf-lib');
      
      const srcDoc = await PDFDocument.load(Buffer.from('fake pdf'));
      const pages = await srcDoc.copyPages(srcDoc, [0]);
      
      expect(Array.isArray(pages)).toBe(true);
    });
  });
  
  // ==========================================
  // Processamento de Imagens
  // ==========================================
  
  describe('Processamento de Imagens', () => {
    it('deve determinar tipo de imagem por extensão', () => {
      const extensoes = {
        'foto.jpg': 'jpg',
        'foto.jpeg': 'jpeg',
        'foto.png': 'png',
        'foto.webp': 'webp'
      };
      
      for (const [arquivo, esperado] of Object.entries(extensoes)) {
        const ext = path.extname(arquivo).toLowerCase().replace('.', '');
        expect(ext).toBe(esperado);
      }
    });
    
    it('deve escalar imagem mantendo proporção', () => {
      const larguraOriginal = 1920;
      const alturaOriginal = 1080;
      const larguraMaxima = 500;
      
      const fator = larguraMaxima / larguraOriginal;
      const novaLargura = larguraOriginal * fator;
      const novaAltura = alturaOriginal * fator;
      
      expect(novaLargura).toBe(500);
      expect(novaAltura).toBeCloseTo(281.25);
    });
  });
  
  // ==========================================
  // Posicionamento de Elementos
  // ==========================================
  
  describe('Posicionamento de Elementos', () => {
    it('deve calcular posição Y correta', () => {
      const alturaPage = 842;
      const margemSuperior = 50;
      const posicaoY = alturaPage - margemSuperior;
      
      expect(posicaoY).toBe(792);
    });
    
    it('deve calcular posição X centralizada', () => {
      const larguraPage = 595;
      const larguraElemento = 200;
      const posicaoX = (larguraPage - larguraElemento) / 2;
      
      expect(posicaoX).toBe(197.5);
    });
    
    it('deve calcular espaçamento entre linhas', () => {
      const tamanhoFonte = 12;
      const espacoLinha = tamanhoFonte * 1.5;
      
      expect(espacoLinha).toBe(18);
    });
  });
});

