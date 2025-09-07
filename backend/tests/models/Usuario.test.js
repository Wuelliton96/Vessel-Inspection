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
      const usuarioData = {
        clerk_user_id: 'clerk_123',
        nome: 'João Silva',
        email: 'joao@teste.com',
        nivel_acesso_id: nivelAcesso.id,
        ativo: true
      };

      const usuario = await Usuario.create(usuarioData);

      expect(usuario).toBeDefined();
      expect(usuario.clerk_user_id).toBe(usuarioData.clerk_user_id);
      expect(usuario.nome).toBe(usuarioData.nome);
      expect(usuario.email).toBe(usuarioData.email);
      expect(usuario.nivel_acesso_id).toBe(usuarioData.nivel_acesso_id);
      expect(usuario.ativo).toBe(usuarioData.ativo);
    });

    it('deve definir ativo como true por padrão', async () => {
      const usuarioData = {
        clerk_user_id: 'clerk_456',
        nome: 'Maria Santos',
        email: 'maria@teste.com',
        nivel_acesso_id: nivelAcesso.id
      };

      const usuario = await Usuario.create(usuarioData);

      expect(usuario.ativo).toBe(true);
    });

    it('deve falhar ao criar usuário sem clerk_user_id', async () => {
      const usuarioData = {
        nome: 'João Silva',
        email: 'joao@teste.com',
        nivel_acesso_id: nivelAcesso.id
      };

      await expect(Usuario.create(usuarioData)).rejects.toThrow();
    });

    it('deve falhar ao criar usuário sem nome', async () => {
      const usuarioData = {
        clerk_user_id: 'clerk_123',
        email: 'joao@teste.com',
        nivel_acesso_id: nivelAcesso.id
      };

      await expect(Usuario.create(usuarioData)).rejects.toThrow();
    });

    it('deve falhar ao criar usuário sem email', async () => {
      const usuarioData = {
        clerk_user_id: 'clerk_123',
        nome: 'João Silva',
        nivel_acesso_id: nivelAcesso.id
      };

      await expect(Usuario.create(usuarioData)).rejects.toThrow();
    });

    it('deve falhar ao criar usuário sem nivel_acesso_id', async () => {
      const usuarioData = {
        clerk_user_id: 'clerk_123',
        nome: 'João Silva',
        email: 'joao@teste.com'
      };

      await expect(Usuario.create(usuarioData)).rejects.toThrow();
    });
  });

  describe('Validações de unicidade', () => {
    it('deve falhar ao criar usuário com clerk_user_id duplicado', async () => {
      const usuarioData1 = {
        clerk_user_id: 'clerk_duplicado',
        nome: 'João Silva',
        email: 'joao@teste.com',
        nivel_acesso_id: nivelAcesso.id
      };

      const usuarioData2 = {
        clerk_user_id: 'clerk_duplicado',
        nome: 'Maria Santos',
        email: 'maria@teste.com',
        nivel_acesso_id: nivelAcesso.id
      };

      await Usuario.create(usuarioData1);
      await expect(Usuario.create(usuarioData2)).rejects.toThrow();
    });

    it('deve falhar ao criar usuário com email duplicado', async () => {
      const usuarioData1 = {
        clerk_user_id: 'clerk_123',
        nome: 'João Silva',
        email: 'email@duplicado.com',
        nivel_acesso_id: nivelAcesso.id
      };

      const usuarioData2 = {
        clerk_user_id: 'clerk_456',
        nome: 'Maria Santos',
        email: 'email@duplicado.com',
        nivel_acesso_id: nivelAcesso.id
      };

      await Usuario.create(usuarioData1);
      await expect(Usuario.create(usuarioData2)).rejects.toThrow();
    });
  });

  describe('Associações', () => {
    it('deve incluir NivelAcesso ao buscar usuário', async () => {
      const usuarioData = {
        clerk_user_id: 'clerk_123',
        nome: 'João Silva',
        email: 'joao@teste.com',
        nivel_acesso_id: nivelAcesso.id
      };

      await Usuario.create(usuarioData);

      const usuario = await Usuario.findOne({
        where: { clerk_user_id: 'clerk_123' },
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
      usuario = await Usuario.create({
        clerk_user_id: 'clerk_crud',
        nome: 'Usuário CRUD',
        email: 'crud@teste.com',
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
