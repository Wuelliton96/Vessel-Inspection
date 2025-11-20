const request = require('supertest');
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { sequelize, Cliente, Usuario, NivelAcesso } = require('../../models');
const clienteRoutes = require('../../routes/clienteRoutes');

const app = express();
app.use(express.json());
app.use('/api/clientes', clienteRoutes);

describe('Rotas de Clientes', () => {
  let vistoriadorToken;

  beforeAll(async () => {
    await sequelize.sync({ force: true });
    await NivelAcesso.create({ id: 2, nome: 'VISTORIADOR', descricao: 'Vistoriador' });
    const senhaHash = await bcrypt.hash('Teste@123', 10);
    const vistoriador = await Usuario.create({
      cpf: '12345678905',
      nome: 'Vistoriador', 
      email: 'vist@cliente.test', 
      senha_hash: senhaHash, 
      nivel_acesso_id: 2
    });
    vistoriadorToken = jwt.sign({ 
      userId: vistoriador.id, 
      cpf: vistoriador.cpf,
      nivelAcessoId: 2 
    }, process.env.JWT_SECRET || 'sua-chave-secreta-jwt');
  });

  afterAll(async () => {
    await sequelize.close();
  });

  describe('GET /api/clientes', () => {
    it('deve listar todos os clientes', async () => {
      await Cliente.create({ tipo_pessoa: 'FISICA', nome: 'João Silva', cpf: '12345678900' });
      
      const response = await request(app)
        .get('/api/clientes')
        .set('Authorization', `Bearer ${vistoriadorToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });

    it('deve filtrar por CPF', async () => {
      await Cliente.create({ tipo_pessoa: 'FISICA', nome: 'Maria', cpf: '98765432100' });
      
      const response = await request(app)
        .get('/api/clientes?cpf=98765432100')
        .set('Authorization', `Bearer ${vistoriadorToken}`);

      expect(response.status).toBe(200);
    });
  });

  describe('POST /api/clientes', () => {
    it('deve criar cliente pessoa física', async () => {
      const response = await request(app)
        .post('/api/clientes')
        .set('Authorization', `Bearer ${vistoriadorToken}`)
        .send({
          tipo_pessoa: 'FISICA',
          nome: 'Pedro Santos',
          cpf: '11122233344',
          email: 'pedro@test.com'
        });

      expect(response.status).toBe(201);
      expect(response.body.nome).toBe('Pedro Santos');
    });

    it('deve criar cliente pessoa jurídica', async () => {
      const response = await request(app)
        .post('/api/clientes')
        .set('Authorization', `Bearer ${vistoriadorToken}`)
        .send({
          tipo_pessoa: 'JURIDICA',
          nome: 'Empresa LTDA',
          cnpj: '12345678000199'
        });

      expect(response.status).toBe(201);
    });

    it('deve retornar 400 sem nome', async () => {
      const response = await request(app)
        .post('/api/clientes')
        .set('Authorization', `Bearer ${vistoriadorToken}`)
        .send({ tipo_pessoa: 'FISICA' });

      expect(response.status).toBe(400);
    });

    it('deve retornar 400 PF sem CPF', async () => {
      const response = await request(app)
        .post('/api/clientes')
        .set('Authorization', `Bearer ${vistoriadorToken}`)
        .send({
          tipo_pessoa: 'FISICA',
          nome: 'Sem CPF'
        });

      expect(response.status).toBe(400);
    });

    it('deve retornar 400 PJ sem CNPJ', async () => {
      const response = await request(app)
        .post('/api/clientes')
        .set('Authorization', `Bearer ${vistoriadorToken}`)
        .send({
          tipo_pessoa: 'JURIDICA',
          nome: 'Sem CNPJ'
        });

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/clientes/buscar/:documento', () => {
    it('deve buscar por CPF', async () => {
      await Cliente.create({ tipo_pessoa: 'FISICA', nome: 'Buscar CPF', cpf: '55566677788' });
      
      const response = await request(app)
        .get('/api/clientes/buscar/55566677788')
        .set('Authorization', `Bearer ${vistoriadorToken}`);

      expect(response.status).toBe(200);
      expect(response.body.nome).toBe('Buscar CPF');
    });

    it('deve buscar por CNPJ', async () => {
      await Cliente.create({ tipo_pessoa: 'JURIDICA', nome: 'Buscar CNPJ', cnpj: '99988877766655' });
      
      const response = await request(app)
        .get('/api/clientes/buscar/99988877766655')
        .set('Authorization', `Bearer ${vistoriadorToken}`);

      expect(response.status).toBe(200);
    });

    it('deve retornar 404 se não encontrar', async () => {
      const response = await request(app)
        .get('/api/clientes/buscar/00000000000')
        .set('Authorization', `Bearer ${vistoriadorToken}`);

      expect(response.status).toBe(404);
    });
  });

  describe('PUT /api/clientes/:id', () => {
    it('deve atualizar cliente', async () => {
      const cliente = await Cliente.create({ tipo_pessoa: 'FISICA', nome: 'Original', cpf: '11111111111' });
      
      const response = await request(app)
        .put(`/api/clientes/${cliente.id}`)
        .set('Authorization', `Bearer ${vistoriadorToken}`)
        .send({ nome: 'Atualizado', email: 'novo@email.com' });

      expect(response.status).toBe(200);
      expect(response.body.nome).toBe('Atualizado');
    });
  });

  describe('DELETE /api/clientes/:id', () => {
    it('deve deletar cliente sem embarcações', async () => {
      const cliente = await Cliente.create({ tipo_pessoa: 'FISICA', nome: 'Deletar', cpf: '22222222222' });
      
      const response = await request(app)
        .delete(`/api/clientes/${cliente.id}`)
        .set('Authorization', `Bearer ${vistoriadorToken}`);

      expect(response.status).toBe(200);
    });
  });

  describe('PATCH /api/clientes/:id/toggle-status', () => {
    it('deve alternar status do cliente', async () => {
      const cliente = await Cliente.create({ tipo_pessoa: 'FISICA', nome: 'Toggle', cpf: '33333333333', ativo: true });
      
      const response = await request(app)
        .patch(`/api/clientes/${cliente.id}/toggle-status`)
        .set('Authorization', `Bearer ${vistoriadorToken}`);

      expect(response.status).toBe(200);
      expect(response.body.ativo).toBe(false);
    });
  });
});

