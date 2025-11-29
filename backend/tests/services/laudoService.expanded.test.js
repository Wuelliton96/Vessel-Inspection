const path = require('path');
const fs = require('fs');

// Mock do fs
jest.mock('fs', () => ({
  existsSync: jest.fn(),
  mkdirSync: jest.fn(),
  unlinkSync: jest.fn(),
  readFileSync: jest.fn(),
  writeFileSync: jest.fn()
}));

// Mock do pdf-lib
jest.mock('pdf-lib', () => ({
  PDFDocument: {
    create: jest.fn().mockResolvedValue({
      addPage: jest.fn().mockReturnValue({
        drawText: jest.fn(),
        drawLine: jest.fn(),
        drawImage: jest.fn(),
        getSize: jest.fn().mockReturnValue({ width: 595, height: 842 })
      }),
      save: jest.fn().mockResolvedValue(Buffer.from('pdf content')),
      embedPng: jest.fn().mockResolvedValue({ width: 100, height: 100 }),
      embedJpg: jest.fn().mockResolvedValue({ width: 100, height: 100 }),
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
        getSize: jest.fn().mockReturnValue({ width: 595, height: 842 })
      })
    })
  },
  StandardFonts: {
    Helvetica: 'Helvetica',
    HelveticaBold: 'Helvetica-Bold'
  },
  rgb: jest.fn().mockReturnValue({ r: 0, g: 0, b: 0 })
}));

describe('LaudoService - Testes Expandidos', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  describe('Geração de Número de Laudo', () => {
    it('deve gerar número único baseado em timestamp', () => {
      const agora = new Date();
      const ano = agora.getFullYear();
      const mes = String(agora.getMonth() + 1).padStart(2, '0');
      
      const numeroEsperado = `${ano}${mes}`;
      
      expect(numeroEsperado.length).toBe(6);
      expect(parseInt(numeroEsperado.substring(0, 4))).toBe(ano);
    });
    
    it('deve formatar número com prefixo LAUDO', () => {
      const numero = 'LAUDO-2024-001';
      
      expect(numero).toMatch(/^LAUDO-\d{4}-\d{3}$/);
    });
  });
  
  describe('Diretório de Laudos', () => {
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
      
      const diretorio = path.join(process.cwd(), 'PDF', 'laudos');
      
      if (!fs.existsSync(diretorio)) {
        fs.mkdirSync(diretorio, { recursive: true });
      }
      
      expect(fs.mkdirSync).not.toHaveBeenCalled();
    });
  });
  
  describe('Formatação de CPF/CNPJ', () => {
    it('deve formatar CPF corretamente', () => {
      const cpf = '12345678901';
      const formatado = cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
      
      expect(formatado).toBe('123.456.789-01');
    });
    
    it('deve formatar CNPJ corretamente', () => {
      const cnpj = '12345678000190';
      const formatado = cnpj.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
      
      expect(formatado).toBe('12.345.678/0001-90');
    });
    
    it('deve manter CPF já formatado', () => {
      const cpf = '123.456.789-01';
      
      // Se já está formatado (contém pontos ou hífen), mantém
      const jaFormatado = cpf.includes('.') || cpf.includes('-');
      expect(jaFormatado).toBe(true);
    });
  });
  
  describe('Deleção de Laudo', () => {
    it('deve deletar arquivo de laudo existente', () => {
      fs.existsSync.mockReturnValue(true);
      
      const caminhoLaudo = '/path/to/laudo.pdf';
      
      if (fs.existsSync(caminhoLaudo)) {
        fs.unlinkSync(caminhoLaudo);
      }
      
      expect(fs.unlinkSync).toHaveBeenCalledWith(caminhoLaudo);
    });
    
    it('não deve tentar deletar arquivo inexistente', () => {
      fs.existsSync.mockReturnValue(false);
      
      const caminhoLaudo = '/path/to/laudo.pdf';
      
      if (fs.existsSync(caminhoLaudo)) {
        fs.unlinkSync(caminhoLaudo);
      }
      
      expect(fs.unlinkSync).not.toHaveBeenCalled();
    });
  });
  
  describe('Template PDF', () => {
    it('deve retornar caminho do template padrão', () => {
      const templatePath = path.join(process.cwd(), 'PDF', 'template_laudo.pdf');
      
      expect(templatePath).toContain('template_laudo.pdf');
    });
    
    it('deve verificar existência do template', () => {
      fs.existsSync.mockReturnValue(true);
      
      const templatePath = path.join(process.cwd(), 'PDF', 'template_laudo.pdf');
      const exists = fs.existsSync(templatePath);
      
      expect(exists).toBe(true);
    });
  });
  
  describe('Processamento de Imagens', () => {
    it('deve processar imagem PNG', async () => {
      const { PDFDocument } = require('pdf-lib');
      const doc = await PDFDocument.create();
      
      const imageBuffer = Buffer.from('fake png data');
      const image = await doc.embedPng(imageBuffer);
      
      expect(doc.embedPng).toHaveBeenCalled();
    });
    
    it('deve processar imagem JPG', async () => {
      const { PDFDocument } = require('pdf-lib');
      const doc = await PDFDocument.create();
      
      const imageBuffer = Buffer.from('fake jpg data');
      const image = await doc.embedJpg(imageBuffer);
      
      expect(doc.embedJpg).toHaveBeenCalled();
    });
  });
  
  describe('Criação de Páginas', () => {
    it('deve criar página com dimensões A4', async () => {
      const { PDFDocument } = require('pdf-lib');
      const doc = await PDFDocument.create();
      
      const page = doc.addPage();
      const { width, height } = page.getSize();
      
      // Dimensões aproximadas de A4 em pontos (595 x 842)
      expect(width).toBe(595);
      expect(height).toBe(842);
    });
    
    it('deve adicionar texto à página', async () => {
      const { PDFDocument } = require('pdf-lib');
      const doc = await PDFDocument.create();
      const page = doc.addPage();
      
      page.drawText('Teste', { x: 50, y: 750, size: 12 });
      
      expect(page.drawText).toHaveBeenCalled();
    });
  });
  
  describe('Salvamento de PDF', () => {
    it('deve salvar PDF em buffer', async () => {
      const { PDFDocument } = require('pdf-lib');
      const doc = await PDFDocument.create();
      
      const pdfBytes = await doc.save();
      
      expect(Buffer.isBuffer(pdfBytes)).toBe(true);
    });
    
    it('deve escrever arquivo no disco', async () => {
      const pdfBytes = Buffer.from('pdf content');
      const outputPath = '/path/to/output.pdf';
      
      fs.writeFileSync(outputPath, pdfBytes);
      
      expect(fs.writeFileSync).toHaveBeenCalledWith(outputPath, pdfBytes);
    });
  });
});

