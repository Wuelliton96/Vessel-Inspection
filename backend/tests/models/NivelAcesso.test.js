const { NivelAcesso, sequelize } = require('../../models');
const { Op } = require('sequelize');

describe('Modelo NivelAcesso', () => {
  beforeEach(async () => {
    // Limpar níveis criados nos testes anteriores (exceto os padrões com id 1 e 2)
    try {
      await NivelAcesso.destroy({ 
        where: { 
          id: { [Op.gt]: 2 } 
        }, 
        force: true 
      });
    } catch (error) {
      // Ignorar se não conseguir deletar (pode ter foreign keys)
      // eslint-disable-next-line no-empty
    }
  });

  afterAll(async () => {
    await sequelize.close();
  });

  describe('Criação de nível de acesso', () => {
    it('deve criar um nível de acesso com dados válidos', async () => {
      const nivelData = {
        nome: `ADMIN_TEST_${Date.now()}`,
        descricao: 'Nível de acesso para administradores do sistema'
      };

      const nivel = await NivelAcesso.create(nivelData);

      expect(nivel).toBeDefined();
      expect(nivel.nome).toBe(nivelData.nome);
      expect(nivel.descricao).toBe(nivelData.descricao);
    });

    it('deve criar nível de acesso sem descrição', async () => {
      const nivelData = {
        nome: `VIST_TEST_${Date.now()}`
      };

      const nivel = await NivelAcesso.create(nivelData);

      expect(nivel).toBeDefined();
      expect(nivel.nome).toBe(nivelData.nome);
      expect(nivel.descricao).toBeNull();
    });

    it('deve falhar ao criar nível sem nome', async () => {
      const nivelData = {
        descricao: 'Descrição sem nome'
      };

      await expect(NivelAcesso.create(nivelData)).rejects.toThrow();
    });
  });

  describe('Validações de unicidade', () => {
    it('deve falhar ao criar nível com nome duplicado', async () => {
      const timestamp = Date.now();
      const nomeDuplicado = `NIVEL_DUPLICADO_${timestamp}`;
      const nivelData1 = {
        nome: nomeDuplicado,
        descricao: 'Primeiro nível'
      };

      const nivelData2 = {
        nome: nomeDuplicado,
        descricao: 'Segundo nível'
      };

      await NivelAcesso.create(nivelData1);
      await expect(NivelAcesso.create(nivelData2)).rejects.toThrow();
    });
  });

  describe('Operações CRUD', () => {
    let nivel;

    beforeEach(async () => {
      const timestamp = Date.now();
      nivel = await NivelAcesso.create({
        nome: `NIVEL_CRUD_${timestamp}`,
        descricao: 'Nível para testes CRUD'
      });
    });

    it('deve buscar nível por ID', async () => {
      const nivelEncontrado = await NivelAcesso.findByPk(nivel.id);
      expect(nivelEncontrado).toBeDefined();
      expect(nivelEncontrado.nome).toBe(nivel.nome); // Usar o nome real do nível criado
    });

    it('deve buscar nível por nome', async () => {
      const nivelEncontrado = await NivelAcesso.findOne({
        where: { nome: nivel.nome } // Usar o nome real do nível criado
      });
      expect(nivelEncontrado).toBeDefined();
      expect(nivelEncontrado.id).toBe(nivel.id);
    });

    it('deve atualizar nível', async () => {
      await nivel.update({ 
        nome: 'NIVEL_ATUALIZADO',
        descricao: 'Descrição atualizada'
      });
      
      const nivelAtualizado = await NivelAcesso.findByPk(nivel.id);
      expect(nivelAtualizado.nome).toBe('NIVEL_ATUALIZADO');
      expect(nivelAtualizado.descricao).toBe('Descrição atualizada');
    });

    it('deve deletar nível', async () => {
      await nivel.destroy();
      
      const nivelDeletado = await NivelAcesso.findByPk(nivel.id);
      expect(nivelDeletado).toBeNull();
    });
  });

  describe('Níveis de acesso padrão', () => {
    it('deve criar níveis de acesso padrão do sistema', async () => {
      const timestamp = Date.now();
      const niveisPadrao = [
        { nome: `ADMIN_PADRAO_${timestamp}`, descricao: 'Acesso total ao sistema' },
        { nome: `VIST_PADRAO_${timestamp}`, descricao: 'Pode realizar vistorias' },
        { nome: `APROV_PADRAO_${timestamp}`, descricao: 'Pode aprovar vistorias' }
      ];

      for (const nivelData of niveisPadrao) {
        const nivel = await NivelAcesso.create(nivelData);
        expect(nivel).toBeDefined();
        expect(nivel.nome).toBe(nivelData.nome);
      }
    });
  });
});
