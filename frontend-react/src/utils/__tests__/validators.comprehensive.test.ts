/**
 * Testes abrangentes para utils/validators.ts
 */

import {
  validarCPF,
  validarCNPJ,
  limparCPF,
  mascaraCPF,
  mascaraCNPJ,
  mascaraDocumento,
  formatarCPF,
  mascaraTelefone,
  converterParaE164,
  mascaraValorMonetario,
  limparValorMonetario,
  formatarValorMonetario,
  TIPOS_EMBARCACAO,
  PORTES_EMBARCACAO,
} from '../validators';

describe('Validators', () => {
  describe('CPF', () => {
    describe('validarCPF', () => {
      it('deve retornar true para CPF válido', () => {
        expect(validarCPF('52998224725')).toBe(true);
      });

      it('deve retornar false para CPF inválido', () => {
        expect(validarCPF('12345678901')).toBe(false);
      });

      it('deve retornar false para CPF com todos os dígitos iguais', () => {
        expect(validarCPF('11111111111')).toBe(false);
        expect(validarCPF('00000000000')).toBe(false);
      });

      it('deve retornar false para CPF com menos de 11 dígitos', () => {
        expect(validarCPF('1234567890')).toBe(false);
      });

      it('deve retornar false para string vazia', () => {
        expect(validarCPF('')).toBe(false);
      });

      it('deve retornar false para undefined', () => {
        expect(validarCPF(undefined as any)).toBe(false);
      });

      it('deve aceitar CPF com formatação', () => {
        expect(validarCPF('529.982.247-25')).toBe(true);
      });
    });

    describe('limparCPF', () => {
      it('deve remover caracteres não numéricos', () => {
        expect(limparCPF('529.982.247-25')).toBe('52998224725');
      });

      it('deve retornar string vazia para undefined', () => {
        expect(limparCPF(undefined as any)).toBe('');
      });

      it('deve retornar string vazia para string vazia', () => {
        expect(limparCPF('')).toBe('');
      });
    });

    describe('mascaraCPF', () => {
      it('deve aplicar máscara de CPF', () => {
        expect(mascaraCPF('52998224725')).toBe('529.982.247-25');
      });

      it('deve aplicar máscara parcial para menos dígitos', () => {
        expect(mascaraCPF('529')).toBe('529');
        expect(mascaraCPF('529982')).toBe('529.982');
      });

      it('deve retornar string vazia para undefined', () => {
        expect(mascaraCPF(undefined as any)).toBe('');
      });
    });

    describe('formatarCPF', () => {
      it('deve formatar CPF corretamente', () => {
        expect(formatarCPF('52998224725')).toBe('529.982.247-25');
      });
    });
  });

  describe('CNPJ', () => {
    describe('validarCNPJ', () => {
      it('deve retornar true para CNPJ válido', () => {
        expect(validarCNPJ('11222333000181')).toBe(true);
      });

      it('deve retornar false para CNPJ inválido', () => {
        expect(validarCNPJ('12345678000100')).toBe(false);
      });

      it('deve retornar false para CNPJ com todos os dígitos iguais', () => {
        expect(validarCNPJ('11111111111111')).toBe(false);
      });

      it('deve retornar false para string vazia', () => {
        expect(validarCNPJ('')).toBe(false);
      });
    });

    describe('mascaraCNPJ', () => {
      it('deve aplicar máscara de CNPJ', () => {
        expect(mascaraCNPJ('11222333000181')).toBe('11.222.333/0001-81');
      });

      it('deve retornar string vazia para undefined', () => {
        expect(mascaraCNPJ(undefined as any)).toBe('');
      });
    });
  });

  describe('Documento (CPF/CNPJ)', () => {
    describe('mascaraDocumento', () => {
      it('deve aplicar máscara de CPF para 11 dígitos', () => {
        const result = mascaraDocumento('52998224725');
        expect(result).toContain('.');
      });

      it('deve aplicar máscara de CNPJ para 14 dígitos', () => {
        const result = mascaraDocumento('11222333000181');
        expect(result).toContain('/');
      });

      it('deve retornar vazio para undefined', () => {
        expect(mascaraDocumento(undefined as any)).toBe('');
      });
    });
  });

  describe('Telefone', () => {
    describe('mascaraTelefone', () => {
      it('deve aplicar máscara para celular', () => {
        expect(mascaraTelefone('11999999999')).toBe('(11) 99999-9999');
      });

      it('deve aplicar máscara para telefone fixo', () => {
        expect(mascaraTelefone('1133333333')).toBe('(11) 3333-3333');
      });

      it('deve retornar string vazia para undefined', () => {
        expect(mascaraTelefone(undefined as any)).toBe('');
      });
    });

    describe('converterParaE164', () => {
      it('deve converter para formato E164', () => {
        expect(converterParaE164('11999999999')).toBe('+5511999999999');
      });

      it('deve manter número já no formato E164', () => {
        expect(converterParaE164('+5511999999999')).toBe('+5511999999999');
      });

      it('deve retornar string vazia para undefined', () => {
        expect(converterParaE164(undefined as any)).toBe('');
      });
    });
  });

  describe('Valor Monetário', () => {
    describe('mascaraValorMonetario', () => {
      it('deve aplicar máscara monetária', () => {
        const result = mascaraValorMonetario('1500000');
        expect(result).toContain(',');
      });

      it('deve retornar 0,00 para string vazia', () => {
        expect(mascaraValorMonetario('')).toBe('0,00');
      });
    });

    describe('limparValorMonetario', () => {
      it('deve converter string formatada para número', () => {
        expect(limparValorMonetario('1.500,00')).toBe(1500);
      });

      it('deve retornar 0 para string vazia', () => {
        expect(limparValorMonetario('')).toBe(0);
      });

      it('deve retornar 0 para undefined', () => {
        expect(limparValorMonetario(undefined as any)).toBe(0);
      });
    });

    describe('formatarValorMonetario', () => {
      it('deve formatar número como moeda', () => {
        expect(formatarValorMonetario(1500)).toBe('R$ 1.500,00');
      });

      it('deve formatar zero', () => {
        expect(formatarValorMonetario(0)).toBe('R$ 0,00');
      });

      it('deve formatar undefined como 0', () => {
        expect(formatarValorMonetario(undefined as any)).toBe('R$ 0,00');
      });

      it('deve formatar null como 0', () => {
        expect(formatarValorMonetario(null as any)).toBe('R$ 0,00');
      });
    });
  });

  describe('Constantes', () => {
    describe('TIPOS_EMBARCACAO', () => {
      it('deve ter tipos de embarcação definidos', () => {
        expect(TIPOS_EMBARCACAO).toBeDefined();
        expect(Array.isArray(TIPOS_EMBARCACAO)).toBe(true);
        expect(TIPOS_EMBARCACAO.length).toBeGreaterThan(0);
      });

      it('cada tipo deve ter value e label', () => {
        TIPOS_EMBARCACAO.forEach(tipo => {
          expect(tipo).toHaveProperty('value');
          expect(tipo).toHaveProperty('label');
        });
      });
    });

    describe('PORTES_EMBARCACAO', () => {
      it('deve ter portes de embarcação definidos', () => {
        expect(PORTES_EMBARCACAO).toBeDefined();
        expect(Array.isArray(PORTES_EMBARCACAO)).toBe(true);
        expect(PORTES_EMBARCACAO.length).toBeGreaterThan(0);
      });

      it('cada porte deve ter value e label', () => {
        PORTES_EMBARCACAO.forEach(porte => {
          expect(porte).toHaveProperty('value');
          expect(porte).toHaveProperty('label');
        });
      });
    });

  });
});

