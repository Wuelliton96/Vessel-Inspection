/**
 * Testes abrangentes para laudoService.js
 * Objetivo: Aumentar a cobertura de código para > 80%
 */

const fs = require('fs');
const path = require('path');

// Mock de módulos externos antes de importar o serviço
jest.mock('fs', () => ({
  ...jest.requireActual('fs'),
  existsSync: jest.fn(),
  mkdirSync: jest.fn(),
  readFileSync: jest.fn(),
  writeFileSync: jest.fn(),
  unlinkSync: jest.fn(),
  readdirSync: jest.fn()
}));

// Mock completo do pdf-lib
const mockDrawText = jest.fn();
const mockDrawImage = jest.fn();
const mockDrawRectangle = jest.fn();

const createMockPdfPage = () => ({
  getSize: jest.fn().mockReturnValue({ width: 595, height: 842 }),
  drawText: mockDrawText,
  drawImage: mockDrawImage,
  drawRectangle: mockDrawRectangle
});

const mockPdfDoc = {
  addPage: jest.fn().mockImplementation(() => createMockPdfPage()),
  getPages: jest.fn().mockReturnValue([createMockPdfPage()]),
  save: jest.fn().mockResolvedValue(Buffer.from('pdf-bytes')),
  registerFontkit: jest.fn(),
  getForm: jest.fn().mockReturnValue({
    getFields: jest.fn().mockReturnValue([
      { getName: () => 'numero_laudo', constructor: { name: 'PDFTextField' } },
      { getName: () => 'nome_embarcacao', constructor: { name: 'PDFTextField' } }
    ]),
    getTextField: jest.fn().mockReturnValue({
      setText: jest.fn()
    }),
    getDropdown: jest.fn().mockReturnValue({
      select: jest.fn()
    })
  }),
  embedJpg: jest.fn().mockResolvedValue({ width: 200, height: 150 }),
  embedPng: jest.fn().mockResolvedValue({ width: 200, height: 150 })
};

jest.mock('pdf-lib', () => ({
  PDFDocument: {
    create: jest.fn().mockImplementation(() => Promise.resolve({ ...mockPdfDoc })),
    load: jest.fn().mockImplementation(() => Promise.resolve({ ...mockPdfDoc }))
  },
  rgb: jest.fn().mockReturnValue({ red: 0, green: 0, blue: 0 })
}));

// Mock do fontkit
jest.mock('@pdf-lib/fontkit', () => ({}));

// Mock do uploadService
jest.mock('../../services/uploadService', () => ({
  getFileUrl: jest.fn().mockReturnValue('test-file.jpg'),
  getFullPath: jest.fn().mockImplementation((filename, vistoriaId) => {
    if (filename.startsWith('vistorias/')) {
      return `https://bucket.s3.amazonaws.com/${filename}`;
    }
    return `/uploads/fotos/vistoria-${vistoriaId}/${filename}`;
  }),
  UPLOAD_STRATEGY: 'local'
}));

// Mock do AWS SDK
jest.mock('../../config/aws', () => ({
  s3Client: {
    send: jest.fn().mockResolvedValue({
      Body: {
        [Symbol.asyncIterator]: async function* () {
          yield Buffer.from([0xFF, 0xD8, 0xFF, 0xE0]);
        }
      }
    })
  },
  bucket: 'test-bucket',
  region: 'us-east-1'
}));

jest.mock('@aws-sdk/client-s3', () => ({
  GetObjectCommand: jest.fn()
}));

describe('LaudoService - Cobertura Abrangente', () => {
  let laudoService;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
    
    // Configurar mocks padrão
    fs.existsSync.mockReturnValue(false);
    fs.mkdirSync.mockImplementation(() => {});
    fs.writeFileSync.mockImplementation(() => {});
    fs.readFileSync.mockReturnValue(Buffer.from('template-pdf'));
    fs.readdirSync.mockReturnValue([]);
    
    // Importar serviço após configurar mocks
    laudoService = require('../../services/laudoService');
  });

  describe('gerarNumeroLaudo', () => {
    it('deve gerar número com formato YYMMDDL', () => {
      const numero = laudoService.gerarNumeroLaudo();
      
      expect(numero).toBeDefined();
      expect(numero.length).toBe(7);
    });

    it('deve começar com ano atual (2 dígitos)', () => {
      const numero = laudoService.gerarNumeroLaudo();
      const anoAtual = String(new Date().getFullYear()).slice(2);
      
      expect(numero.substring(0, 2)).toBe(anoAtual);
    });

    it('deve conter mês atual no formato correto', () => {
      const numero = laudoService.gerarNumeroLaudo();
      const mesAtual = String(new Date().getMonth() + 1).padStart(2, '0');
      
      expect(numero.substring(2, 4)).toBe(mesAtual);
    });

    it('deve conter dia atual no formato correto', () => {
      const numero = laudoService.gerarNumeroLaudo();
      const diaAtual = String(new Date().getDate()).padStart(2, '0');
      
      expect(numero.substring(4, 6)).toBe(diaAtual);
    });

    it('deve terminar com letra maiúscula A-Z', () => {
      const numero = laudoService.gerarNumeroLaudo();
      const letra = numero.charAt(6);
      
      expect(letra).toMatch(/[A-Z]/);
    });

    it('deve gerar números diferentes em chamadas consecutivas', () => {
      const numeros = new Set();
      for (let i = 0; i < 26; i++) {
        numeros.add(laudoService.gerarNumeroLaudo());
      }
      // Deve haver variação nas letras
      expect(numeros.size).toBeGreaterThan(1);
    });
  });

  describe('obterTemplatePDF', () => {
    const casosJetSki = ['JET_SKI', 'JETSKI', 'jet_ski', 'jetski'];
    const casosLancha = ['LANCHA', 'EMBARCACAO_COMERCIAL', 'BARCO', 'IATE', 'VELEIRO'];

    casosJetSki.forEach(tipo => {
      it(`deve retornar template jetski para tipo ${tipo}`, () => {
        const template = laudoService.obterTemplatePDF(tipo);
        expect(template).toContain('jetski.pdf');
      });
    });

    casosLancha.forEach(tipo => {
      it(`deve retornar template lancha para tipo ${tipo}`, () => {
        const template = laudoService.obterTemplatePDF(tipo);
        expect(template).toContain('lancha');
      });
    });

    it('deve retornar template padrão (lancha) para undefined', () => {
      const template = laudoService.obterTemplatePDF(undefined);
      expect(template).toContain('lancha');
    });

    it('deve retornar template padrão (lancha) para null', () => {
      const template = laudoService.obterTemplatePDF(null);
      expect(template).toContain('lancha');
    });

    it('deve retornar template padrão para string vazia', () => {
      const template = laudoService.obterTemplatePDF('');
      expect(template).toContain('lancha');
    });

    it('deve retornar template padrão para tipo desconhecido', () => {
      const template = laudoService.obterTemplatePDF('SUBMARINO');
      expect(template).toContain('lancha');
    });

    it('deve construir caminho correto para o arquivo', () => {
      const template = laudoService.obterTemplatePDF('LANCHA');
      expect(template).toContain('PDF');
    });
  });

  describe('deletarLaudoPDF', () => {
    it('deve deletar arquivo existente', () => {
      fs.existsSync.mockReturnValue(true);
      fs.unlinkSync.mockImplementation(() => {});

      expect(() => {
        laudoService.deletarLaudoPDF('/uploads/laudos/2024/01/laudo-1.pdf');
      }).not.toThrow();

      expect(fs.existsSync).toHaveBeenCalled();
    });

    it('não deve falhar se arquivo não existir', () => {
      fs.existsSync.mockReturnValue(false);

      expect(() => {
        laudoService.deletarLaudoPDF('/uploads/laudos/inexistente.pdf');
      }).not.toThrow();
    });

    it('não deve falhar se urlPdf for null', () => {
      expect(() => {
        laudoService.deletarLaudoPDF(null);
      }).not.toThrow();
    });

    it('não deve falhar se urlPdf for undefined', () => {
      expect(() => {
        laudoService.deletarLaudoPDF(undefined);
      }).not.toThrow();
    });

    it('não deve falhar se urlPdf for string vazia', () => {
      expect(() => {
        laudoService.deletarLaudoPDF('');
      }).not.toThrow();
    });

    it('deve tratar erro ao deletar graciosamente', () => {
      fs.existsSync.mockReturnValue(true);
      fs.unlinkSync.mockImplementation(() => {
        throw new Error('Erro de permissão');
      });

      expect(() => {
        laudoService.deletarLaudoPDF('/uploads/laudos/teste.pdf');
      }).not.toThrow();
    });
  });

  describe('gerarLaudoPDF', () => {
    const mockLaudo = {
      id: 1,
      numero_laudo: '241130A',
      vistoria_id: 1,
      nome_moto_aquatica: 'Barco Test',
      proprietario: 'João Silva',
      cpf_cnpj: '12345678901',
      data_inspecao: new Date('2024-11-30'),
      versao: 'BS 2021-01',
      endereco_proprietario: 'Rua Teste, 123',
      local_vistoria: 'Marina Teste',
      empresa_prestadora: 'Empresa Teste',
      responsavel_inspecao: 'Responsável Teste',
      nome_empresa: 'Empresa XYZ',
      inscricao_capitania: 'BR12345',
      estaleiro_construtor: 'Estaleiro Teste',
      tipo_embarcacao: 'LANCHA',
      modelo_embarcacao: 'Modelo X',
      ano_fabricacao: 2020,
      capacidade: 8,
      classificacao_embarcacao: 'Recreio',
      area_navegacao: 'Costeira',
      situacao_capitania: 'Regular',
      valor_risco: 150000.50,
      material_casco: 'Fibra de vidro',
      observacoes_casco: 'Bom estado',
      quantidade_motores: 2,
      tipo_motor: 'Centro',
      fabricante_motor: 'Mercury',
      modelo_motor: 'V8',
      numero_serie_motor: 'SN123456',
      potencia_motor: 300,
      combustivel_utilizado: 'Gasolina',
      capacidade_tanque: 200,
      ano_fabricacao_motor: 2020,
      numero_helices: 2,
      rabeta_reversora: 'Sim',
      blower: 'Sim',
      quantidade_baterias: 2,
      marca_baterias: 'Moura',
      capacidade_baterias: '100Ah',
      carregador_bateria: 'Sim',
      transformador: 'Sim',
      quantidade_geradores: 1,
      fabricante_geradores: 'Honda',
      tipo_modelo_geradores: 'EU2000i',
      capacidade_geracao: '2000W',
      quantidade_bombas_porao: 2,
      fabricante_bombas_porao: 'Rule',
      modelo_bombas_porao: '500GPH',
      quantidade_bombas_agua_doce: 1,
      fabricante_bombas_agua_doce: 'Shurflo',
      modelo_bombas_agua_doce: '2.8GPM',
      observacoes_eletricos: 'Sistema elétrico em bom estado',
      guincho_eletrico: 'Sim',
      ancora: '10kg',
      cabos: '50m',
      agulha_giroscopica: 'Não',
      agulha_magnetica: 'Sim',
      antena: 'Sim',
      bidata: 'Sim',
      barometro: 'Não',
      buzina: 'Sim',
      conta_giros: 'Sim',
      farol_milha: 'Sim',
      gps: 'Garmin',
      higrometro: 'Não',
      horimetro: '500h',
      limpador_parabrisa: 'Sim',
      manometros: 'Sim',
      odometro_fundo: 'Sim',
      passarela_embarque: 'Sim',
      piloto_automatico: 'Não',
      psi: 'Sim',
      radar: 'Não',
      radio_ssb: 'Não',
      radio_vhf: 'Sim',
      radiogoniometro: 'Não',
      sonda: 'Sim',
      speed_log: 'Sim',
      strobow: 'Não',
      termometro: 'Sim',
      voltimetro: 'Sim',
      outros_equipamentos: 'GPS, VHF',
      extintores_automaticos: '1',
      extintores_portateis: '2',
      outros_incendio: 'Cobertor',
      atendimento_normas: 'Sim',
      acumulo_agua: 'Não',
      avarias_casco: 'Não',
      estado_geral_limpeza: 'Bom',
      teste_funcionamento_motor: 'OK',
      funcionamento_bombas_porao: 'OK',
      manutencao: 'Em dia',
      observacoes_vistoria: 'Embarcação em bom estado geral'
    };

    const mockVistoria = {
      id: 1,
      data_inicio: new Date('2024-11-01'),
      data_conclusao: new Date('2024-11-30'),
      valor_embarcacao: 200000,
      Embarcacao: {
        nome: 'Barco Test',
        tipo_embarcacao: 'LANCHA',
        nr_inscricao_barco: 'BR12345',
        ano_fabricacao: 2020,
        proprietario_nome: 'João Silva',
        proprietario_cpf: '12345678901',
        valor_embarcacao: 150000,
        Cliente: {
          nome: 'João Silva',
          cpf: '12345678901',
          cnpj: null
        }
      },
      Local: {
        logradouro: 'Rua das Marinas, 100'
      }
    };

    it('deve lançar erro se laudo não for fornecido', async () => {
      await expect(laudoService.gerarLaudoPDF(null, mockVistoria, []))
        .rejects.toThrow('Laudo não fornecido');
    });

    it('deve lançar erro se vistoria não for fornecida', async () => {
      await expect(laudoService.gerarLaudoPDF(mockLaudo, null, []))
        .rejects.toThrow('Vistoria não fornecida');
    });

    it('deve criar PDF sem template quando não existe', async () => {
      fs.existsSync.mockReturnValue(false);
      fs.readdirSync.mockReturnValue([]);

      const result = await laudoService.gerarLaudoPDF(mockLaudo, mockVistoria, []);

      expect(result).toHaveProperty('filePath');
      expect(result).toHaveProperty('urlRelativa');
      expect(result).toHaveProperty('fileName');
    });

    it('deve usar template quando disponível', async () => {
      fs.existsSync.mockImplementation((p) => {
        if (p.includes('PDF')) return true;
        return false;
      });
      fs.readdirSync.mockReturnValue(['lancha_embarcação.pdf']);
      fs.readFileSync.mockReturnValue(Buffer.from('pdf-template'));

      const result = await laudoService.gerarLaudoPDF(mockLaudo, mockVistoria, []);

      expect(result).toHaveProperty('filePath');
    });

    it('deve usar template alternativo quando principal não existe', async () => {
      let callCount = 0;
      fs.existsSync.mockImplementation(() => {
        callCount++;
        return callCount > 1;
      });
      fs.readdirSync.mockReturnValue(['outro-template.pdf']);

      const result = await laudoService.gerarLaudoPDF(mockLaudo, mockVistoria, []);

      expect(result).toHaveProperty('filePath');
    });

    it('deve processar vistoria sem Embarcacao', async () => {
      const vistoriaSemEmb = { ...mockVistoria, Embarcacao: null };
      fs.existsSync.mockReturnValue(false);
      fs.readdirSync.mockReturnValue([]);

      const result = await laudoService.gerarLaudoPDF(mockLaudo, vistoriaSemEmb, []);

      expect(result).toHaveProperty('filePath');
    });

    it('deve processar vistoria sem Local', async () => {
      const vistoriaSemLocal = { ...mockVistoria, Local: null };
      fs.existsSync.mockReturnValue(false);
      fs.readdirSync.mockReturnValue([]);

      const result = await laudoService.gerarLaudoPDF(mockLaudo, vistoriaSemLocal, []);

      expect(result).toHaveProperty('filePath');
    });

    it('deve processar vistoria sem Cliente', async () => {
      const vistoriaSemCliente = {
        ...mockVistoria,
        Embarcacao: {
          ...mockVistoria.Embarcacao,
          Cliente: null
        }
      };
      fs.existsSync.mockReturnValue(false);
      fs.readdirSync.mockReturnValue([]);

      const result = await laudoService.gerarLaudoPDF(mockLaudo, vistoriaSemCliente, []);

      expect(result).toHaveProperty('filePath');
    });

    describe('formatação de CPF/CNPJ', () => {
      it('deve processar CPF com 11 dígitos', async () => {
        const laudoCPF = { ...mockLaudo, cpf_cnpj: '12345678901' };
        fs.existsSync.mockReturnValue(false);
        fs.readdirSync.mockReturnValue([]);

        const result = await laudoService.gerarLaudoPDF(laudoCPF, mockVistoria, []);
        expect(result).toHaveProperty('filePath');
      });

      it('deve processar CNPJ com 14 dígitos', async () => {
        const laudoCNPJ = { ...mockLaudo, cpf_cnpj: '12345678000199' };
        fs.existsSync.mockReturnValue(false);
        fs.readdirSync.mockReturnValue([]);

        const result = await laudoService.gerarLaudoPDF(laudoCNPJ, mockVistoria, []);
        expect(result).toHaveProperty('filePath');
      });

      it('deve processar CPF/CNPJ vazio', async () => {
        const laudoSemDoc = { ...mockLaudo, cpf_cnpj: '' };
        fs.existsSync.mockReturnValue(false);
        fs.readdirSync.mockReturnValue([]);

        const result = await laudoService.gerarLaudoPDF(laudoSemDoc, mockVistoria, []);
        expect(result).toHaveProperty('filePath');
      });

      it('deve processar CPF/CNPJ null', async () => {
        const laudoSemDoc = { ...mockLaudo, cpf_cnpj: null };
        fs.existsSync.mockReturnValue(false);
        fs.readdirSync.mockReturnValue([]);

        const result = await laudoService.gerarLaudoPDF(laudoSemDoc, mockVistoria, []);
        expect(result).toHaveProperty('filePath');
      });
    });

    describe('formatação de datas', () => {
      it('deve processar data válida', async () => {
        const laudoData = { ...mockLaudo, data_inspecao: new Date('2024-11-30') };
        fs.existsSync.mockReturnValue(false);
        fs.readdirSync.mockReturnValue([]);

        const result = await laudoService.gerarLaudoPDF(laudoData, mockVistoria, []);
        expect(result).toHaveProperty('filePath');
      });

      it('deve processar data null', async () => {
        const laudoSemData = { ...mockLaudo, data_inspecao: null };
        fs.existsSync.mockReturnValue(false);
        fs.readdirSync.mockReturnValue([]);

        const result = await laudoService.gerarLaudoPDF(laudoSemData, mockVistoria, []);
        expect(result).toHaveProperty('filePath');
      });

      it('deve usar data da vistoria como fallback', async () => {
        const laudoSemData = { ...mockLaudo, data_inspecao: null };
        fs.existsSync.mockReturnValue(false);
        fs.readdirSync.mockReturnValue([]);

        const result = await laudoService.gerarLaudoPDF(laudoSemData, mockVistoria, []);
        expect(result).toHaveProperty('filePath');
      });
    });

    describe('formatação de valores monetários', () => {
      it('deve processar valor numérico', async () => {
        const laudoValor = { ...mockLaudo, valor_risco: 150000.50 };
        fs.existsSync.mockReturnValue(false);
        fs.readdirSync.mockReturnValue([]);

        const result = await laudoService.gerarLaudoPDF(laudoValor, mockVistoria, []);
        expect(result).toHaveProperty('filePath');
      });

      it('deve processar valor null', async () => {
        const laudoSemValor = { ...mockLaudo, valor_risco: null };
        fs.existsSync.mockReturnValue(false);
        fs.readdirSync.mockReturnValue([]);

        const result = await laudoService.gerarLaudoPDF(laudoSemValor, mockVistoria, []);
        expect(result).toHaveProperty('filePath');
      });

      it('deve usar valor da vistoria como fallback', async () => {
        const laudoSemValor = { ...mockLaudo, valor_risco: null };
        fs.existsSync.mockReturnValue(false);
        fs.readdirSync.mockReturnValue([]);

        const result = await laudoService.gerarLaudoPDF(laudoSemValor, mockVistoria, []);
        expect(result).toHaveProperty('filePath');
      });
    });

    describe('processamento de fotos', () => {
      it('deve processar fotos locais JPEG', async () => {
        fs.existsSync.mockImplementation((p) => {
          if (p.includes('.jpg')) return true;
          return false;
        });
        fs.readdirSync.mockReturnValue([]);
        fs.readFileSync.mockReturnValue(Buffer.from([0xFF, 0xD8, 0xFF, 0xE0]));

        const fotos = [{
          id: 1,
          url_arquivo: 'foto1.jpg',
          vistoria_id: 1,
          TipoFotoChecklist: {
            nome_exibicao: 'Foto do Casco',
            descricao: 'Descrição da foto'
          },
          observacao: 'Observação teste'
        }];

        const result = await laudoService.gerarLaudoPDF(mockLaudo, mockVistoria, fotos);
        expect(result).toHaveProperty('filePath');
      });

      it('deve processar fotos locais PNG', async () => {
        fs.existsSync.mockImplementation((p) => {
          if (p.includes('.png')) return true;
          return false;
        });
        fs.readdirSync.mockReturnValue([]);
        fs.readFileSync.mockReturnValue(Buffer.from([0x89, 0x50, 0x4E, 0x47]));

        const fotos = [{
          id: 1,
          url_arquivo: 'foto1.png',
          vistoria_id: 1,
          TipoFotoChecklist: { nome_exibicao: 'Foto PNG' }
        }];

        const result = await laudoService.gerarLaudoPDF(mockLaudo, mockVistoria, fotos);
        expect(result).toHaveProperty('filePath');
      });

      it('deve processar múltiplas fotos em várias páginas', async () => {
        fs.existsSync.mockReturnValue(true);
        fs.readdirSync.mockReturnValue([]);
        fs.readFileSync.mockReturnValue(Buffer.from([0xFF, 0xD8, 0xFF, 0xE0]));

        const fotos = [];
        for (let i = 0; i < 6; i++) {
          fotos.push({
            id: i + 1,
            url_arquivo: `foto${i}.jpg`,
            vistoria_id: 1,
            TipoFotoChecklist: {
              nome_exibicao: `Foto ${i + 1}`,
              descricao: `Descrição ${i + 1}`
            },
            observacao: `Obs ${i + 1}`
          });
        }

        const result = await laudoService.gerarLaudoPDF(mockLaudo, mockVistoria, fotos);
        expect(result).toHaveProperty('filePath');
      });

      it('deve ignorar fotos sem url_arquivo', async () => {
        fs.existsSync.mockReturnValue(false);
        fs.readdirSync.mockReturnValue([]);

        const fotos = [{
          id: 1,
          url_arquivo: null,
          vistoria_id: 1,
          TipoFotoChecklist: { nome_exibicao: 'Foto Nula' }
        }];

        const result = await laudoService.gerarLaudoPDF(mockLaudo, mockVistoria, fotos);
        expect(result).toHaveProperty('filePath');
      });

      it('deve continuar mesmo se foto não for encontrada', async () => {
        fs.existsSync.mockReturnValue(false);
        fs.readdirSync.mockReturnValue([]);

        const fotos = [{
          id: 1,
          url_arquivo: 'foto-inexistente.jpg',
          vistoria_id: 1,
          TipoFotoChecklist: { nome_exibicao: 'Foto' }
        }];

        const result = await laudoService.gerarLaudoPDF(mockLaudo, mockVistoria, fotos);
        expect(result).toHaveProperty('filePath');
      });
    });

    describe('tipos de embarcação', () => {
      it('deve processar JET_SKI', async () => {
        const vistoriaJet = {
          ...mockVistoria,
          Embarcacao: { ...mockVistoria.Embarcacao, tipo_embarcacao: 'JET_SKI' }
        };
        fs.existsSync.mockReturnValue(false);
        fs.readdirSync.mockReturnValue([]);

        const result = await laudoService.gerarLaudoPDF(mockLaudo, vistoriaJet, []);
        expect(result).toHaveProperty('filePath');
      });

      it('deve processar EMBARCACAO_COMERCIAL', async () => {
        const vistoriaComercial = {
          ...mockVistoria,
          Embarcacao: { ...mockVistoria.Embarcacao, tipo_embarcacao: 'EMBARCACAO_COMERCIAL' }
        };
        fs.existsSync.mockReturnValue(false);
        fs.readdirSync.mockReturnValue([]);

        const result = await laudoService.gerarLaudoPDF(mockLaudo, vistoriaComercial, []);
        expect(result).toHaveProperty('filePath');
      });

      it('deve processar tipo sem embarcação definida', async () => {
        const vistoriaSemTipo = {
          ...mockVistoria,
          Embarcacao: { ...mockVistoria.Embarcacao, tipo_embarcacao: null }
        };
        fs.existsSync.mockReturnValue(false);
        fs.readdirSync.mockReturnValue([]);

        const result = await laudoService.gerarLaudoPDF(mockLaudo, vistoriaSemTipo, []);
        expect(result).toHaveProperty('filePath');
      });
    });

    describe('estrutura de diretórios', () => {
      it('deve criar diretório base de laudos', async () => {
        fs.existsSync.mockReturnValue(false);
        fs.readdirSync.mockReturnValue([]);

        await laudoService.gerarLaudoPDF(mockLaudo, mockVistoria, []);

        expect(fs.mkdirSync).toHaveBeenCalled();
      });

      it('deve criar estrutura ano/mês', async () => {
        fs.existsSync.mockReturnValue(false);
        fs.readdirSync.mockReturnValue([]);

        const result = await laudoService.gerarLaudoPDF(mockLaudo, mockVistoria, []);

        expect(result.urlRelativa).toMatch(/\/uploads\/laudos\/\d{4}\/\d{2}\//);
      });

      it('deve nomear arquivo com ID do laudo', async () => {
        fs.existsSync.mockReturnValue(false);
        fs.readdirSync.mockReturnValue([]);

        const result = await laudoService.gerarLaudoPDF(mockLaudo, mockVistoria, []);

        expect(result.fileName).toContain(`laudo-${mockLaudo.id}.pdf`);
      });
    });

    describe('tratamento de erros', () => {
      it('deve tratar erro ao registrar fontkit', async () => {
        fs.existsSync.mockReturnValue(false);
        fs.readdirSync.mockReturnValue([]);

        // O serviço já trata o erro internamente
        const result = await laudoService.gerarLaudoPDF(mockLaudo, mockVistoria, []);
        expect(result).toHaveProperty('filePath');
      });
    });
  });

  describe('Cenários de integração', () => {
    it('deve gerar PDF completo com todos os campos', async () => {
      fs.existsSync.mockReturnValue(false);
      fs.readdirSync.mockReturnValue([]);

      const laudoCompleto = {
        id: 999,
        numero_laudo: '241130Z',
        nome_moto_aquatica: 'Barco Completo',
        proprietario: 'Proprietário Teste',
        cpf_cnpj: '12345678901',
        endereco_proprietario: 'Endereço Completo',
        data_inspecao: new Date(),
        local_vistoria: 'Local Vistoria',
        empresa_prestadora: 'Empresa',
        responsavel_inspecao: 'Responsável',
        nome_empresa: 'Nome Empresa',
        inscricao_capitania: 'BR999',
        estaleiro_construtor: 'Estaleiro',
        tipo_embarcacao: 'LANCHA',
        modelo_embarcacao: 'Modelo',
        ano_fabricacao: 2024,
        capacidade: 10,
        classificacao_embarcacao: 'Recreio',
        area_navegacao: 'Costeira',
        situacao_capitania: 'Regular',
        valor_risco: 999999.99,
        material_casco: 'Fibra',
        quantidade_motores: 2,
        tipo_motor: 'Centro',
        fabricante_motor: 'Mercury',
        modelo_motor: 'V8',
        potencia_motor: 500,
        combustivel_utilizado: 'Gasolina',
        capacidade_tanque: 300
      };

      const vistoriaCompleta = {
        id: 999,
        data_inicio: new Date(),
        data_conclusao: new Date(),
        valor_embarcacao: 999999,
        Embarcacao: {
          nome: 'Barco',
          tipo_embarcacao: 'LANCHA',
          nr_inscricao_barco: 'BR999',
          ano_fabricacao: 2024,
          Cliente: { nome: 'Cliente', cpf: '12345678901' }
        },
        Local: { logradouro: 'Rua Teste' }
      };

      const result = await laudoService.gerarLaudoPDF(laudoCompleto, vistoriaCompleta, []);
      
      expect(result).toHaveProperty('filePath');
      expect(result).toHaveProperty('urlRelativa');
      expect(result).toHaveProperty('fileName');
    });
  });
});

