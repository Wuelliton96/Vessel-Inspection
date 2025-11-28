const { ConfiguracaoLaudo, Usuario, sequelize } = require('../../models');
const { generateTestCPF, setupTestEnvironment } = require('../helpers/testHelpers');
const bcrypt = require('bcryptjs');

describe('Modelo ConfiguracaoLaudo', () => {
  let testUser;

  beforeAll(async () => {
    const { nivelAdmin } = await setupTestEnvironment();
    const senhaHash = await bcrypt.hash('Teste@123', 10);
    
    testUser = await Usuario.create({
      cpf: generateTestCPF('conf01'),
      nome: 'Test User',
      email: 'test@config.com',
      senha_hash: senhaHash,
      nivel_acesso_id: nivelAdmin.id
    });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  beforeEach(async () => {
    await ConfiguracaoLaudo.destroy({ where: {}, force: true });
  });

  describe('Criação de configuração', () => {
    it('deve criar configuração com dados válidos', async () => {
      const config = await ConfiguracaoLaudo.create({
        nome_empresa: 'Empresa Test',
        logo_empresa_url: 'http://example.com/logo.png',
        nota_rodape: 'Nota de rodapé',
        empresa_prestadora: 'Prestadora Test',
        usuario_id: testUser.id
      });

      expect(config).toBeDefined();
      expect(config.nome_empresa).toBe('Empresa Test');
      expect(config.padrao).toBe(true);
    });

    it('deve ter padrao como true por padrão', async () => {
      const config = await ConfiguracaoLaudo.create({
        usuario_id: testUser.id
      });

      expect(config.padrao).toBe(true);
    });

    it('deve permitir criar configuração sem campos opcionais', async () => {
      const config = await ConfiguracaoLaudo.create({
        usuario_id: testUser.id
      });

      expect(config).toBeDefined();
      expect(config.nome_empresa).toBeNull();
    });
  });

  describe('Atualização de configuração', () => {
    it('deve atualizar campos da configuração', async () => {
      const config = await ConfiguracaoLaudo.create({
        nome_empresa: 'Empresa Antiga',
        usuario_id: testUser.id
      });

      await config.update({
        nome_empresa: 'Empresa Nova',
        nota_rodape: 'Nova nota'
      });

      expect(config.nome_empresa).toBe('Empresa Nova');
      expect(config.nota_rodape).toBe('Nova nota');
    });
  });
});

