const request = require('supertest');
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { sequelize, ChecklistTemplate, ChecklistTemplateItem, VistoriaChecklistItem, Vistoria, Usuario, NivelAcesso, Embarcacao, Local, StatusVistoria } = require('../../models');
const checklistRoutes = require('../../routes/checklistRoutes');

const app = express();
app.use(express.json());
app.use('/api/checklists', checklistRoutes);

describe('Rotas de Checklist', () => {
  let adminToken, vistoriadorToken;
  let admin, vistoriador;
  let template, templateItem;

  beforeAll(async () => {
    await sequelize.sync({ force: true });

    await NivelAcesso.create({ id: 1, nome: 'ADMINISTRADOR', descricao: 'Admin' });
    await NivelAcesso.create({ id: 2, nome: 'VISTORIADOR', descricao: 'Vistoriador' });

    const senhaHash = await bcrypt.hash('Teste@123', 10);
    
    admin = await Usuario.create({
      cpf: '12345678909',
      nome: 'Admin',
      email: 'admin@checklist.test',
      senha_hash: senhaHash,
      nivel_acesso_id: 1
    });

    vistoriador = await Usuario.create({
      cpf: '12345678910',
      nome: 'Vistoriador',
      email: 'vist@checklist.test',
      senha_hash: senhaHash,
      nivel_acesso_id: 2
    });

    adminToken = jwt.sign(
      { userId: admin.id, cpf: admin.cpf, nivelAcessoId: 1 },
      process.env.JWT_SECRET || 'sua-chave-secreta-jwt'
    );

    vistoriadorToken = jwt.sign(
      { userId: vistoriador.id, cpf: vistoriador.cpf, nivelAcessoId: 2 },
      process.env.JWT_SECRET || 'sua-chave-secreta-jwt'
    );

    template = await ChecklistTemplate.create({
      tipo_embarcacao: 'JET_SKI',
      nome: 'Checklist Jet Ski',
      descricao: 'Checklist para vistoria de Jet Ski',
      ativo: true
    });

    templateItem = await ChecklistTemplateItem.create({
      checklist_template_id: template.id,
      ordem: 1,
      nome: 'Casco',
      descricao: 'Verificar estado do casco',
      obrigatorio: true,
      permite_video: false,
      ativo: true
    });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  describe('GET /api/checklists/templates', () => {
    it('deve listar templates (vistoriador)', async () => {
      const response = await request(app)
        .get('/api/checklists/templates')
        .set('Authorization', `Bearer ${vistoriadorToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });

    it('deve retornar 401 sem autenticação', async () => {
      const response = await request(app).get('/api/checklists/templates');
      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/checklists/templates/:tipo_embarcacao', () => {
    it('deve buscar template por tipo de embarcação', async () => {
      const response = await request(app)
        .get('/api/checklists/templates/JET_SKI')
        .set('Authorization', `Bearer ${vistoriadorToken}`);

      expect(response.status).toBe(200);
      expect(response.body.tipo_embarcacao).toBe('JET_SKI');
    });

    it('deve retornar 404 para tipo inexistente', async () => {
      const response = await request(app)
        .get('/api/checklists/templates/TIPO_INEXISTENTE')
        .set('Authorization', `Bearer ${vistoriadorToken}`);

      expect(response.status).toBe(404);
    });
  });

  describe('GET /api/checklists/vistoria/:vistoria_id', () => {
    it('deve buscar checklist de uma vistoria', async () => {
      const status = await StatusVistoria.create({ nome: 'EM_ANDAMENTO', descricao: 'Em andamento' });
      const embarcacao = await Embarcacao.create({ nome: 'Barco Test', nr_inscricao_barco: 'TEST001' });
      const local = await Local.create({ tipo: 'MARINA', nome_local: 'Marina Test' });
      
      const vistoria = await Vistoria.create({
        embarcacao_id: embarcacao.id,
        local_id: local.id,
        vistoriador_id: vistoriador.id,
        administrador_id: admin.id,
        status_id: status.id
      });

      const response = await request(app)
        .get(`/api/checklists/vistoria/${vistoria.id}`)
        .set('Authorization', `Bearer ${vistoriadorToken}`);

      expect(response.status).toBe(200);
    });

    it('deve retornar 404 para vistoria inexistente', async () => {
      const response = await request(app)
        .get('/api/checklists/vistoria/99999')
        .set('Authorization', `Bearer ${vistoriadorToken}`);

      expect(response.status).toBe(404);
    });
  });
});

