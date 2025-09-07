const { NivelAcesso } = require('../../models');

describe('Modelo NivelAcesso', () => {
  describe('Criação de nível de acesso', () => {
    it('deve criar um nível de acesso com dados válidos', async () => {
      const nivelData = {
        nome: 'ADMINISTRADOR',
        descricao: 'Nível de acesso para administradores do sistema'
      };

      const nivel = await NivelAcesso.create(nivelData);

      expect(nivel).toBeDefined();
      expect(nivel.nome).toBe(nivelData.nome);
      expect(nivel.descricao).toBe(nivelData.descricao);
    });

    it('deve criar nível de acesso sem descrição', async () => {
      const nivelData = {
        nome: 'VISTORIADOR'
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
      const nivelData1 = {
        nome: 'NIVEL_DUPLICADO',
        descricao: 'Primeiro nível'
      };

      const nivelData2 = {
        nome: 'NIVEL_DUPLICADO',
        descricao: 'Segundo nível'
      };

      await NivelAcesso.create(nivelData1);
      await expect(NivelAcesso.create(nivelData2)).rejects.toThrow();
    });
  });

  describe('Operações CRUD', () => {
    let nivel;

    beforeEach(async () => {
      nivel = await NivelAcesso.create({
        nome: 'NIVEL_CRUD',
        descricao: 'Nível para testes CRUD'
      });
    });

    it('deve buscar nível por ID', async () => {
      const nivelEncontrado = await NivelAcesso.findByPk(nivel.id);
      expect(nivelEncontrado).toBeDefined();
      expect(nivelEncontrado.nome).toBe('NIVEL_CRUD');
    });

    it('deve buscar nível por nome', async () => {
      const nivelEncontrado = await NivelAcesso.findOne({
        where: { nome: 'NIVEL_CRUD' }
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
      const niveisPadrao = [
        { nome: 'ADMINISTRADOR', descricao: 'Acesso total ao sistema' },
        { nome: 'VISTORIADOR', descricao: 'Pode realizar vistorias' },
        { nome: 'APROVADOR', descricao: 'Pode aprovar vistorias' }
      ];

      for (const nivelData of niveisPadrao) {
        const nivel = await NivelAcesso.create(nivelData);
        expect(nivel).toBeDefined();
        expect(nivel.nome).toBe(nivelData.nome);
      }
    });
  });
});
