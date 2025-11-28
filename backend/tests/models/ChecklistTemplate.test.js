const { ChecklistTemplate, sequelize } = require('../../models');

describe('Modelo ChecklistTemplate', () => {
  afterAll(async () => {
    await sequelize.close();
  });

  beforeEach(async () => {
    await ChecklistTemplate.destroy({ where: {}, force: true });
  });

  describe('Criação de template', () => {
    it('deve criar template com dados válidos', async () => {
      const template = await ChecklistTemplate.create({
        tipo_embarcacao: 'JET_SKI',
        nome: 'Checklist Jet Ski',
        descricao: 'Checklist para vistoria de jet ski'
      });

      expect(template).toBeDefined();
      expect(template.tipo_embarcacao).toBe('JET_SKI');
      expect(template.nome).toBe('Checklist Jet Ski');
    });

    it('deve ter ativo como true por padrão', async () => {
      const template = await ChecklistTemplate.create({
        tipo_embarcacao: 'LANCHA',
        nome: 'Checklist Lancha'
      });

      expect(template.ativo).toBe(true);
    });

    it('deve exigir tipo_embarcacao', async () => {
      await expect(
        ChecklistTemplate.create({
          nome: 'Checklist Test'
        })
      ).rejects.toThrow();
    });

    it('deve exigir nome', async () => {
      await expect(
        ChecklistTemplate.create({
          tipo_embarcacao: 'JET_SKI'
        })
      ).rejects.toThrow();
    });
  });

  describe('Unicidade de tipo_embarcacao', () => {
    it('deve garantir unicidade de tipo_embarcacao', async () => {
      await ChecklistTemplate.create({
        tipo_embarcacao: 'JET_SKI',
        nome: 'Checklist 1'
      });

      await expect(
        ChecklistTemplate.create({
          tipo_embarcacao: 'JET_SKI',
          nome: 'Checklist 2'
        })
      ).rejects.toThrow();
    });
  });
});

