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

describe('Validators - Testes Adicionais', () => {
  describe('validarCPF - Casos Adicionais', () => {
    it('deve validar CPF com zeros à esquerda', () => {
      expect(validarCPF('00000000191')).toBe(true);
    });

    it('deve rejeitar CPF com todos os dígitos iguais', () => {
      expect(validarCPF('11111111111')).toBe(false);
      expect(validarCPF('22222222222')).toBe(false);
      expect(validarCPF('00000000000')).toBe(false);
    });

    it('deve validar CPF com diferentes formatos', () => {
      const cpf = '12345678909';
      expect(validarCPF(cpf)).toBe(true);
      expect(validarCPF(cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4'))).toBe(true);
    });

    it('deve rejeitar CPF com mais de 11 dígitos', () => {
      expect(validarCPF('123456789012')).toBe(false);
    });
  });

  describe('limparCPF - Casos Adicionais', () => {
    it('deve remover todos os caracteres não numéricos', () => {
      expect(limparCPF('123.456.789-09')).toBe('12345678909');
      expect(limparCPF('123 456 789 09')).toBe('12345678909');
      expect(limparCPF('123-456-789-09')).toBe('12345678909');
    });

    it('deve retornar string vazia para undefined', () => {
      expect(limparCPF(undefined)).toBe('');
    });
  });

  describe('formatarCPF - Casos Adicionais', () => {
    it('deve formatar CPF sem formatação', () => {
      expect(formatarCPF('12345678909')).toBe('123.456.789-09');
    });

    it('deve retornar original se não tiver 11 dígitos após limpar', () => {
      expect(formatarCPF('123')).toBe('123');
      expect(formatarCPF('123456789')).toBe('123456789');
    });

    it('deve retornar string vazia para null', () => {
      expect(formatarCPF(null)).toBe('');
    });
  });

  describe('validarTelefoneE164 - Casos Adicionais', () => {
    it('deve validar telefone com diferentes códigos de país', () => {
      expect(validarTelefoneE164('+5511999998888')).toBe(true);
      expect(validarTelefoneE164('+12125551234')).toBe(true);
      expect(validarTelefoneE164('+442071234567')).toBe(true);
    });

    it('deve rejeitar telefone sem código do país', () => {
      expect(validarTelefoneE164('11999998888')).toBe(false);
    });

    it('deve rejeitar telefone muito curto', () => {
      expect(validarTelefoneE164('+12')).toBe(false);
    });

    it('deve rejeitar telefone muito longo', () => {
      expect(validarTelefoneE164('+12345678901234567')).toBe(false);
    });
  });

  describe('converterParaE164 - Casos Adicionais', () => {
    it('deve converter telefone formatado', () => {
      expect(converterParaE164('(11) 99999-8888')).toBe('+5511999998888');
      expect(converterParaE164('(11) 9999-8888')).toBe('+551199998888');
    });

    it('deve manter telefone que já está em E164', () => {
      expect(converterParaE164('+5511999998888')).toBe('+5511999998888');
    });

    it('deve retornar original se não conseguir converter', () => {
      expect(converterParaE164('123')).toBe('123');
      expect(converterParaE164('abc')).toBe('abc');
    });
  });

  describe('formatarTelefone - Casos Adicionais', () => {
    it('deve formatar telefone de 11 dígitos', () => {
      expect(formatarTelefone('+5511999998888')).toBe('(11) 99999-8888');
    });

    it('deve formatar telefone de 10 dígitos', () => {
      expect(formatarTelefone('+5511988887777')).toBe('(11) 98888-7777');
    });

    it('deve retornar original se não conseguir formatar', () => {
      expect(formatarTelefone('+123456789012345')).toBe('+123456789012345');
    });
  });

  describe('validarEstado - Casos Adicionais', () => {
    it('deve validar todos os estados brasileiros', () => {
      const estados = ['AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
        'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
        'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'];
      
      estados.forEach(estado => {
        expect(validarEstado(estado)).toBe(true);
        expect(validarEstado(estado.toLowerCase())).toBe(true);
      });
    });

    it('deve rejeitar estados inválidos', () => {
      expect(validarEstado('AA')).toBe(false);
      expect(validarEstado('ZZ')).toBe(false);
      expect(validarEstado('ABC')).toBe(false);
    });
  });

  describe('validarValorMonetario - Casos Adicionais', () => {
    it('deve validar zero', () => {
      expect(validarValorMonetario(0)).toBe(true);
      expect(validarValorMonetario('0')).toBe(true);
    });

    it('deve validar valores decimais', () => {
      expect(validarValorMonetario(100.50)).toBe(true);
      expect(validarValorMonetario('100.50')).toBe(true);
    });

    it('deve rejeitar valores muito grandes', () => {
      expect(validarValorMonetario(100000000)).toBe(false);
      expect(validarValorMonetario(99999999.99)).toBe(true);
    });
  });

  describe('limparValorMonetario - Casos Adicionais', () => {
    it('deve limpar diferentes formatos', () => {
      expect(limparValorMonetario('R$ 1.500,00')).toBe(1500);
      expect(limparValorMonetario('R$1.500,00')).toBe(1500);
      expect(limparValorMonetario('1.500,00')).toBe(1500);
      expect(limparValorMonetario('1500,00')).toBe(1500);
    });

    it('deve lidar com valores decimais', () => {
      expect(limparValorMonetario('R$ 1.500,50')).toBe(1500.5);
    });

    it('deve retornar null para valores inválidos', () => {
      expect(limparValorMonetario('abc')).toBe(null);
      expect(limparValorMonetario('R$ abc')).toBe(null);
    });
  });

  describe('formatarValorMonetario - Casos Adicionais', () => {
    it('deve formatar valores inteiros', () => {
      const formatado = formatarValorMonetario(1500);
      expect(formatado).toContain('1.500');
      expect(formatado).toContain('R$');
    });

    it('deve formatar valores decimais', () => {
      const formatado = formatarValorMonetario(1500.50);
      expect(formatado).toContain('1.500');
      expect(formatado).toContain('50');
    });

    it('deve formatar zero', () => {
      const formatado = formatarValorMonetario(0);
      expect(formatado).toContain('0');
    });
  });
});
