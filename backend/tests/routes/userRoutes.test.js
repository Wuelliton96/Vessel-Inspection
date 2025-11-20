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

  // Testes da rota /sync foram removidos pois o Clerk foi removido do sistema
  // TODO: Adicionar testes para outras rotas de usuário
});
