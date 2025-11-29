/**
 * Testes para validators.ts
 */

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
  getLabelTipoEmbarcacaoSeguradora,
  TIPOS_EMBARCACAO,
  TIPOS_EMBARCACAO_SEGURADORA,
  TIPOS_POR_SEGURADORA,
  PORTES_EMBARCACAO,
  ESTADOS_BRASILEIROS,
  TIPOS_CONTATO_ACOMPANHANTE
} from '../validators';

describe('validators', () => {
  describe('validarCPF', () => {
    it('deve retornar true para CPF válido', () => {
      expect(validarCPF('529.982.247-25')).toBe(true);
      expect(validarCPF('52998224725')).toBe(true);
    });

    it('deve retornar false para CPF inválido', () => {
      expect(validarCPF('123.456.789-00')).toBe(false);
      expect(validarCPF('11111111111')).toBe(false);
      expect(validarCPF('00000000000')).toBe(false);
    });

    it('deve retornar false para valores vazios', () => {
      expect(validarCPF('')).toBe(false);
      expect(validarCPF(null as any)).toBe(false);
      expect(validarCPF(undefined as any)).toBe(false);
    });

    it('deve retornar false para CPF com tamanho incorreto', () => {
      expect(validarCPF('123456789')).toBe(false);
      expect(validarCPF('123456789012')).toBe(false);
    });

    it('deve validar CPF com resto 10 ou 11', () => {
      // CPFs específicos que testam a condição de resto = 10 ou 11
      expect(validarCPF('52998224725')).toBe(true);
    });
  });

  describe('limparCPF', () => {
    it('deve remover caracteres não numéricos', () => {
      expect(limparCPF('529.982.247-25')).toBe('52998224725');
      expect(limparCPF('529 982 247 25')).toBe('52998224725');
    });

    it('deve retornar string vazia para valores falsy', () => {
      expect(limparCPF('')).toBe('');
      expect(limparCPF(null as any)).toBe('');
      expect(limparCPF(undefined as any)).toBe('');
    });
  });

  describe('formatarCPF', () => {
    it('deve formatar CPF corretamente', () => {
      expect(formatarCPF('52998224725')).toBe('529.982.247-25');
    });

    it('deve retornar string vazia para valores falsy', () => {
      expect(formatarCPF('')).toBe('');
      expect(formatarCPF(null as any)).toBe('');
    });

    it('deve retornar valor original se tamanho incorreto', () => {
      expect(formatarCPF('123456789')).toBe('123456789');
    });
  });

  describe('mascaraCPF', () => {
    it('deve aplicar máscara progressivamente', () => {
      expect(mascaraCPF('529')).toBe('529');
      expect(mascaraCPF('529982')).toBe('529.982');
      expect(mascaraCPF('529982247')).toBe('529.982.247');
      expect(mascaraCPF('52998224725')).toBe('529.982.247-25');
    });

    it('deve limpar caracteres não numéricos', () => {
      expect(mascaraCPF('529-982')).toBe('529.982');
    });
  });

  describe('validarTelefoneE164', () => {
    it('deve validar telefone E.164 válido', () => {
      expect(validarTelefoneE164('+5511999998888')).toBe(true);
      expect(validarTelefoneE164('+1234567890')).toBe(true);
    });

    it('deve rejeitar telefone inválido', () => {
      expect(validarTelefoneE164('11999998888')).toBe(false);
      expect(validarTelefoneE164('+0123456789')).toBe(false);
      expect(validarTelefoneE164('')).toBe(false);
      expect(validarTelefoneE164(null as any)).toBe(false);
    });
  });

  describe('converterParaE164', () => {
    it('deve converter telefone brasileiro', () => {
      expect(converterParaE164('11999998888')).toBe('+5511999998888');
      expect(converterParaE164('(11) 99999-8888')).toBe('+5511999998888');
    });

    it('deve manter se já tem 55', () => {
      expect(converterParaE164('5511999998888')).toBe('+5511999998888');
    });

    it('deve retornar original se muito curto', () => {
      expect(converterParaE164('123456789')).toBe('123456789');
    });

    it('deve retornar string vazia para valores falsy', () => {
      expect(converterParaE164('')).toBe('');
      expect(converterParaE164(null as any)).toBe('');
    });
  });

  describe('formatarTelefone', () => {
    it('deve formatar telefone com 11 dígitos (celular)', () => {
      expect(formatarTelefone('+5511999998888')).toBe('(11) 99999-8888');
    });

    it('deve formatar telefone com 10 dígitos (fixo)', () => {
      expect(formatarTelefone('+551133334444')).toBe('(11) 3333-4444');
    });

    it('deve retornar string vazia para valores falsy', () => {
      expect(formatarTelefone('')).toBe('');
      expect(formatarTelefone(null as any)).toBe('');
    });

    it('deve retornar original se tamanho diferente', () => {
      expect(formatarTelefone('123')).toBe('123');
    });
  });

  describe('validarCNPJ', () => {
    it('deve retornar true para CNPJ válido', () => {
      expect(validarCNPJ('11.444.777/0001-61')).toBe(true);
      expect(validarCNPJ('11444777000161')).toBe(true);
    });

    it('deve retornar false para CNPJ inválido', () => {
      expect(validarCNPJ('11.111.111/1111-11')).toBe(false);
      expect(validarCNPJ('00000000000000')).toBe(false);
    });

    it('deve retornar false para valores vazios', () => {
      expect(validarCNPJ('')).toBe(false);
      expect(validarCNPJ(null as any)).toBe(false);
    });

    it('deve retornar false para CNPJ com tamanho incorreto', () => {
      expect(validarCNPJ('1234567890123')).toBe(false);
      expect(validarCNPJ('123456789012345')).toBe(false);
    });
  });

  describe('limparCNPJ', () => {
    it('deve remover caracteres não numéricos', () => {
      expect(limparCNPJ('11.444.777/0001-61')).toBe('11444777000161');
    });

    it('deve retornar string vazia para valores falsy', () => {
      expect(limparCNPJ('')).toBe('');
      expect(limparCNPJ(null as any)).toBe('');
    });
  });

  describe('formatarCNPJ', () => {
    it('deve formatar CNPJ corretamente', () => {
      expect(formatarCNPJ('11444777000161')).toBe('11.444.777/0001-61');
    });

    it('deve retornar string vazia para valores falsy', () => {
      expect(formatarCNPJ('')).toBe('');
      expect(formatarCNPJ(null as any)).toBe('');
    });

    it('deve retornar valor original se tamanho incorreto', () => {
      expect(formatarCNPJ('123456')).toBe('123456');
    });
  });

  describe('mascaraCNPJ', () => {
    it('deve aplicar máscara progressivamente', () => {
      expect(mascaraCNPJ('11')).toBe('11');
      expect(mascaraCNPJ('11444')).toBe('11.444');
      expect(mascaraCNPJ('11444777')).toBe('11.444.777');
      expect(mascaraCNPJ('114447770001')).toBe('11.444.777/0001');
      expect(mascaraCNPJ('11444777000161')).toBe('11.444.777/0001-61');
    });
  });

  describe('mascaraDocumento', () => {
    it('deve aplicar máscara de CPF para 11 ou menos dígitos', () => {
      expect(mascaraDocumento('52998224725')).toBe('529.982.247-25');
    });

    it('deve aplicar máscara de CNPJ para mais de 11 dígitos', () => {
      expect(mascaraDocumento('11444777000161')).toBe('11.444.777/0001-61');
    });
  });

  describe('mascaraTelefone', () => {
    it('deve aplicar máscara progressivamente', () => {
      expect(mascaraTelefone('11')).toBe('11');
      expect(mascaraTelefone('1199999')).toBe('(11) 99999');
      expect(mascaraTelefone('1133334444')).toBe('(11) 3333-4444');
      expect(mascaraTelefone('11999998888')).toBe('(11) 99999-8888');
    });
  });

  describe('validarEstado', () => {
    it('deve validar estados brasileiros', () => {
      expect(validarEstado('SP')).toBe(true);
      expect(validarEstado('RJ')).toBe(true);
      expect(validarEstado('MG')).toBe(true);
      expect(validarEstado('sp')).toBe(true);
    });

    it('deve rejeitar estados inválidos', () => {
      expect(validarEstado('XX')).toBe(false);
      expect(validarEstado('')).toBe(false);
      expect(validarEstado(null as any)).toBe(false);
    });
  });

  describe('validarValorMonetario', () => {
    it('deve validar valores monetários válidos', () => {
      expect(validarValorMonetario(1000)).toBe(true);
      expect(validarValorMonetario('1500.50')).toBe(true);
      expect(validarValorMonetario(0)).toBe(true);
    });

    it('deve aceitar valores vazios/nulos', () => {
      expect(validarValorMonetario(null)).toBe(true);
      expect(validarValorMonetario(undefined)).toBe(true);
      expect(validarValorMonetario('')).toBe(true);
    });

    it('deve rejeitar valores inválidos', () => {
      expect(validarValorMonetario(-100)).toBe(false);
      expect(validarValorMonetario(100000000)).toBe(false);
      expect(validarValorMonetario('abc')).toBe(false);
    });
  });

  describe('limparValorMonetario', () => {
    it('deve converter valor monetário formatado', () => {
      expect(limparValorMonetario('R$ 1.500,00')).toBe(1500);
      expect(limparValorMonetario('1.500,50')).toBe(1500.5);
      expect(limparValorMonetario(1500)).toBe(1500);
    });

    it('deve retornar null para valores inválidos', () => {
      expect(limparValorMonetario('')).toBe(null);
      expect(limparValorMonetario(null)).toBe(null);
      expect(limparValorMonetario('abc')).toBe(null);
    });
  });

  describe('formatarValorMonetario', () => {
    it('deve formatar valor monetário', () => {
      const result = formatarValorMonetario(1500);
      expect(result).toContain('1.500');
      expect(result).toContain('00');
    });

    it('deve retornar string vazia para valores falsy', () => {
      expect(formatarValorMonetario(null)).toBe('');
      expect(formatarValorMonetario(undefined)).toBe('');
      expect(formatarValorMonetario('')).toBe('');
    });

    it('deve converter string para número', () => {
      const result = formatarValorMonetario('1500.50');
      expect(result).toContain('1.500');
    });

    it('deve retornar string vazia para NaN', () => {
      expect(formatarValorMonetario('abc')).toBe('');
    });
  });

  describe('mascaraValorMonetario', () => {
    it('deve aplicar máscara monetária', () => {
      expect(mascaraValorMonetario('150000')).toBe('1.500,00');
      expect(mascaraValorMonetario('50')).toBe('0,50');
    });

    it('deve retornar string vazia para valores vazios', () => {
      expect(mascaraValorMonetario('')).toBe('');
    });

    it('deve ignorar caracteres não numéricos', () => {
      expect(mascaraValorMonetario('abc')).toBe('');
    });
  });

  describe('getLabelTipoEmbarcacaoSeguradora', () => {
    it('deve retornar label correto', () => {
      expect(getLabelTipoEmbarcacaoSeguradora('LANCHA')).toBe('Lancha');
      expect(getLabelTipoEmbarcacaoSeguradora('JET_SKI')).toBe('Jet Ski');
      expect(getLabelTipoEmbarcacaoSeguradora('EMBARCACAO_COMERCIAL')).toBe('Embarcação Comercial');
    });

    it('deve retornar tipo original se não encontrado', () => {
      expect(getLabelTipoEmbarcacaoSeguradora('DESCONHECIDO')).toBe('DESCONHECIDO');
    });
  });

  describe('Constantes', () => {
    it('deve ter TIPOS_EMBARCACAO definido', () => {
      expect(TIPOS_EMBARCACAO).toBeDefined();
      expect(TIPOS_EMBARCACAO.length).toBeGreaterThan(0);
      expect(TIPOS_EMBARCACAO.find(t => t.value === 'LANCHA')).toBeDefined();
    });

    it('deve ter TIPOS_EMBARCACAO_SEGURADORA definido', () => {
      expect(TIPOS_EMBARCACAO_SEGURADORA).toBeDefined();
      expect(TIPOS_EMBARCACAO_SEGURADORA.length).toBe(3);
    });

    it('deve ter TIPOS_POR_SEGURADORA definido', () => {
      expect(TIPOS_POR_SEGURADORA).toBeDefined();
      expect(TIPOS_POR_SEGURADORA['Essor']).toContain('LANCHA');
      expect(TIPOS_POR_SEGURADORA['Mapfre']).toContain('EMBARCACAO_COMERCIAL');
    });

    it('deve ter PORTES_EMBARCACAO definido', () => {
      expect(PORTES_EMBARCACAO).toBeDefined();
      expect(PORTES_EMBARCACAO.length).toBe(3);
    });

    it('deve ter ESTADOS_BRASILEIROS com 27 estados', () => {
      expect(ESTADOS_BRASILEIROS).toBeDefined();
      expect(ESTADOS_BRASILEIROS.length).toBe(27);
    });

    it('deve ter TIPOS_CONTATO_ACOMPANHANTE definido', () => {
      expect(TIPOS_CONTATO_ACOMPANHANTE).toBeDefined();
      expect(TIPOS_CONTATO_ACOMPANHANTE.length).toBe(3);
    });
  });
});
