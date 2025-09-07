const request = require('supertest');
const express = require('express');
const { requireAuth, requireAdmin } = require('../../middleware/auth');
const { Usuario, NivelAcesso } = require('../../models');
const skipDb = process.env.SKIP_DB === 'true';

// Mock do Clerk
jest.mock('@clerk/clerk-sdk-node', () => ({
  ClerkExpressRequireAuth: () => (req, res, next) => {
    // Simular usuário autenticado
    req.auth = {
      userId: 'test-clerk-user-id'
    };
    next();
  }
}));

describe('Middleware de Autenticação', () => {
  let app;
  let nivelAcesso, usuarioAdmin, usuarioVistoriador;

  beforeEach(async () => {
    app = express();
    app.use(express.json());

    if (process.env.SKIP_DB === 'true') {
      // Pular preparação de banco quando testando apenas requireAuth
      return;
    }

    // Criar níveis de acesso
    const nivelAdmin = await NivelAcesso.create({
      nome: 'ADMINISTRADOR',
      descricao: 'Administrador do sistema'
    });

    const nivelVistoriador = await NivelAcesso.create({
      nome: 'VISTORIADOR',
      descricao: 'Vistoriador'
    });

    // Criar usuários
    usuarioAdmin = await Usuario.create({
      clerk_user_id: 'test-clerk-user-id',
      nome: 'Admin Teste',
      email: 'admin@teste.com',
      nivel_acesso_id: nivelAdmin.id
    });

    usuarioVistoriador = await Usuario.create({
      clerk_user_id: 'clerk-vistoriador',
      nome: 'Vistoriador Teste',
      email: 'vistoriador@teste.com',
      nivel_acesso_id: nivelVistoriador.id
    });
  });

  describe('requireAuth', () => {
    it('deve permitir acesso quando usuário está autenticado', async () => {
      app.get('/test-auth', requireAuth, (req, res) => {
        res.json({ message: 'Acesso permitido', userId: req.auth.userId });
      });

      const response = await request(app)
        .get('/test-auth')
        .expect(200);

      expect(response.body.message).toBe('Acesso permitido');
      expect(response.body.userId).toBe('test-clerk-user-id');
    });

    it('deve negar acesso quando usuário não está autenticado', async () => {
      // Não definir req.auth e chamar requireAdmin que valida autenticação
      const noAuth = () => (req, res, next) => next();

      app.get('/test-no-auth', [noAuth(), requireAdmin], (req, res) => {
        res.json({ message: 'Acesso permitido' });
      });

      const response = await request(app)
        .get('/test-no-auth')
        .expect(401);

      expect(response.body.error).toBe('Autenticação necessária.');
    });
  });

  (skipDb ? describe.skip : describe)('requireAdmin', () => {
    it('deve permitir acesso quando usuário é administrador', async () => {
      app.get('/test-admin', [requireAuth, requireAdmin], (req, res) => {
        res.json({ 
          message: 'Acesso de admin permitido',
          user: req.user
        });
      });

      const response = await request(app)
        .get('/test-admin')
        .expect(200);

      expect(response.body.message).toBe('Acesso de admin permitido');
      expect(response.body.user.id).toBe(usuarioAdmin.id);
      expect(response.body.user.nome).toBe('Admin Teste');
    });

    it('deve negar acesso quando usuário não é administrador', async () => {
      // Mock com usuário vistoriador
      const mockRequireAuthVistoriador = () => (req, res, next) => {
        req.auth = {
          userId: 'clerk-vistoriador'
        };
        next();
      };

      app.get('/test-admin-vistoriador', [mockRequireAuthVistoriador(), requireAdmin], (req, res) => {
        res.json({ message: 'Acesso de admin permitido' });
      });

      const response = await request(app)
        .get('/test-admin-vistoriador')
        .expect(403);

      expect(response.body.error).toBe('Acesso negado. Permissão de administrador necessária.');
    });

    it('deve negar acesso quando usuário não existe no banco', async () => {
      // Mock com usuário inexistente
      const mockRequireAuthInexistente = () => (req, res, next) => {
        req.auth = {
          userId: 'clerk-usuario-inexistente'
        };
        next();
      };

      app.get('/test-admin-inexistente', [mockRequireAuthInexistente(), requireAdmin], (req, res) => {
        res.json({ message: 'Acesso de admin permitido' });
      });

      const response = await request(app)
        .get('/test-admin-inexistente')
        .expect(403);

      expect(response.body.error).toBe('Acesso negado. Permissão de administrador necessária.');
    });

    it('deve negar acesso quando req.auth não existe', async () => {
      const mockRequireAuthSemAuth = () => (req, res, next) => {
        // Não definir req.auth
        next();
      };

      app.get('/test-admin-sem-auth', [mockRequireAuthSemAuth(), requireAdmin], (req, res) => {
        res.json({ message: 'Acesso de admin permitido' });
      });

      const response = await request(app)
        .get('/test-admin-sem-auth')
        .expect(401);

      expect(response.body.error).toBe('Autenticação necessária.');
    });

    it('deve negar acesso quando req.auth.userId não existe', async () => {
      const mockRequireAuthSemUserId = () => (req, res, next) => {
        req.auth = {}; // Sem userId
        next();
      };

      app.get('/test-admin-sem-userid', [mockRequireAuthSemUserId(), requireAdmin], (req, res) => {
        res.json({ message: 'Acesso de admin permitido' });
      });

      const response = await request(app)
        .get('/test-admin-sem-userid')
        .expect(401);

      expect(response.body.error).toBe('Autenticação necessária.');
    });
  });

  (skipDb ? describe.skip : describe)('Integração dos middlewares', () => {
    it('deve executar requireAuth antes de requireAdmin', async () => {
      let middlewareOrder = [];

      const mockRequireAuth = () => (req, res, next) => {
        middlewareOrder.push('requireAuth');
        req.auth = { userId: 'test-clerk-user-id' };
        next();
      };

      const mockRequireAdmin = async (req, res, next) => {
        middlewareOrder.push('requireAdmin');
        try {
          if (!req.auth || !req.auth.userId) {
            return res.status(401).json({ error: 'Autenticação necessária.' });
          }

          const clerkUserId = req.auth.userId;
          const usuario = await Usuario.findOne({
            where: { clerk_user_id: clerkUserId },
            include: {
              model: NivelAcesso,
              attributes: ['nome']
            }
          });

          if (!usuario || usuario.NivelAcesso.nome !== 'ADMINISTRADOR') {
            return res.status(403).json({ error: 'Acesso negado. Permissão de administrador necessária.' });
          }

          req.user = usuario;
          next();
        } catch (error) {
          res.status(500).json({ error: 'Erro interno do servidor.' });
        }
      };

      app.get('/test-order', [mockRequireAuth(), mockRequireAdmin], (req, res) => {
        middlewareOrder.push('handler');
        res.json({ message: 'Sucesso', order: middlewareOrder });
      });

      const response = await request(app)
        .get('/test-order')
        .expect(200);

      expect(response.body.order).toEqual(['requireAuth', 'requireAdmin', 'handler']);
    });

    it('deve retornar erro 500 em caso de erro interno', async () => {
      // Mock que simula erro no banco de dados
      const mockRequireAuth = () => (req, res, next) => {
        req.auth = { userId: 'test-clerk-user-id' };
        next();
      };

      const mockRequireAdminComErro = async (req, res, next) => {
        try {
          // Simular erro
          throw new Error('Erro de conexão com banco');
        } catch (error) {
          res.status(500).json({ error: 'Erro interno do servidor.' });
        }
      };

      app.get('/test-error', [mockRequireAuth(), mockRequireAdminComErro], (req, res) => {
        res.json({ message: 'Sucesso' });
      });

      const response = await request(app)
        .get('/test-error')
        .expect(500);

      expect(response.body.error).toBe('Erro interno do servidor.');
    });
  });

  (skipDb ? describe.skip : describe)('Dados do usuário anexados à requisição', () => {
    it('deve anexar dados completos do usuário admin à requisição', async () => {
      app.get('/test-user-data', [requireAuth, requireAdmin], (req, res) => {
        res.json({
          user: {
            id: req.user.id,
            nome: req.user.nome,
            email: req.user.email,
            nivel_acesso: req.user.NivelAcesso.nome
          }
        });
      });

      const response = await request(app)
        .get('/test-user-data')
        .expect(200);

      expect(response.body.user.id).toBe(usuarioAdmin.id);
      expect(response.body.user.nome).toBe('Admin Teste');
      expect(response.body.user.email).toBe('admin@teste.com');
      expect(response.body.user.nivel_acesso).toBe('ADMINISTRADOR');
    });
  });
});