const { gerarNumeroLaudo, deletarLaudoPDF } = require('../../services/laudoService');
const fs = require('fs');
const path = require('path');

describe('Serviço de Laudos', () => {
  describe('gerarNumeroLaudo', () => {
    it('deve gerar número de laudo no formato correto', () => {
      const numero = gerarNumeroLaudo();
      
      expect(numero).toBeDefined();
      expect(typeof numero).toBe('string');
      expect(numero.length).toBe(7);
      expect(/^\d{6}[A-Z]$/.test(numero)).toBe(true);
    });

    it('deve gerar números diferentes em chamadas sucessivas', () => {
      const numero1 = gerarNumeroLaudo();
      const numero2 = gerarNumeroLaudo();
      const numero3 = gerarNumeroLaudo();
      
      const numeros = [numero1, numero2, numero3];
      const uniqueNumeros = [...new Set(numeros)];
      
      expect(uniqueNumeros.length).toBeGreaterThan(1);
    });

    it('deve conter data atual no número', () => {
      const numero = gerarNumeroLaudo();
      const agora = new Date();
      const ano = String(agora.getFullYear()).slice(2);
      const mes = String(agora.getMonth() + 1).padStart(2, '0');
      const dia = String(agora.getDate()).padStart(2, '0');
      
      const prefixoEsperado = `${ano}${mes}${dia}`;
      expect(numero.startsWith(prefixoEsperado)).toBe(true);
    });

    it('deve ter letra maiúscula no final', () => {
      const numero = gerarNumeroLaudo();
      const ultimoCaractere = numero.slice(-1);
      
      expect(/[A-Z]/.test(ultimoCaractere)).toBe(true);
    });
  });

  describe('deletarLaudoPDF', () => {
    it('não deve lançar erro para URL null', () => {
      expect(() => deletarLaudoPDF(null)).not.toThrow();
    });

    it('não deve lançar erro para URL undefined', () => {
      expect(() => deletarLaudoPDF(undefined)).not.toThrow();
    });

    it('não deve lançar erro para arquivo inexistente', () => {
      expect(() => deletarLaudoPDF('/caminho/inexistente.pdf')).not.toThrow();
    });

    it('deve deletar arquivo existente', () => {
      const testDir = path.join(__dirname, '..', '..', 'uploads', 'test');
      const testFile = path.join(testDir, 'test-delete.pdf');
      
      if (!fs.existsSync(testDir)) {
        fs.mkdirSync(testDir, { recursive: true });
      }
      
      fs.writeFileSync(testFile, 'test content');
      expect(fs.existsSync(testFile)).toBe(true);
      
      const relPath = '/uploads/test/test-delete.pdf';
      deletarLaudoPDF(relPath);
      
      expect(fs.existsSync(testFile)).toBe(false);
      
      if (fs.existsSync(testDir)) {
        fs.rmdirSync(testDir, { recursive: true });
      }
    });
  });
});

