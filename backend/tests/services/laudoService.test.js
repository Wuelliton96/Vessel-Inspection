const { gerarNumeroLaudo, obterTemplatePDF, formatarCPFCNPJ, garantirDiretorioLaudos } = require('../../services/laudoService');
const path = require('path');
const fs = require('fs');

describe('Laudo Service', () => {
  describe('gerarNumeroLaudo', () => {
    it('deve gerar número de laudo no formato correto', () => {
      const numero = gerarNumeroLaudo();
      
      expect(numero).toBeDefined();
      expect(typeof numero).toBe('string');
      expect(numero.length).toBeGreaterThan(0);
    });

    it('deve incluir ano no número', () => {
      const numero = gerarNumeroLaudo();
      const anoAtual = String(new Date().getFullYear()).slice(2);
      
      expect(numero).toContain(anoAtual);
    });

    it('deve incluir mês no número', () => {
      const numero = gerarNumeroLaudo();
      const mesAtual = String(new Date().getMonth() + 1).padStart(2, '0');
      
      expect(numero).toContain(mesAtual);
    });

    it('deve incluir dia no número', () => {
      const numero = gerarNumeroLaudo();
      const diaAtual = String(new Date().getDate()).padStart(2, '0');
      
      expect(numero).toContain(diaAtual);
    });

    it('deve incluir letra no final', () => {
      const numero = gerarNumeroLaudo();
      
      expect(numero).toMatch(/[A-Z]$/);
    });

    it('deve gerar números diferentes em chamadas consecutivas', () => {
      const numero1 = gerarNumeroLaudo();
      const numero2 = gerarNumeroLaudo();
      
      expect(numero1).not.toBe(numero2);
    });
  });

  describe('obterTemplatePDF', () => {
    it('deve retornar template para JET_SKI', () => {
      const template = obterTemplatePDF('JET_SKI');
      
      expect(template).toBeDefined();
      expect(template).toContain('jetski.pdf');
    });

    it('deve retornar template para JETSKI', () => {
      const template = obterTemplatePDF('JETSKI');
      
      expect(template).toBeDefined();
      expect(template).toContain('jetski.pdf');
    });

    it('deve retornar template para LANCHA', () => {
      const template = obterTemplatePDF('LANCHA');
      
      expect(template).toBeDefined();
      expect(template).toContain('lancha_embarcação.pdf');
    });

    it('deve retornar template para IATE', () => {
      const template = obterTemplatePDF('IATE');
      
      expect(template).toBeDefined();
      expect(template).toContain('lancha_embarcação.pdf');
    });

    it('deve retornar template padrão para tipo desconhecido', () => {
      const template = obterTemplatePDF('TIPO_DESCONHECIDO');
      
      expect(template).toBeDefined();
      expect(template).toContain('lancha_embarcação.pdf');
    });

    it('deve retornar template padrão para null', () => {
      const template = obterTemplatePDF(null);
      
      expect(template).toBeDefined();
      expect(template).toContain('lancha_embarcação.pdf');
    });

    it('deve ser case-insensitive', () => {
      const template1 = obterTemplatePDF('lancha');
      const template2 = obterTemplatePDF('LANCHA');
      
      expect(template1).toBe(template2);
    });
  });

  describe('formatarCPFCNPJ', () => {
    it('deve formatar CPF corretamente', () => {
      const cpf = '12345678901';
      const formatado = formatarCPFCNPJ(cpf);
      
      expect(formatado).toBe('123.456.789-01');
    });

    it('deve formatar CPF já formatado', () => {
      const cpf = '123.456.789-01';
      const formatado = formatarCPFCNPJ(cpf);
      
      expect(formatado).toBe('123.456.789-01');
    });

    it('deve formatar CNPJ corretamente', () => {
      const cnpj = '12345678000190';
      const formatado = formatarCPFCNPJ(cnpj);
      
      expect(formatado).toBe('12.345.678/0001-90');
    });

    it('deve retornar string vazia para null', () => {
      const formatado = formatarCPFCNPJ(null);
      
      expect(formatado).toBe('');
    });

    it('deve retornar string vazia para undefined', () => {
      const formatado = formatarCPFCNPJ(undefined);
      
      expect(formatado).toBe('');
    });

    it('deve retornar string vazia para string vazia', () => {
      const formatado = formatarCPFCNPJ('');
      
      expect(formatado).toBe('');
    });
  });

  describe('garantirDiretorioLaudos', () => {
    it('deve criar diretório para ano e mês atual', () => {
      const diretorio = garantirDiretorioLaudos();
      
      expect(diretorio).toBeDefined();
      expect(typeof diretorio).toBe('string');
      expect(diretorio).toContain('laudos');
    });

    it('deve incluir ano no caminho', () => {
      const diretorio = garantirDiretorioLaudos();
      const anoAtual = String(new Date().getFullYear());
      
      expect(diretorio).toContain(anoAtual);
    });

    it('deve incluir mês no caminho', () => {
      const diretorio = garantirDiretorioLaudos();
      const mesAtual = String(new Date().getMonth() + 1).padStart(2, '0');
      
      expect(diretorio).toContain(mesAtual);
    });

    it('deve criar diretório se não existir', () => {
      const diretorio = garantirDiretorioLaudos();
      
      expect(fs.existsSync(diretorio)).toBe(true);
    });
  });
});
