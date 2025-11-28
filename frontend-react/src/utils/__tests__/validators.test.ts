import {
  validarCPF,
  limparCPF,
  formatarCPF,
  mascaraCPF,
  validarTelefoneE164,
  converterParaE164,
  formatarTelefone,
  validarCNPJ,
  limparCNPJ,
  formatarCNPJ,
  mascaraCNPJ,
  mascaraDocumento,
  mascaraTelefone,
  validarEstado,
  validarValorMonetario,
  limparValorMonetario,
  formatarValorMonetario,
  mascaraValorMonetario,
  TIPOS_EMBARCACAO,
  TIPOS_EMBARCACAO_SEGURADORA,
  ESTADOS_BRASILEIROS
} from '../validators';

describe('validarCPF', () => {
  it('deve validar CPF válido', () => {
    expect(validarCPF('11144477735')).toBe(true);
    expect(validarCPF('111.444.777-35')).toBe(true);
  });

  it('deve rejeitar CPF inválido', () => {
    expect(validarCPF('12345678901')).toBe(false);
    expect(validarCPF('11111111111')).toBe(false);
    expect(validarCPF('')).toBe(false);
  });

  it('deve rejeitar CPF com menos de 11 dígitos', () => {
    expect(validarCPF('123456789')).toBe(false);
  });
});

describe('limparCPF', () => {
  it('deve remover formatação do CPF', () => {
    expect(limparCPF('111.444.777-35')).toBe('11144477735');
    expect(limparCPF('11144477735')).toBe('11144477735');
  });

  it('deve retornar string vazia para valores vazios', () => {
    expect(limparCPF('')).toBe('');
    expect(limparCPF(null as any)).toBe('');
  });
});

describe('formatarCPF', () => {
  it('deve formatar CPF corretamente', () => {
    expect(formatarCPF('11144477735')).toBe('111.444.777-35');
  });

  it('deve retornar o valor original se não tiver 11 dígitos', () => {
    expect(formatarCPF('123456789')).toBe('123456789');
  });
});

describe('mascaraCPF', () => {
  it('deve aplicar máscara progressivamente', () => {
    expect(mascaraCPF('1')).toBe('1');
    expect(mascaraCPF('111')).toBe('111');
    expect(mascaraCPF('111444')).toBe('111.444');
    expect(mascaraCPF('111444777')).toBe('111.444.777');
    expect(mascaraCPF('11144477735')).toBe('111.444.777-35');
  });
});

describe('validarTelefoneE164', () => {
  it('deve validar telefone E.164 válido', () => {
    expect(validarTelefoneE164('+5511999998888')).toBe(true);
    expect(validarTelefoneE164('+1234567890')).toBe(true);
  });

  it('deve rejeitar telefone inválido', () => {
    expect(validarTelefoneE164('11999998888')).toBe(false);
    expect(validarTelefoneE164('')).toBe(false);
  });
});

describe('converterParaE164', () => {
  it('deve converter telefone brasileiro para E.164', () => {
    expect(converterParaE164('11999998888')).toBe('+5511999998888');
    expect(converterParaE164('(11) 99999-8888')).toBe('+5511999998888');
  });

  it('deve manter telefone que já está em E.164', () => {
    expect(converterParaE164('+5511999998888')).toBe('+5511999998888');
  });
});

describe('formatarTelefone', () => {
  it('deve formatar telefone E.164 para exibição brasileira', () => {
    expect(formatarTelefone('+5511999998888')).toBe('(11) 99999-8888');
    expect(formatarTelefone('+5511888887777')).toBe('(11) 88888-7777');
  });
});

describe('validarCNPJ', () => {
  it('deve validar CNPJ válido', () => {
    expect(validarCNPJ('11222333000181')).toBe(true);
  });

  it('deve rejeitar CNPJ inválido', () => {
    expect(validarCNPJ('12345678000190')).toBe(false);
    expect(validarCNPJ('11111111111111')).toBe(false);
  });
});

describe('mascaraDocumento', () => {
  it('deve aplicar máscara de CPF para até 11 dígitos', () => {
    expect(mascaraDocumento('11144477735')).toBe('111.444.777-35');
  });

  it('deve aplicar máscara de CNPJ para mais de 11 dígitos', () => {
    expect(mascaraDocumento('11222333000181')).toBe('11.222.333/0001-81');
  });
});

describe('validarEstado', () => {
  it('deve validar estados brasileiros válidos', () => {
    expect(validarEstado('SP')).toBe(true);
    expect(validarEstado('RJ')).toBe(true);
    expect(validarEstado('sp')).toBe(true);
  });

  it('deve rejeitar estados inválidos', () => {
    expect(validarEstado('XX')).toBe(false);
    expect(validarEstado('')).toBe(false);
  });
});

describe('validarValorMonetario', () => {
  it('deve validar valores monetários válidos', () => {
    expect(validarValorMonetario(100)).toBe(true);
    expect(validarValorMonetario('100')).toBe(true);
    expect(validarValorMonetario(null)).toBe(true);
    expect(validarValorMonetario(0)).toBe(true);
  });

  it('deve rejeitar valores inválidos', () => {
    expect(validarValorMonetario(-100)).toBe(false);
    expect(validarValorMonetario(100000000)).toBe(false);
  });
});

describe('formatarValorMonetario', () => {
  it('deve formatar valor monetário corretamente', () => {
    expect(formatarValorMonetario(1500.50)).toBe('R$ 1.500,50');
    expect(formatarValorMonetario(0)).toBe('R$ 0,00');
  });

  it('deve retornar string vazia para valores inválidos', () => {
    expect(formatarValorMonetario(null)).toBe('');
    expect(formatarValorMonetario('')).toBe('');
  });
});

describe('mascaraValorMonetario', () => {
  it('deve aplicar máscara de valor monetário', () => {
    expect(mascaraValorMonetario('150050')).toBe('1.500,50');
    expect(mascaraValorMonetario('100')).toBe('1,00');
  });
});

describe('Constantes', () => {
  it('deve ter TIPOS_EMBARCACAO definidos', () => {
    expect(TIPOS_EMBARCACAO.length).toBeGreaterThan(0);
    expect(TIPOS_EMBARCACAO[0]).toHaveProperty('value');
    expect(TIPOS_EMBARCACAO[0]).toHaveProperty('label');
  });

  it('deve ter ESTADOS_BRASILEIROS definidos', () => {
    expect(ESTADOS_BRASILEIROS.length).toBe(27);
    expect(ESTADOS_BRASILEIROS[0]).toHaveProperty('value');
    expect(ESTADOS_BRASILEIROS[0]).toHaveProperty('label');
  });
});

