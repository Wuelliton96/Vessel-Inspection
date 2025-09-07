const { StatusVistoria } = require('../../models');

describe('Modelo StatusVistoria', () => {
  describe('Criação de status de vistoria', () => {
    it('deve criar um status com dados válidos', async () => {
      const statusData = {
        nome: 'CONCLUIDA',
        descricao: 'Vistoria concluída com sucesso'
      };

      const status = await StatusVistoria.create(statusData);

      expect(status).toBeDefined();
      expect(status.nome).toBe(statusData.nome);
      expect(status.descricao).toBe(statusData.descricao);
    });

    it('deve criar status sem descrição', async () => {
      const statusData = {
        nome: 'EM_ANDAMENTO'
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
      const statusData1 = {
        nome: 'STATUS_DUPLICADO',
        descricao: 'Primeiro status'
      };

      const statusData2 = {
        nome: 'STATUS_DUPLICADO',
        descricao: 'Segundo status'
      };

      await StatusVistoria.create(statusData1);
      await expect(StatusVistoria.create(statusData2)).rejects.toThrow();
    });
  });

  describe('Operações CRUD', () => {
    let status;

    beforeEach(async () => {
      status = await StatusVistoria.create({
        nome: 'STATUS_CRUD',
        descricao: 'Status para testes CRUD'
      });
    });

    it('deve buscar status por ID', async () => {
      const statusEncontrado = await StatusVistoria.findByPk(status.id);
      expect(statusEncontrado).toBeDefined();
      expect(statusEncontrado.nome).toBe('STATUS_CRUD');
    });

    it('deve buscar status por nome', async () => {
      const statusEncontrado = await StatusVistoria.findOne({
        where: { nome: 'STATUS_CRUD' }
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
      const statusPadrao = [
        { nome: 'PENDENTE', descricao: 'Vistoria pendente de início' },
        { nome: 'EM_ANDAMENTO', descricao: 'Vistoria em andamento' },
        { nome: 'CONCLUIDA', descricao: 'Vistoria concluída' },
        { nome: 'APROVADA', descricao: 'Vistoria aprovada' },
        { nome: 'REJEITADA', descricao: 'Vistoria rejeitada' }
      ];

      for (const statusData of statusPadrao) {
        const status = await StatusVistoria.create(statusData);
        expect(status).toBeDefined();
        expect(status.nome).toBe(statusData.nome);
        expect(status.descricao).toBe(statusData.descricao);
      }
    });

    it('deve buscar status por nome específico', async () => {
      await StatusVistoria.create({
        nome: 'PENDENTE',
        descricao: 'Vistoria pendente'
      });

      const statusPendente = await StatusVistoria.findOne({
        where: { nome: 'PENDENTE' }
      });

      expect(statusPendente).toBeDefined();
      expect(statusPendente.nome).toBe('PENDENTE');
    });
  });

  describe('Consultas complexas', () => {
    beforeEach(async () => {
      await StatusVistoria.create({ nome: 'PENDENTE', descricao: 'Pendente' });
      await StatusVistoria.create({ nome: 'EM_ANDAMENTO', descricao: 'Em andamento' });
      await StatusVistoria.create({ nome: 'CONCLUIDA', descricao: 'Concluída' });
    });

    it('deve buscar todos os status', async () => {
      const todosStatus = await StatusVistoria.findAll();
      expect(todosStatus).toHaveLength(3);
    });

    it('deve buscar status com descrição contendo texto específico', async () => {
      const statusComDescricao = await StatusVistoria.findAll({
        where: {
          descricao: {
            [require('sequelize').Op.like]: '%andamento%'
          }
        }
      });

      expect(statusComDescricao).toHaveLength(1);
      expect(statusComDescricao[0].nome).toBe('EM_ANDAMENTO');
    });

    it('deve ordenar status por nome', async () => {
      const statusOrdenados = await StatusVistoria.findAll({
        order: [['nome', 'ASC']]
      });

      expect(statusOrdenados).toHaveLength(3);
      expect(statusOrdenados[0].nome).toBe('CONCLUIDA');
      expect(statusOrdenados[1].nome).toBe('EM_ANDAMENTO');
      expect(statusOrdenados[2].nome).toBe('PENDENTE');
    });
  });
});
