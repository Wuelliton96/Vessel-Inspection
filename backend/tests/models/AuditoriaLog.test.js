const { AuditoriaLog, Usuario, sequelize } = require('../../models');
const { generateTestCPF, setupTestEnvironment } = require('../helpers/testHelpers');
const bcrypt = require('bcryptjs');

describe('Modelo AuditoriaLog', () => {
  let testUser;

  beforeAll(async () => {
    const { nivelAdmin } = await setupTestEnvironment();
    const senhaHash = await bcrypt.hash('Teste@123', 10);
    
    testUser = await Usuario.create({
      cpf: generateTestCPF('audlog01'),
      nome: 'Test User',
      email: 'test@auditoria.com',
      senha_hash: senhaHash,
      nivel_acesso_id: nivelAdmin.id
    });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  beforeEach(async () => {
    await AuditoriaLog.destroy({ where: {}, force: true });
  });

  describe('Criação de log de auditoria', () => {
    it('deve criar log de auditoria com dados válidos', async () => {
      const log = await AuditoriaLog.create({
        usuario_id: testUser.id,
        usuario_email: testUser.email,
        usuario_nome: testUser.nome,
        acao: 'CREATE',
        entidade: 'Usuario',
        entidade_id: testUser.id,
        ip_address: '127.0.0.1',
        user_agent: 'Mozilla/5.0'
      });

      expect(log).toBeDefined();
      expect(log.id).toBeDefined();
      expect(log.acao).toBe('CREATE');
      expect(log.entidade).toBe('Usuario');
    });

    it('deve criar log sem usuario_id', async () => {
      const log = await AuditoriaLog.create({
        usuario_email: 'sistema',
        usuario_nome: 'Sistema',
        acao: 'SYSTEM',
        entidade: 'System',
        ip_address: '127.0.0.1'
      });

      expect(log.usuario_id).toBeNull();
      expect(log.usuario_email).toBe('sistema');
    });

    it('deve armazenar dados anteriores e novos como JSON', async () => {
      const dadosAnteriores = { nome: 'Antigo' };
      const dadosNovos = { nome: 'Novo' };

      const log = await AuditoriaLog.create({
        usuario_id: testUser.id,
        usuario_email: testUser.email,
        usuario_nome: testUser.nome,
        acao: 'UPDATE',
        entidade: 'Test',
        dados_anteriores: JSON.stringify(dadosAnteriores),
        dados_novos: JSON.stringify(dadosNovos)
      });

      expect(log.dados_anteriores).toBe(JSON.stringify(dadosAnteriores));
      expect(log.dados_novos).toBe(JSON.stringify(dadosNovos));
    });

    it('deve ter nivel_critico como false por padrão', async () => {
      const log = await AuditoriaLog.create({
        usuario_id: testUser.id,
        usuario_email: testUser.email,
        usuario_nome: testUser.nome,
        acao: 'CREATE',
        entidade: 'Test'
      });

      expect(log.nivel_critico).toBe(false);
    });

    it('deve permitir nivel_critico como true', async () => {
      const log = await AuditoriaLog.create({
        usuario_id: testUser.id,
        usuario_email: testUser.email,
        usuario_nome: testUser.nome,
        acao: 'DELETE',
        entidade: 'Test',
        nivel_critico: true
      });

      expect(log.nivel_critico).toBe(true);
    });
  });

  describe('Validações', () => {
    it('deve exigir usuario_email', async () => {
      await expect(
        AuditoriaLog.create({
          usuario_nome: 'Test',
          acao: 'CREATE',
          entidade: 'Test'
        })
      ).rejects.toThrow();
    });

    it('deve exigir usuario_nome', async () => {
      await expect(
        AuditoriaLog.create({
          usuario_email: 'test@test.com',
          acao: 'CREATE',
          entidade: 'Test'
        })
      ).rejects.toThrow();
    });

    it('deve exigir acao', async () => {
      await expect(
        AuditoriaLog.create({
          usuario_email: 'test@test.com',
          usuario_nome: 'Test',
          entidade: 'Test'
        })
      ).rejects.toThrow();
    });

    it('deve exigir entidade', async () => {
      await expect(
        AuditoriaLog.create({
          usuario_email: 'test@test.com',
          usuario_nome: 'Test',
          acao: 'CREATE'
        })
      ).rejects.toThrow();
    });
  });

  describe('Timestamps', () => {
    it('deve ter created_at', async () => {
      const log = await AuditoriaLog.create({
        usuario_id: testUser.id,
        usuario_email: testUser.email,
        usuario_nome: testUser.nome,
        acao: 'CREATE',
        entidade: 'Test'
      });

      expect(log.createdAt).toBeDefined();
    });

    it('não deve ter updatedAt', async () => {
      const log = await AuditoriaLog.create({
        usuario_id: testUser.id,
        usuario_email: testUser.email,
        usuario_nome: testUser.nome,
        acao: 'CREATE',
        entidade: 'Test'
      });

      expect(log.updatedAt).toBeUndefined();
    });
  });
});

