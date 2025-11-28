const { StatusVistoria, sequelize } = require('../../models');

describe('Modelo StatusVistoria', () => {
  beforeEach(async () => {
    // Não limpar status antes de cada teste pois podem ter foreign keys
    // Os testes devem usar nomes únicos para evitar conflitos
  });

  afterAll(async () => {
    await sequelize.close();
  });

  describe('Criação de status de vistoria', () => {
    it('deve criar um status com dados válidos', async () => {
      const timestamp = Date.now();
      const statusData = {
        nome: `CONCLUIDA_${timestamp}`,
        descricao: 'Vistoria concluída com sucesso'
      };

      const status = await StatusVistoria.create(statusData);

      expect(status).toBeDefined();
      expect(status.nome).toBe(statusData.nome);
      expect(status.descricao).toBe(statusData.descricao);
    });

    it('deve criar status sem descrição', async () => {
      const timestamp = Date.now();
      const statusData = {
        nome: `EM_ANDAMENTO_${timestamp}`
      };

      const status = await StatusVistoria.create(statusData);

      expect(status).toBeDefined();
      expect(status.nome).toBe(statusData.nome);
      expect(status.descricao).toBeNull();
    });

    it('deve falhar ao criar status sem nome', async () => {
      const statusData = {
        descricao: 'Descrição sem nome'
      };

      await expect(StatusVistoria.create(statusData)).rejects.toThrow();
    });
  });

  describe('Validações de unicidade', () => {
    it('deve falhar ao criar status com nome duplicado', async () => {
      const timestamp = Date.now();
      const nomeDuplicado = `STATUS_DUPLICADO_${timestamp}`;
      const statusData1 = {
        nome: nomeDuplicado,
        descricao: 'Primeiro status'
      };

      const statusData2 = {
        nome: nomeDuplicado,
        descricao: 'Segundo status'
      };

      await StatusVistoria.create(statusData1);
      await expect(StatusVistoria.create(statusData2)).rejects.toThrow();
    });
  });

  describe('Operações CRUD', () => {
    let status;

    beforeEach(async () => {
      const timestamp = Date.now();
      status = await StatusVistoria.create({
        nome: `STATUS_CRUD_${timestamp}`,
        descricao: 'Status para testes CRUD'
      });
    });

    it('deve buscar status por ID', async () => {
      const statusEncontrado = await StatusVistoria.findByPk(status.id);
      expect(statusEncontrado).toBeDefined();
      expect(statusEncontrado.nome).toBe(status.nome); // Usar o nome real do status criado
    });

    it('deve buscar status por nome', async () => {
      const statusEncontrado = await StatusVistoria.findOne({
        where: { nome: status.nome } // Usar o nome real do status criado
      });
      expect(statusEncontrado).toBeDefined();
      expect(statusEncontrado.id).toBe(status.id);
    });

    it('deve atualizar status', async () => {
      await status.update({ 
        nome: 'STATUS_ATUALIZADO',
        descricao: 'Descrição atualizada'
      });
      
      const statusAtualizado = await StatusVistoria.findByPk(status.id);
      expect(statusAtualizado.nome).toBe('STATUS_ATUALIZADO');
      expect(statusAtualizado.descricao).toBe('Descrição atualizada');
    });

    it('deve deletar status', async () => {
      await status.destroy();
      
      const statusDeletado = await StatusVistoria.findByPk(status.id);
      expect(statusDeletado).toBeNull();
    });
  });

  describe('Status padrão do sistema', () => {
    it('deve criar status padrão do sistema', async () => {
      const timestamp = Date.now();
      const statusPadrao = [
        { nome: `PENDENTE_${timestamp}`, descricao: 'Vistoria pendente de início' },
        { nome: `EM_ANDAMENTO_${timestamp}`, descricao: 'Vistoria em andamento' },
        { nome: `CONCLUIDA_${timestamp}`, descricao: 'Vistoria concluída' },
        { nome: `APROVADA_${timestamp}`, descricao: 'Vistoria aprovada' },
        { nome: `REJEITADA_${timestamp}`, descricao: 'Vistoria rejeitada' }
      ];

      for (const statusData of statusPadrao) {
        const status = await StatusVistoria.create(statusData);
        expect(status).toBeDefined();
        expect(status.nome).toBe(statusData.nome);
        expect(status.descricao).toBe(statusData.descricao);
      }
    });

    it('deve buscar status por nome específico', async () => {
      const timestamp = Date.now();
      const nomeStatus = `PENDENTE_${timestamp}`;
      await StatusVistoria.create({
        nome: nomeStatus,
        descricao: 'Vistoria pendente'
      });

      const statusPendente = await StatusVistoria.findOne({
        where: { nome: nomeStatus }
      });

      expect(statusPendente).toBeDefined();
      expect(statusPendente.nome).toBe(nomeStatus);
    });
  });

  describe('Consultas complexas', () => {
    let status1, status2, status3;
    let timestamp;
    
    beforeEach(async () => {
      timestamp = Date.now();
      status1 = await StatusVistoria.create({ nome: `PENDENTE_${timestamp}`, descricao: 'Pendente' });
      status2 = await StatusVistoria.create({ nome: `EM_ANDAMENTO_${timestamp}`, descricao: 'Em andamento' });
      status3 = await StatusVistoria.create({ nome: `CONCLUIDA_${timestamp}`, descricao: 'Concluída' });
    });

    it('deve buscar todos os status', async () => {
      const todosStatus = await StatusVistoria.findAll({
        where: {
          nome: {
            [require('sequelize').Op.like]: `%_${timestamp}`
          }
        }
      });
      expect(todosStatus.length).toBeGreaterThanOrEqual(3);
    });

    it('deve buscar status com descrição contendo texto específico', async () => {
      const statusComDescricao = await StatusVistoria.findAll({
        where: {
          descricao: {
            [require('sequelize').Op.like]: '%andamento%'
          },
          nome: {
            [require('sequelize').Op.like]: `%_${timestamp}`
          }
        }
      });

      expect(statusComDescricao.length).toBeGreaterThanOrEqual(1);
      expect(statusComDescricao[0].nome).toContain('EM_ANDAMENTO');
    });

    it('deve ordenar status por nome', async () => {
      const statusOrdenados = await StatusVistoria.findAll({
        where: {
          nome: {
            [require('sequelize').Op.like]: `%_${timestamp}`
          }
        },
        order: [['nome', 'ASC']]
      });

      expect(statusOrdenados.length).toBeGreaterThanOrEqual(3);
      // Verificar que estão ordenados
      const nomes = statusOrdenados.map(s => s.nome);
      expect(nomes).toEqual([...nomes].sort());
    });
  });
});
