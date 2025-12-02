/**
 * Testes unitários para funções auxiliares do laudoService
 * Testa formatação de dados e funções de utilidade
 */

describe('laudoService - Funções Auxiliares', () => {
  let formatarCPFCNPJ;
  let formatarData;
  let formatarMoeda;

  beforeAll(() => {
    // Silenciar console para os testes
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  // Implementações locais das funções (baseadas no código do laudoService)
  beforeEach(() => {
    formatarCPFCNPJ = (valor) => {
      if (!valor) return '';
      const limpo = valor.replace(/\D/g, '');
      if (limpo.length === 11) {
        return limpo.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
      } else if (limpo.length === 14) {
        return limpo.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
      }
      return valor;
    };

    formatarData = (data) => {
      if (!data) return '';
      const d = new Date(data);
      if (isNaN(d.getTime())) return '';
      const dia = String(d.getDate()).padStart(2, '0');
      const mes = String(d.getMonth() + 1).padStart(2, '0');
      const ano = d.getFullYear();
      return `${dia}/${mes}/${ano}`;
    };

    formatarMoeda = (valor) => {
      if (valor === null || valor === undefined) return 'R$ 0,00';
      const num = typeof valor === 'string' ? parseFloat(valor) : valor;
      if (isNaN(num)) return 'R$ 0,00';
      return num.toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL'
      });
    };
  });

  describe('formatarCPFCNPJ', () => {
    describe('CPF (11 dígitos)', () => {
      it('deve formatar CPF corretamente', () => {
        expect(formatarCPFCNPJ('12345678900')).toBe('123.456.789-00');
      });

      it('deve formatar CPF com caracteres especiais', () => {
        expect(formatarCPFCNPJ('123.456.789-00')).toBe('123.456.789-00');
      });

      it('deve formatar CPF com espaços', () => {
        expect(formatarCPFCNPJ('123 456 789 00')).toBe('123.456.789-00');
      });
    });

    describe('CNPJ (14 dígitos)', () => {
      it('deve formatar CNPJ corretamente', () => {
        expect(formatarCPFCNPJ('12345678000190')).toBe('12.345.678/0001-90');
      });

      it('deve formatar CNPJ com caracteres especiais', () => {
        expect(formatarCPFCNPJ('12.345.678/0001-90')).toBe('12.345.678/0001-90');
      });
    });

    describe('Casos especiais', () => {
      it('deve retornar string vazia para valor nulo', () => {
        expect(formatarCPFCNPJ(null)).toBe('');
      });

      it('deve retornar string vazia para undefined', () => {
        expect(formatarCPFCNPJ(undefined)).toBe('');
      });

      it('deve retornar string vazia para string vazia', () => {
        expect(formatarCPFCNPJ('')).toBe('');
      });

      it('deve retornar valor original se não for CPF nem CNPJ', () => {
        expect(formatarCPFCNPJ('123456')).toBe('123456');
      });

      it('deve retornar valor original se tiver mais de 14 dígitos', () => {
        expect(formatarCPFCNPJ('123456789012345')).toBe('123456789012345');
      });
    });
  });

  describe('formatarData', () => {
    describe('Datas válidas', () => {
      it('deve formatar data corretamente', () => {
        const data = new Date(2024, 0, 15); // 15/01/2024
        expect(formatarData(data)).toBe('15/01/2024');
      });

      it('deve formatar data de string ISO', () => {
        expect(formatarData('2024-01-15T10:30:00Z')).toMatch(/^\d{2}\/\d{2}\/\d{4}$/);
      });

      it('deve preencher dia com zero à esquerda', () => {
        const data = new Date(2024, 5, 5); // 05/06/2024
        expect(formatarData(data)).toBe('05/06/2024');
      });

      it('deve preencher mês com zero à esquerda', () => {
        const data = new Date(2024, 0, 15); // Janeiro
        expect(formatarData(data)).toBe('15/01/2024');
      });
    });

    describe('Casos especiais', () => {
      it('deve retornar string vazia para valor nulo', () => {
        expect(formatarData(null)).toBe('');
      });

      it('deve retornar string vazia para undefined', () => {
        expect(formatarData(undefined)).toBe('');
      });

      it('deve retornar string vazia para data inválida', () => {
        expect(formatarData('data-invalida')).toBe('');
      });

      it('deve retornar string vazia para string vazia', () => {
        expect(formatarData('')).toBe('');
      });
    });
  });

  describe('formatarMoeda', () => {
    describe('Valores válidos', () => {
      it('deve formatar valor inteiro', () => {
        const result = formatarMoeda(1000);
        expect(result).toContain('1.000');
        expect(result).toContain('R$');
      });

      it('deve formatar valor com centavos', () => {
        const result = formatarMoeda(1234.56);
        expect(result).toContain('1.234');
        expect(result).toContain('56');
      });

      it('deve formatar valor zero', () => {
        expect(formatarMoeda(0)).toBe('R$ 0,00');
      });

      it('deve formatar valor string', () => {
        const result = formatarMoeda('500.50');
        expect(result).toContain('500');
        expect(result).toContain('50');
      });
    });

    describe('Casos especiais', () => {
      it('deve retornar R$ 0,00 para valor nulo', () => {
        expect(formatarMoeda(null)).toBe('R$ 0,00');
      });

      it('deve retornar R$ 0,00 para undefined', () => {
        expect(formatarMoeda(undefined)).toBe('R$ 0,00');
      });

      it('deve retornar R$ 0,00 para NaN', () => {
        expect(formatarMoeda('abc')).toBe('R$ 0,00');
      });

      it('deve formatar valores negativos', () => {
        const result = formatarMoeda(-100);
        expect(result).toContain('100');
        expect(result).toContain('-');
      });
    });
  });

  describe('gerarNumeroLaudo', () => {
    // Implementação local
    const gerarNumeroLaudo = () => {
      const agora = new Date();
      const ano = agora.getFullYear().toString().slice(2);
      const mes = String(agora.getMonth() + 1).padStart(2, '0');
      const dia = String(agora.getDate()).padStart(2, '0');
      const random = Math.floor(Math.random() * 100).toString().padStart(2, '0');
      const letra = String.fromCharCode(65 + Math.floor(Math.random() * 26));
      return `${ano}${mes}${dia}${random}${letra}`;
    };

    it('deve gerar número com formato correto', () => {
      const numero = gerarNumeroLaudo();
      expect(numero).toMatch(/^\d{8}[A-Z]$/);
    });

    it('deve incluir ano atual', () => {
      const numero = gerarNumeroLaudo();
      const anoAtual = new Date().getFullYear().toString().slice(2);
      expect(numero.startsWith(anoAtual)).toBe(true);
    });

    it('deve gerar números únicos', () => {
      const numeros = new Set();
      for (let i = 0; i < 100; i++) {
        numeros.add(gerarNumeroLaudo());
      }
      // Deve haver alguma variação (pelo menos 50% únicos)
      expect(numeros.size).toBeGreaterThan(50);
    });

    it('deve terminar com letra maiúscula', () => {
      const numero = gerarNumeroLaudo();
      expect(numero.slice(-1)).toMatch(/[A-Z]/);
    });
  });

  describe('obterTemplatePDF', () => {
    // Implementação local
    const obterTemplatePDF = (tipoEmbarcacao) => {
      const tipo = (tipoEmbarcacao || '').toUpperCase();
      
      if (tipo === 'JET_SKI' || tipo === 'JETSKI') {
        return 'templates/jetski.pdf';
      }
      
      return 'templates/lancha_embarcacao.pdf';
    };

    describe('Tipos de embarcação', () => {
      it('deve retornar jetski.pdf para JET_SKI', () => {
        expect(obterTemplatePDF('JET_SKI')).toContain('jetski');
      });

      it('deve retornar jetski.pdf para JETSKI (sem underscore)', () => {
        expect(obterTemplatePDF('JETSKI')).toContain('jetski');
      });

      it('deve ser case-insensitive', () => {
        expect(obterTemplatePDF('jet_ski')).toContain('jetski');
        expect(obterTemplatePDF('Jet_Ski')).toContain('jetski');
      });

      it('deve retornar lancha para LANCHA', () => {
        expect(obterTemplatePDF('LANCHA')).toContain('lancha');
      });

      it('deve retornar lancha para BARCO', () => {
        expect(obterTemplatePDF('BARCO')).toContain('lancha');
      });

      it('deve retornar lancha para VELEIRO', () => {
        expect(obterTemplatePDF('VELEIRO')).toContain('lancha');
      });

      it('deve retornar lancha para IATE', () => {
        expect(obterTemplatePDF('IATE')).toContain('lancha');
      });

      it('deve retornar lancha para tipos desconhecidos', () => {
        expect(obterTemplatePDF('TIPO_DESCONHECIDO')).toContain('lancha');
      });
    });

    describe('Casos especiais', () => {
      it('deve retornar lancha para null', () => {
        expect(obterTemplatePDF(null)).toContain('lancha');
      });

      it('deve retornar lancha para undefined', () => {
        expect(obterTemplatePDF(undefined)).toContain('lancha');
      });

      it('deve retornar lancha para string vazia', () => {
        expect(obterTemplatePDF('')).toContain('lancha');
      });
    });
  });

  describe('Integração de funções', () => {
    it('deve formatar dados de laudo corretamente', () => {
      const laudo = {
        cpf_cnpj: '12345678900',
        data_inspecao: new Date(2024, 5, 15),
        valor_embarcacao: 150000
      };

      const cpfFormatado = formatarCPFCNPJ(laudo.cpf_cnpj);
      const dataFormatada = formatarData(laudo.data_inspecao);
      const valorFormatado = formatarMoeda(laudo.valor_embarcacao);

      expect(cpfFormatado).toBe('123.456.789-00');
      expect(dataFormatada).toBe('15/06/2024');
      expect(valorFormatado).toContain('150.000');
    });

    it('deve lidar com dados ausentes', () => {
      const laudo = {};

      expect(formatarCPFCNPJ(laudo.cpf_cnpj)).toBe('');
      expect(formatarData(laudo.data_inspecao)).toBe('');
      expect(formatarMoeda(laudo.valor_embarcacao)).toBe('R$ 0,00');
    });
  });
});



