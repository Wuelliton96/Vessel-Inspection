const { Embarcacao, sequelize } = require('../../models');

describe('Modelo Embarcacao', () => {
  beforeEach(async () => {
    // Limpar embarcações antes de cada teste (apenas as que não têm foreign keys)
    try {
      await Embarcacao.destroy({ where: {}, force: true });
    } catch (error) {
      // Ignorar erro se houver foreign key constraints
    }
  });

  afterAll(async () => {
    await sequelize.close();
  });

  describe('Criação de embarcação', () => {
    it('deve criar uma embarcação com dados válidos', async () => {
      const embarcacaoData = {
        nome: 'Barco Teste',
        nr_inscricao_barco: 'BT001',
        proprietario_nome: 'João Silva',
        proprietario_email: 'joao@teste.com'
      };

      const embarcacao = await Embarcacao.create(embarcacaoData);

      expect(embarcacao).toBeDefined();
      expect(embarcacao.nome).toBe(embarcacaoData.nome);
      expect(embarcacao.nr_inscricao_barco).toBe(embarcacaoData.nr_inscricao_barco);
      expect(embarcacao.proprietario_nome).toBe(embarcacaoData.proprietario_nome);
      expect(embarcacao.proprietario_email).toBe(embarcacaoData.proprietario_email);
    });

    it('deve criar embarcação apenas com campos obrigatórios', async () => {
      const embarcacaoData = {
        nome: 'Barco Simples',
        nr_inscricao_barco: 'BS001'
      };

      const embarcacao = await Embarcacao.create(embarcacaoData);

      expect(embarcacao).toBeDefined();
      expect(embarcacao.nome).toBe(embarcacaoData.nome);
      expect(embarcacao.nr_inscricao_barco).toBe(embarcacaoData.nr_inscricao_barco);
      expect(embarcacao.proprietario_nome).toBeNull();
      expect(embarcacao.proprietario_email).toBeNull();
    });

    it('deve falhar ao criar embarcação sem nome', async () => {
      const embarcacaoData = {
        nr_inscricao_barco: 'BT001'
      };

      await expect(Embarcacao.create(embarcacaoData)).rejects.toThrow();
    });

    it('deve falhar ao criar embarcação sem número do casco', async () => {
      const embarcacaoData = {
        nome: 'Barco Teste'
      };

      await expect(Embarcacao.create(embarcacaoData)).rejects.toThrow();
    });
  });

  describe('Validações de unicidade', () => {
    it('deve falhar ao criar embarcação com número de casco duplicado', async () => {
      const timestamp = Date.now();
      const nrDuplicado = `DUPLICADO_${timestamp}`;
      const embarcacaoData1 = {
        nome: 'Barco 1',
        nr_inscricao_barco: nrDuplicado
      };

      const embarcacaoData2 = {
        nome: 'Barco 2',
        nr_inscricao_barco: nrDuplicado
      };

      await Embarcacao.create(embarcacaoData1);
      await expect(Embarcacao.create(embarcacaoData2)).rejects.toThrow();
    });
  });

  describe('Operações CRUD', () => {
    let embarcacao;

    beforeEach(async () => {
      const timestamp = Date.now();
      embarcacao = await Embarcacao.create({
        nome: 'Barco CRUD',
        nr_inscricao_barco: `CRUD_${timestamp}`,
        proprietario_nome: 'Proprietário CRUD',
        proprietario_email: `crud_${timestamp}@teste.com`
      });
    });

    it('deve buscar embarcação por ID', async () => {
      const embarcacaoEncontrada = await Embarcacao.findByPk(embarcacao.id);
      expect(embarcacaoEncontrada).toBeDefined();
      expect(embarcacaoEncontrada.nome).toBe('Barco CRUD');
    });

    it('deve buscar embarcação por número do casco', async () => {
      const embarcacaoEncontrada = await Embarcacao.findOne({
        where: { nr_inscricao_barco: embarcacao.nr_inscricao_barco } // Usar o número real da embarcação criada
      });
      expect(embarcacaoEncontrada).toBeDefined();
      expect(embarcacaoEncontrada.id).toBe(embarcacao.id);
    });

    it('deve atualizar embarcação', async () => {
      await embarcacao.update({ 
        nome: 'Barco Atualizado',
        proprietario_nome: 'Proprietário Atualizado'
      });
      
      const embarcacaoAtualizada = await Embarcacao.findByPk(embarcacao.id);
      expect(embarcacaoAtualizada.nome).toBe('Barco Atualizado');
      expect(embarcacaoAtualizada.proprietario_nome).toBe('Proprietário Atualizado');
    });

    it('deve deletar embarcação', async () => {
      await embarcacao.destroy();
      
      const embarcacaoDeletada = await Embarcacao.findByPk(embarcacao.id);
      expect(embarcacaoDeletada).toBeNull();
    });
  });

  describe('Método findOrCreate', () => {
    it('deve criar nova embarcação quando não existe', async () => {
      const embarcacaoData = {
        nome: 'Barco Novo',
        nr_inscricao_barco: 'NOVO001'
      };

      const [embarcacao, criado] = await Embarcacao.findOrCreate({
        where: { nr_inscricao_barco: 'NOVO001' },
        defaults: embarcacaoData
      });

      expect(criado).toBe(true);
      expect(embarcacao.nome).toBe('Barco Novo');
      expect(embarcacao.nr_inscricao_barco).toBe('NOVO001');
    });

    it('deve retornar embarcação existente quando já existe', async () => {
      const embarcacaoData = {
        nome: 'Barco Existente',
        nr_inscricao_barco: 'EXISTENTE001'
      };

      // Criar primeira embarcação
      await Embarcacao.create(embarcacaoData);

      // Tentar criar novamente com findOrCreate
      const [embarcacao, criado] = await Embarcacao.findOrCreate({
        where: { nr_inscricao_barco: 'EXISTENTE001' },
        defaults: { nome: 'Nome Diferente' }
      });

      expect(criado).toBe(false);
      expect(embarcacao.nome).toBe('Barco Existente');
      expect(embarcacao.nr_inscricao_barco).toBe('EXISTENTE001');
    });
  });
});
