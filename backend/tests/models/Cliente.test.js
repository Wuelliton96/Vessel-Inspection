const { Cliente, sequelize } = require('../../models');

describe('Modelo Cliente', () => {
  afterAll(async () => {
    await sequelize.close();
  });

  beforeEach(async () => {
    await Cliente.destroy({ where: {}, force: true });
  });

  describe('Criação de cliente pessoa física', () => {
    it('deve criar cliente pessoa física com CPF válido', async () => {
      const cliente = await Cliente.create({
        tipo_pessoa: 'FISICA',
        nome: 'João Silva',
        cpf: '12345678901',
        email: 'joao@example.com',
        telefone_e164: '+5511999998888'
      });

      expect(cliente).toBeDefined();
      expect(cliente.tipo_pessoa).toBe('FISICA');
      expect(cliente.cpf).toBe('12345678901');
      expect(cliente.cnpj).toBeNull();
    });

    it('deve exigir CPF para pessoa física', async () => {
      await expect(
        Cliente.create({
          tipo_pessoa: 'FISICA',
          nome: 'João Silva'
        })
      ).rejects.toThrow('CPF é obrigatório');
    });

    it('não deve permitir CNPJ para pessoa física', async () => {
      await expect(
        Cliente.create({
          tipo_pessoa: 'FISICA',
          nome: 'João Silva',
          cpf: '12345678901',
          cnpj: '12345678000190'
        })
      ).rejects.toThrow('Pessoa física não pode ter CNPJ');
    });
  });

  describe('Criação de cliente pessoa jurídica', () => {
    it('deve criar cliente pessoa jurídica com CNPJ válido', async () => {
      const cliente = await Cliente.create({
        tipo_pessoa: 'JURIDICA',
        nome: 'Empresa LTDA',
        cnpj: '12345678000190',
        email: 'contato@empresa.com'
      });

      expect(cliente).toBeDefined();
      expect(cliente.tipo_pessoa).toBe('JURIDICA');
      expect(cliente.cnpj).toBe('12345678000190');
      expect(cliente.cpf).toBeNull();
    });

    it('deve exigir CNPJ para pessoa jurídica', async () => {
      await expect(
        Cliente.create({
          tipo_pessoa: 'JURIDICA',
          nome: 'Empresa LTDA'
        })
      ).rejects.toThrow('CNPJ é obrigatório');
    });

    it('não deve permitir CPF para pessoa jurídica', async () => {
      await expect(
        Cliente.create({
          tipo_pessoa: 'JURIDICA',
          nome: 'Empresa LTDA',
          cnpj: '12345678000190',
          cpf: '12345678901'
        })
      ).rejects.toThrow('Pessoa jurídica não pode ter CPF');
    });
  });

  describe('Validações de CPF/CNPJ', () => {
    it('deve validar formato de CPF (11 dígitos)', async () => {
      await expect(
        Cliente.create({
          tipo_pessoa: 'FISICA',
          nome: 'Test',
          cpf: '123' // CPF inválido (muito curto)
        })
      ).rejects.toThrow();
    });

    it('deve validar formato de CNPJ (14 dígitos)', async () => {
      await expect(
        Cliente.create({
          tipo_pessoa: 'JURIDICA',
          nome: 'Test',
          cnpj: '123' // CNPJ inválido (muito curto)
        })
      ).rejects.toThrow();
    });
  });

  describe('Validações de email e telefone', () => {
    it('deve validar formato de email', async () => {
      await expect(
        Cliente.create({
          tipo_pessoa: 'FISICA',
          nome: 'Test',
          cpf: '12345678901',
          email: 'email-invalido'
        })
      ).rejects.toThrow();
    });

    it('deve validar formato de telefone E.164', async () => {
      await expect(
        Cliente.create({
          tipo_pessoa: 'FISICA',
          nome: 'Test',
          cpf: '12345678901',
          telefone_e164: '11999998888' // Formato inválido (sem +)
        })
      ).rejects.toThrow();
    });
  });

  describe('Campos de endereço', () => {
    it('deve armazenar endereço completo', async () => {
      const cliente = await Cliente.create({
        tipo_pessoa: 'FISICA',
        nome: 'João Silva',
        cpf: '12345678901',
        cep: '01310100',
        logradouro: 'Avenida Paulista',
        numero: '1000',
        complemento: 'Apto 101',
        bairro: 'Bela Vista',
        cidade: 'São Paulo',
        estado: 'SP'
      });

      expect(cliente.cep).toBe('01310100');
      expect(cliente.logradouro).toBe('Avenida Paulista');
      expect(cliente.cidade).toBe('São Paulo');
      expect(cliente.estado).toBe('SP');
    });
  });

  describe('Campo ativo', () => {
    it('deve ter ativo como true por padrão', async () => {
      const cliente = await Cliente.create({
        tipo_pessoa: 'FISICA',
        nome: 'Test',
        cpf: '12345678901'
      });

      expect(cliente.ativo).toBe(true);
    });

    it('deve permitir definir ativo como false', async () => {
      const cliente = await Cliente.create({
        tipo_pessoa: 'FISICA',
        nome: 'Test',
        cpf: '12345678901',
        ativo: false
      });

      expect(cliente.ativo).toBe(false);
    });
  });

  describe('Unicidade de CPF/CNPJ', () => {
    it('deve garantir unicidade de CPF', async () => {
      await Cliente.create({
        tipo_pessoa: 'FISICA',
        nome: 'Cliente 1',
        cpf: '12345678901'
      });

      await expect(
        Cliente.create({
          tipo_pessoa: 'FISICA',
          nome: 'Cliente 2',
          cpf: '12345678901'
        })
      ).rejects.toThrow();
    });

    it('deve garantir unicidade de CNPJ', async () => {
      await Cliente.create({
        tipo_pessoa: 'JURIDICA',
        nome: 'Empresa 1',
        cnpj: '12345678000190'
      });

      await expect(
        Cliente.create({
          tipo_pessoa: 'JURIDICA',
          nome: 'Empresa 2',
          cnpj: '12345678000190'
        })
      ).rejects.toThrow();
    });
  });
});

