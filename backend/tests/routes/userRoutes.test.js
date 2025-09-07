const request = require('supertest');
const express = require('express');
const userRoutes = require('../../routes/userRoutes');
const { Usuario, NivelAcesso } = require('../../models');

describe('Rotas de Usuário', () => {
  let app;

  beforeEach(async () => {
    app = express();
    app.use(express.json());
    app.use('/api/usuarios', userRoutes);

    // Criar nível de acesso padrão
    await NivelAcesso.create({
      nome: 'VISTORIADOR',
      descricao: 'Nível de acesso para vistoriadores'
    });
  });

  describe('POST /api/usuarios/sync', () => {
    it('deve sincronizar novo usuário com sucesso', async () => {
      const usuarioData = {
        id: 'clerk_novo_usuario',
        email: 'novo@teste.com',
        nome: 'Novo Usuário'
      };

      const response = await request(app)
        .post('/api/usuarios/sync')
        .send(usuarioData)
        .expect(201);

      expect(response.body.message).toBe('Usuário sincronizado com sucesso!');
      expect(response.body.usuario).toBeDefined();
      expect(response.body.usuario.clerk_user_id).toBe(usuarioData.id);
      expect(response.body.usuario.email).toBe(usuarioData.email);
      expect(response.body.usuario.nome).toBe(usuarioData.nome);
      expect(response.body.usuario.nivel_acesso_id).toBeDefined();

      // Verificar se o usuário foi criado no banco
      const usuarioCriado = await Usuario.findOne({
        where: { clerk_user_id: usuarioData.id }
      });
      expect(usuarioCriado).toBeDefined();
    });

    it('deve retornar usuário existente quando já está sincronizado', async () => {
      const usuarioData = {
        id: 'clerk_usuario_existente',
        email: 'existente@teste.com',
        nome: 'Usuário Existente'
      };

      // Primeira sincronização
      await request(app)
        .post('/api/usuarios/sync')
        .send(usuarioData)
        .expect(201);

      // Segunda sincronização (deve retornar usuário existente)
      const response = await request(app)
        .post('/api/usuarios/sync')
        .send(usuarioData)
        .expect(200);

      expect(response.body.message).toBe('Usuário já estava sincronizado.');
      expect(response.body.usuario).toBeDefined();
      expect(response.body.usuario.clerk_user_id).toBe(usuarioData.id);

      // Verificar se existe apenas um usuário no banco
      const usuarios = await Usuario.findAll({
        where: { clerk_user_id: usuarioData.id }
      });
      expect(usuarios).toHaveLength(1);
    });

    it('deve falhar quando dados do usuário estão incompletos - sem id', async () => {
      const usuarioData = {
        email: 'incompleto@teste.com',
        nome: 'Usuário Incompleto'
      };

      const response = await request(app)
        .post('/api/usuarios/sync')
        .send(usuarioData)
        .expect(400);

      expect(response.body.error).toBe('Dados do usuário incompletos.');
    });

    it('deve falhar quando dados do usuário estão incompletos - sem email', async () => {
      const usuarioData = {
        id: 'clerk_sem_email',
        nome: 'Usuário Sem Email'
      };

      const response = await request(app)
        .post('/api/usuarios/sync')
        .send(usuarioData)
        .expect(400);

      expect(response.body.error).toBe('Dados do usuário incompletos.');
    });

    it('deve falhar quando dados do usuário estão incompletos - sem nome', async () => {
      const usuarioData = {
        id: 'clerk_sem_nome',
        email: 'semnome@teste.com'
      };

      const response = await request(app)
        .post('/api/usuarios/sync')
        .send(usuarioData)
        .expect(400);

      expect(response.body.error).toBe('Dados do usuário incompletos.');
    });

    it('deve falhar quando nível de acesso VISTORIADOR não existe', async () => {
      // Deletar o nível de acesso criado no beforeEach
      await NivelAcesso.destroy({ where: { nome: 'VISTORIADOR' } });

      const usuarioData = {
        id: 'clerk_sem_nivel',
        email: 'semnivel@teste.com',
        nome: 'Usuário Sem Nível'
      };

      const response = await request(app)
        .post('/api/usuarios/sync')
        .send(usuarioData)
        .expect(500);

      expect(response.body.error).toBe('Nível de acesso "VISTORIADOR" não encontrado.');
    });

    it('deve atribuir nível de acesso VISTORIADOR por padrão', async () => {
      const usuarioData = {
        id: 'clerk_nivel_padrao',
        email: 'nivelpadrao@teste.com',
        nome: 'Usuário Nível Padrão'
      };

      const response = await request(app)
        .post('/api/usuarios/sync')
        .send(usuarioData)
        .expect(201);

      // Verificar se o usuário foi criado com o nível correto
      const usuario = await Usuario.findOne({
        where: { clerk_user_id: usuarioData.id },
        include: NivelAcesso
      });

      expect(usuario.NivelAcesso.nome).toBe('VISTORIADOR');
    });

    it('deve lidar com dados vazios', async () => {
      const response = await request(app)
        .post('/api/usuarios/sync')
        .send({})
        .expect(400);

      expect(response.body.error).toBe('Dados do usuário incompletos.');
    });

    it('deve lidar com dados nulos', async () => {
      const usuarioData = {
        id: null,
        email: null,
        nome: null
      };

      const response = await request(app)
        .post('/api/usuarios/sync')
        .send(usuarioData)
        .expect(400);

      expect(response.body.error).toBe('Dados do usuário incompletos.');
    });

    it('deve lidar com strings vazias', async () => {
      const usuarioData = {
        id: '',
        email: '',
        nome: ''
      };

      const response = await request(app)
        .post('/api/usuarios/sync')
        .send(usuarioData)
        .expect(400);

      expect(response.body.error).toBe('Dados do usuário incompletos.');
    });
  });

  describe('Validações de dados', () => {
    it('deve aceitar caracteres especiais no nome', async () => {
      const usuarioData = {
        id: 'clerk_especial',
        email: 'especial@teste.com',
        nome: 'João da Silva-Santos'
      };

      const response = await request(app)
        .post('/api/usuarios/sync')
        .send(usuarioData)
        .expect(201);

      expect(response.body.usuario.nome).toBe('João da Silva-Santos');
    });

    it('deve aceitar emails com formato válido', async () => {
      const usuarioData = {
        id: 'clerk_email_valido',
        email: 'usuario.teste+tag@dominio.com.br',
        nome: 'Usuário Email Válido'
      };

      const response = await request(app)
        .post('/api/usuarios/sync')
        .send(usuarioData)
        .expect(201);

      expect(response.body.usuario.email).toBe('usuario.teste+tag@dominio.com.br');
    });

    it('deve aceitar IDs do Clerk com caracteres especiais', async () => {
      const usuarioData = {
        id: 'user_2abc123def456ghi789',
        email: 'clerkid@teste.com',
        nome: 'Usuário Clerk ID'
      };

      const response = await request(app)
        .post('/api/usuarios/sync')
        .send(usuarioData)
        .expect(201);

      expect(response.body.usuario.clerk_user_id).toBe('user_2abc123def456ghi789');
    });
  });

  describe('Cenários de erro', () => {
    it('deve retornar erro 500 em caso de erro interno', async () => {
      // Mock para simular erro interno
      const originalFindOne = NivelAcesso.findOne;
      NivelAcesso.findOne = jest.fn().mockRejectedValue(new Error('Erro de conexão'));

      const usuarioData = {
        id: 'clerk_erro_interno',
        email: 'erro@teste.com',
        nome: 'Usuário Erro'
      };

      const response = await request(app)
        .post('/api/usuarios/sync')
        .send(usuarioData)
        .expect(500);

      expect(response.body.error).toBe('Erro interno do servidor.');

      // Restaurar função original
      NivelAcesso.findOne = originalFindOne;
    });

    it('deve lidar com requisição malformada', async () => {
      const response = await request(app)
        .post('/api/usuarios/sync')
        .send('dados inválidos')
        .expect(400);
    });
  });

  describe('Logs de sincronização', () => {
    it('deve logar criação de novo usuário', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      const usuarioData = {
        id: 'clerk_log_novo',
        email: 'log@teste.com',
        nome: 'Usuário Log'
      };

      await request(app)
        .post('/api/usuarios/sync')
        .send(usuarioData)
        .expect(201);

      expect(consoleSpy).toHaveBeenCalledWith('Novo usuário sincronizado: log@teste.com');

      consoleSpy.mockRestore();
    });

    it('deve logar usuário já existente', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      const usuarioData = {
        id: 'clerk_log_existente',
        email: 'logexistente@teste.com',
        nome: 'Usuário Log Existente'
      };

      // Primeira sincronização
      await request(app)
        .post('/api/usuarios/sync')
        .send(usuarioData)
        .expect(201);

      // Segunda sincronização
      await request(app)
        .post('/api/usuarios/sync')
        .send(usuarioData)
        .expect(200);

      expect(consoleSpy).toHaveBeenCalledWith('Usuário já existente: logexistente@teste.com');

      consoleSpy.mockRestore();
    });
  });
});
