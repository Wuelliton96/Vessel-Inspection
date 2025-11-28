const bcrypt = require('bcryptjs');
const { Usuario, NivelAcesso } = require('../../models');
const { setupTestEnvironment, generateTestCPF } = require('../helpers/testHelpers');

describe('Modelo Usuario', () => {
  let nivelAcesso;
  let cpfCounter = 0;

  const hashPassword = async () => await bcrypt.hash('Teste@123', 10);

  const createUsuarioData = async (overrides = {}) => {
    cpfCounter++;
    const senhaHash = await hashPassword();
    return {
      cpf: generateTestCPF(cpfCounter),
      nome: 'João Silva',
      email: `usuario${cpfCounter}@teste.com`,
      senha_hash: senhaHash,
      nivel_acesso_id: nivelAcesso.id,
      ativo: true,
      ...overrides
    };
  };

  const createTestUsuario = async (overrides = {}) => {
    const usuarioData = await createUsuarioData(overrides);
    return await Usuario.create(usuarioData);
  };

  const expectUsuarioCreationToFail = async (usuarioData) => {
    await expect(Usuario.create(usuarioData)).rejects.toThrow();
  };

  beforeEach(async () => {
    const { nivelVistoriador } = await setupTestEnvironment();
    nivelAcesso = nivelVistoriador;
    cpfCounter = 0;
  });

  describe('Criação de usuário', () => {
    it('deve criar um usuário com dados válidos', async () => {
      const usuarioData = await createUsuarioData({
        nome: 'João Silva',
        email: 'joao@teste.com'
      });
      const usuario = await Usuario.create(usuarioData);

      expect(usuario).toBeDefined();
      expect(usuario.cpf).toBe(usuarioData.cpf);
      expect(usuario.nome).toBe(usuarioData.nome);
      expect(usuario.email).toBe(usuarioData.email);
      expect(usuario.nivel_acesso_id).toBe(usuarioData.nivel_acesso_id);
      expect(usuario.ativo).toBe(usuarioData.ativo);
    });

    it('deve definir ativo como true por padrão', async () => {
      const usuarioData = await createUsuarioData({
        nome: 'Maria Santos',
        email: 'maria@teste.com'
      });
      delete usuarioData.ativo;

      const usuario = await Usuario.create(usuarioData);
      expect(usuario.ativo).toBe(true);
    });

    it('deve falhar ao criar usuário sem cpf', async () => {
      const usuarioData = await createUsuarioData();
      delete usuarioData.cpf;
      await expectUsuarioCreationToFail(usuarioData);
    });

    it('deve falhar ao criar usuário sem nome', async () => {
      const usuarioData = await createUsuarioData();
      delete usuarioData.nome;
      await expectUsuarioCreationToFail(usuarioData);
    });

    it('deve falhar ao criar usuário sem senha_hash', async () => {
      const usuarioData = await createUsuarioData();
      delete usuarioData.senha_hash;
      await expectUsuarioCreationToFail(usuarioData);
    });

    it('deve falhar ao criar usuário sem nivel_acesso_id', async () => {
      const usuarioData = await createUsuarioData();
      delete usuarioData.nivel_acesso_id;
      await expectUsuarioCreationToFail(usuarioData);
    });
  });

  describe('Validações de unicidade', () => {
    it('deve falhar ao criar usuário com cpf duplicado', async () => {
      const cpfDuplicado = generateTestCPF(999);
      const usuarioData1 = await createUsuarioData({ cpf: cpfDuplicado });
      const usuarioData2 = await createUsuarioData({ 
        cpf: cpfDuplicado,
        nome: 'Maria Santos',
        email: 'maria@teste.com'
      });

      await Usuario.create(usuarioData1);
      await expect(Usuario.create(usuarioData2)).rejects.toThrow();
    });

    it('deve falhar ao criar usuário com email duplicado', async () => {
      const emailDuplicado = 'email@duplicado.com';
      const usuarioData1 = await createUsuarioData({ email: emailDuplicado });
      const usuarioData2 = await createUsuarioData({ 
        nome: 'Maria Santos',
        email: emailDuplicado
      });

      await Usuario.create(usuarioData1);
      await expect(Usuario.create(usuarioData2)).rejects.toThrow();
    });
  });

  describe('Associações', () => {
    it('deve incluir NivelAcesso ao buscar usuário', async () => {
      const usuarioData = await createUsuarioData();
      await Usuario.create(usuarioData);

      const usuario = await Usuario.findOne({
        where: { cpf: usuarioData.cpf },
        include: NivelAcesso
      });

      expect(usuario).toBeDefined();
      expect(usuario.NivelAcesso).toBeDefined();
      expect(usuario.NivelAcesso.nome).toBe('VISTORIADOR');
    });
  });

  describe('Operações CRUD', () => {
    let usuario;

    beforeEach(async () => {
      usuario = await createTestUsuario({
        nome: 'Usuário CRUD',
        email: 'crud@teste.com'
      });
    });

    it('deve buscar usuário por ID', async () => {
      const usuarioEncontrado = await Usuario.findByPk(usuario.id);
      expect(usuarioEncontrado).toBeDefined();
      expect(usuarioEncontrado.nome).toBe('Usuário CRUD');
    });

    it('deve atualizar usuário', async () => {
      await usuario.update({ nome: 'Nome Atualizado' });
      const usuarioAtualizado = await Usuario.findByPk(usuario.id);
      expect(usuarioAtualizado.nome).toBe('Nome Atualizado');
    });

    it('deve deletar usuário', async () => {
      await usuario.destroy();
      const usuarioDeletado = await Usuario.findByPk(usuario.id);
      expect(usuarioDeletado).toBeNull();
    });
  });
});
