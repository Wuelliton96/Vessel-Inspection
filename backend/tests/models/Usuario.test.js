const bcrypt = require('bcryptjs');
const { Usuario, NivelAcesso } = require('../../models');

describe('Modelo Usuario', () => {
  let nivelAcesso;

  beforeEach(async () => {
    // Criar um nível de acesso para os testes
    nivelAcesso = await NivelAcesso.create({
      nome: 'VISTORIADOR',
      descricao: 'Nível de acesso para vistoriadores'
    });
  });

  describe('Criação de usuário', () => {
    it('deve criar um usuário com dados válidos', async () => {
      const senhaHash = await bcrypt.hash('Teste@123', 10);
      const usuarioData = {
        cpf: '12345678901',
        nome: 'João Silva',
        email: 'joao@teste.com',
        senha_hash: senhaHash,
        nivel_acesso_id: nivelAcesso.id,
        ativo: true
      };

      const usuario = await Usuario.create(usuarioData);

      expect(usuario).toBeDefined();
      expect(usuario.cpf).toBe(usuarioData.cpf);
      expect(usuario.nome).toBe(usuarioData.nome);
      expect(usuario.email).toBe(usuarioData.email);
      expect(usuario.nivel_acesso_id).toBe(usuarioData.nivel_acesso_id);
      expect(usuario.ativo).toBe(usuarioData.ativo);
    });

    it('deve definir ativo como true por padrão', async () => {
      const senhaHash = await bcrypt.hash('Teste@123', 10);
      const usuarioData = {
        cpf: '12345678902',
        nome: 'Maria Santos',
        email: 'maria@teste.com',
        senha_hash: senhaHash,
        nivel_acesso_id: nivelAcesso.id
      };

      const usuario = await Usuario.create(usuarioData);

      expect(usuario.ativo).toBe(true);
    });

    it('deve falhar ao criar usuário sem cpf', async () => {
      const senhaHash = await bcrypt.hash('Teste@123', 10);
      const usuarioData = {
        nome: 'João Silva',
        email: 'joao@teste.com',
        senha_hash: senhaHash,
        nivel_acesso_id: nivelAcesso.id
      };

      await expect(Usuario.create(usuarioData)).rejects.toThrow();
    });

    it('deve falhar ao criar usuário sem nome', async () => {
      const senhaHash = await bcrypt.hash('Teste@123', 10);
      const usuarioData = {
        cpf: '12345678903',
        email: 'joao@teste.com',
        senha_hash: senhaHash,
        nivel_acesso_id: nivelAcesso.id
      };

      await expect(Usuario.create(usuarioData)).rejects.toThrow();
    });

    it('deve falhar ao criar usuário sem senha_hash', async () => {
      const usuarioData = {
        cpf: '12345678904',
        nome: 'João Silva',
        nivel_acesso_id: nivelAcesso.id
      };

      await expect(Usuario.create(usuarioData)).rejects.toThrow();
    });

    it('deve falhar ao criar usuário sem nivel_acesso_id', async () => {
      const senhaHash = await bcrypt.hash('Teste@123', 10);
      const usuarioData = {
        cpf: '12345678905',
        nome: 'João Silva',
        email: 'joao@teste.com',
        senha_hash: senhaHash
      };

      await expect(Usuario.create(usuarioData)).rejects.toThrow();
    });
  });

  describe('Validações de unicidade', () => {
    it('deve falhar ao criar usuário com cpf duplicado', async () => {
      const senhaHash = await bcrypt.hash('Teste@123', 10);
      const usuarioData1 = {
        cpf: '12345678906',
        nome: 'João Silva',
        email: 'joao@teste.com',
        senha_hash: senhaHash,
        nivel_acesso_id: nivelAcesso.id
      };

      const usuarioData2 = {
        cpf: '12345678906',
        nome: 'Maria Santos',
        email: 'maria@teste.com',
        senha_hash: senhaHash,
        nivel_acesso_id: nivelAcesso.id
      };

      await Usuario.create(usuarioData1);
      await expect(Usuario.create(usuarioData2)).rejects.toThrow();
    });

    it('deve falhar ao criar usuário com email duplicado', async () => {
      const senhaHash = await bcrypt.hash('Teste@123', 10);
      const usuarioData1 = {
        cpf: '12345678907',
        nome: 'João Silva',
        email: 'email@duplicado.com',
        senha_hash: senhaHash,
        nivel_acesso_id: nivelAcesso.id
      };

      const usuarioData2 = {
        cpf: '12345678908',
        nome: 'Maria Santos',
        email: 'email@duplicado.com',
        senha_hash: senhaHash,
        nivel_acesso_id: nivelAcesso.id
      };

      await Usuario.create(usuarioData1);
      await expect(Usuario.create(usuarioData2)).rejects.toThrow();
    });
  });

  describe('Associações', () => {
    it('deve incluir NivelAcesso ao buscar usuário', async () => {
      const senhaHash = await bcrypt.hash('Teste@123', 10);
      const usuarioData = {
        cpf: '12345678909',
        nome: 'João Silva',
        email: 'joao@teste.com',
        senha_hash: senhaHash,
        nivel_acesso_id: nivelAcesso.id
      };

      await Usuario.create(usuarioData);

      const usuario = await Usuario.findOne({
        where: { cpf: '12345678909' },
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
      const senhaHash = await bcrypt.hash('Teste@123', 10);
      usuario = await Usuario.create({
        cpf: '12345678910',
        nome: 'Usuário CRUD',
        email: 'crud@teste.com',
        senha_hash: senhaHash,
        nivel_acesso_id: nivelAcesso.id
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
