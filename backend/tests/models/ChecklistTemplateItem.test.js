const { ChecklistTemplateItem, ChecklistTemplate, sequelize } = require('../../models');

describe('Modelo ChecklistTemplateItem', () => {
  let template;

  beforeAll(async () => {
    template = await ChecklistTemplate.create({
      tipo_embarcacao: 'JET_SKI',
      nome: 'Checklist Jet Ski'
    });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  beforeEach(async () => {
    await ChecklistTemplateItem.destroy({ where: {}, force: true });
  });

  describe('Criação de item', () => {
    it('deve criar item com dados válidos', async () => {
      const item = await ChecklistTemplateItem.create({
        checklist_template_id: template.id,
        ordem: 1,
        nome: 'Proa',
        descricao: 'Foto da proa',
        obrigatorio: true
      });

      expect(item).toBeDefined();
      expect(item.nome).toBe('Proa');
      expect(item.ordem).toBe(1);
    });

    it('deve ter obrigatorio como true por padrão', async () => {
      const item = await ChecklistTemplateItem.create({
        checklist_template_id: template.id,
        ordem: 1,
        nome: 'Test'
      });

      expect(item.obrigatorio).toBe(true);
    });

    it('deve ter permite_video como false por padrão', async () => {
      const item = await ChecklistTemplateItem.create({
        checklist_template_id: template.id,
        ordem: 1,
        nome: 'Test'
      });

      expect(item.permite_video).toBe(false);
    });

    it('deve ter ativo como true por padrão', async () => {
      const item = await ChecklistTemplateItem.create({
        checklist_template_id: template.id,
        ordem: 1,
        nome: 'Test'
      });

      expect(item.ativo).toBe(true);
    });

    it('deve exigir checklist_template_id', async () => {
      await expect(
        ChecklistTemplateItem.create({
          ordem: 1,
          nome: 'Test'
        })
      ).rejects.toThrow();
    });

    it('deve exigir ordem', async () => {
      await expect(
        ChecklistTemplateItem.create({
          checklist_template_id: template.id,
          nome: 'Test'
        })
      ).rejects.toThrow();
    });

    it('deve exigir nome', async () => {
      await expect(
        ChecklistTemplateItem.create({
          checklist_template_id: template.id,
          ordem: 1
        })
      ).rejects.toThrow();
    });
  });
});

