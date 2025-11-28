const {
  validarCPF,
  limparCPF,
  formatarCPF,
  validarTelefoneE164,
  converterParaE164,
  formatarTelefone,
  validarEstado,
  validarValorMonetario,
  limparValorMonetario,
  formatarValorMonetario
} = require('../../utils/validators');

describe('Validators', () => {
  describe('validarCPF', () => {
    it('deve validar CPF correto', () => {
      expect(validarCPF('41057276804')).toBe(true);
      expect(validarCPF('410.572.768-04')).toBe(true);
    });

    it('deve rejeitar CPF inválido', () => {
      expect(validarCPF('12345678901')).toBe(false);
      expect(validarCPF('111.111.111-11')).toBe(false);
    });

    it('deve rejeitar CPF com menos de 11 dígitos', () => {
      expect(validarCPF('123456789')).toBe(false);
    });

    it('deve rejeitar CPF vazio', () => {
      expect(validarCPF('')).toBe(false);
      expect(validarCPF(null)).toBe(false);
    });
  });

  describe('limparCPF', () => {
    it('deve remover formatação', () => {
      expect(limparCPF('410.572.768-04')).toBe('41057276804');
    });

    it('deve retornar vazio para input vazio', () => {
      expect(limparCPF('')).toBe('');
      expect(limparCPF(null)).toBe('');
    });
  });

  describe('formatarCPF', () => {
    it('deve formatar CPF', () => {
      expect(formatarCPF('41057276804')).toBe('410.572.768-04');
    });

    it('deve retornar original se não tiver 11 dígitos', () => {
      expect(formatarCPF('123')).toBe('123');
    });
  });

  describe('validarTelefoneE164', () => {
    it('deve validar telefone E.164', () => {
      expect(validarTelefoneE164('+5511999998888')).toBe(true);
    });

    it('deve rejeitar telefone inválido', () => {
      expect(validarTelefoneE164('11999998888')).toBe(false);
      expect(validarTelefoneE164('invalid')).toBe(false);
    });
  });

  describe('converterParaE164', () => {
    it('deve converter telefone brasileiro', () => {
      expect(converterParaE164('11999998888')).toBe('+5511999998888');
    });

    it('deve adicionar +55 se necessário', () => {
      expect(converterParaE164('5511999998888')).toBe('+5511999998888');
    });

    it('deve retornar original se inválido', () => {
      expect(converterParaE164('123')).toBe('123');
    });
  });

  describe('formatarTelefone', () => {
    it('deve formatar telefone E.164', () => {
      expect(formatarTelefone('+5511999998888')).toBe('(11) 99999-8888');
    });

    it('deve formatar telefone com 10 dígitos', () => {
      expect(formatarTelefone('+5511988887777')).toBe('(11) 98888-7777');
    });
  });

  describe('validarEstado', () => {
    it('deve validar estados brasileiros', () => {
      expect(validarEstado('SP')).toBe(true);
      expect(validarEstado('RJ')).toBe(true);
      expect(validarEstado('sp')).toBe(true);
    });

    it('deve rejeitar estado inválido', () => {
      expect(validarEstado('XX')).toBe(false);
      expect(validarEstado('')).toBe(false);
    });
  });

  describe('validarValorMonetario', () => {
    it('deve validar valores corretos', () => {
      expect(validarValorMonetario(1000)).toBe(true);
      expect(validarValorMonetario('1500.50')).toBe(true);
      expect(validarValorMonetario(null)).toBe(true);
    });

    it('deve rejeitar valores negativos', () => {
      expect(validarValorMonetario(-100)).toBe(false);
    });

    it('deve rejeitar valores muito grandes', () => {
      expect(validarValorMonetario(100000000)).toBe(false);
    });
  });

  describe('limparValorMonetario', () => {
    it('deve limpar valor formatado', () => {
      expect(limparValorMonetario('R$ 1.500,00')).toBe(1500);
      expect(limparValorMonetario('1.500,00')).toBe(1500);
    });

    it('deve retornar null para vazio', () => {
      expect(limparValorMonetario('')).toBe(null);
      expect(limparValorMonetario(null)).toBe(null);
    });
  });

  describe('formatarValorMonetario', () => {
    it('deve formatar valor em reais', () => {
      // Intl.NumberFormat pode usar espaço não quebrável, normalizar para comparação
      const normalize = (str) => str.replace(/\u00A0/g, ' ').trim();
      expect(normalize(formatarValorMonetario(1500))).toBe('R$ 1.500,00');
      expect(normalize(formatarValorMonetario(1500.50))).toBe('R$ 1.500,50');
    });

    it('deve retornar vazio para null', () => {
      expect(formatarValorMonetario(null)).toBe('');
      expect(formatarValorMonetario('')).toBe('');
    });
  });
});

