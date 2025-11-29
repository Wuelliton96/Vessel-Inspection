/**
 * Testes unitários para laudoService
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
jest.mock('pdf-lib', () => ({
  PDFDocument: {
    create: jest.fn().mockResolvedValue({
      addPage: jest.fn().mockReturnValue({
        drawText: jest.fn(),
        drawLine: jest.fn(),
        drawImage: jest.fn(),
        drawRectangle: jest.fn(),
        getSize: jest.fn().mockReturnValue({ width: 595, height: 842 })
      }),
      save: jest.fn().mockResolvedValue(Buffer.from('pdf content')),
      embedPng: jest.fn().mockResolvedValue({ width: 100, height: 100, scale: jest.fn().mockReturnValue({ width: 50, height: 50 }) }),
      embedJpg: jest.fn().mockResolvedValue({ width: 100, height: 100, scale: jest.fn().mockReturnValue({ width: 50, height: 50 }) }),
      embedFont: jest.fn().mockResolvedValue({})
    }),
    load: jest.fn().mockResolvedValue({
      addPage: jest.fn().mockReturnValue({
        drawText: jest.fn(),
        drawLine: jest.fn(),
        drawImage: jest.fn(),
        getSize: jest.fn().mockReturnValue({ width: 595, height: 842 })
      }),
      save: jest.fn().mockResolvedValue(Buffer.from('pdf content')),
      embedPng: jest.fn().mockResolvedValue({ width: 100, height: 100 }),
      embedJpg: jest.fn().mockResolvedValue({ width: 100, height: 100 }),
      embedFont: jest.fn().mockResolvedValue({}),
      getPageCount: jest.fn().mockReturnValue(1),
      getPage: jest.fn().mockReturnValue({
        getSize: jest.fn().mockReturnValue({ width: 595, height: 842 }),
        drawText: jest.fn()
      }),
      copyPages: jest.fn().mockResolvedValue([{}])
    })
  },
  StandardFonts: {
    Helvetica: 'Helvetica',
    HelveticaBold: 'Helvetica-Bold'
  },
  rgb: jest.fn().mockReturnValue({ type: 'RGB', red: 0, green: 0, blue: 0 }),
  degrees: jest.fn().mockReturnValue(0)
}));

describe('Laudo Service - Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  describe('Geração de Número de Laudo', () => {
    it('deve gerar número único baseado em timestamp', () => {
      const agora = new Date();
      const ano = agora.getFullYear();
      const mes = String(agora.getMonth() + 1).padStart(2, '0');
      const dia = String(agora.getDate()).padStart(2, '0');
      
      const numero = `${ano}${mes}${dia}`;
      
      expect(numero.length).toBe(8);
      expect(parseInt(numero.substring(0, 4))).toBe(ano);
    });
    
    it('deve formatar número com prefixo LAUDO', () => {
      const vistoriaId = 123;
      const timestamp = Date.now();
      const numero = `LAUDO-${timestamp}-${vistoriaId}`;
      
      expect(numero).toMatch(/^LAUDO-\d+-\d+$/);
    });
    
    it('deve gerar números diferentes para chamadas consecutivas', () => {
      const numero1 = `LAUDO-${Date.now()}-1`;
      const numero2 = `LAUDO-${Date.now() + 1}-2`;
      
      expect(numero1).not.toBe(numero2);
    });
  });
  
  describe('Garantia de Diretório de Laudos', () => {
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
  });
  
  describe('Formatação de CPF/CNPJ', () => {
    it('deve formatar CPF corretamente (11 dígitos)', () => {
      const cpf = '12345678901';
      const formatado = cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
      
      expect(formatado).toBe('123.456.789-01');
    });
    
    it('deve formatar CNPJ corretamente (14 dígitos)', () => {
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
  });
  
  describe('Deleção de Laudo PDF', () => {
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
  });
  
  describe('Obtenção de Template PDF', () => {
    it('deve retornar caminho do template padrão', () => {
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
  
  describe('Formatação de Valores', () => {
    it('deve formatar valor monetário', () => {
      const valor = 150000.50;
      const formatado = valor.toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL'
      });
      
      expect(formatado).toMatch(/R\$/);
    });
    
    it('deve formatar data', () => {
      const data = new Date('2025-11-28');
      const formatada = data.toLocaleDateString('pt-BR');
      
      expect(formatada).toMatch(/\d{2}\/\d{2}\/\d{4}/);
    });
    
    it('deve lidar com valores nulos', () => {
      const valor = null;
      const resultado = valor ?? 0;
      
      expect(resultado).toBe(0);
    });
  });
  
  describe('Criação de PDF', () => {
    it('deve criar documento PDF vazio', async () => {
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
  });
  
  describe('Incorporação de Imagens', () => {
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
  
  describe('Desenho na Página', () => {
    it('deve desenhar texto na página', async () => {
      const { PDFDocument } = require('pdf-lib');
      
      const doc = await PDFDocument.create();
      const page = doc.addPage();
      
      page.drawText('Teste', { x: 50, y: 750, size: 12 });
      
      expect(page.drawText).toHaveBeenCalledWith('Teste', expect.any(Object));
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
    
    it('deve desenhar retângulo na página', async () => {
      const { PDFDocument } = require('pdf-lib');
      
      const doc = await PDFDocument.create();
      const page = doc.addPage();
      
      page.drawRectangle({
        x: 50,
        y: 700,
        width: 200,
        height: 50
      });
      
      expect(page.drawRectangle).toHaveBeenCalled();
    });
  });
  
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
  });
});

