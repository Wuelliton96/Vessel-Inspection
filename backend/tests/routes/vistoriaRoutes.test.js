const request = require('supertest');
const express = require('express');
const bcrypt = require('bcryptjs');
const vistoriaRoutes = require('../../routes/vistoriaRoutes');
const { 
  Usuario, 
  NivelAcesso, 
  Embarcacao, 
  Local, 
  StatusVistoria, 
  Vistoria 
} = require('../../models');

describe('Rotas de Vistoria', () => {
  let app;
  let nivelAdmin, nivelVistoriador, usuarioAdmin, usuarioVistoriador;

  beforeEach(async () => {
    app = express();
    app.use(express.json());
    app.use('/api/vistorias', vistoriaRoutes);

    // Criar níveis de acesso
    nivelAdmin = await NivelAcesso.create({
      nome: 'ADMINISTRADOR',
      descricao: 'Administrador do sistema'
    });

    nivelVistoriador = await NivelAcesso.create({
      nome: 'VISTORIADOR',
      descricao: 'Vistoriador'
    });

    // Criar usuários
    const senhaHash = await bcrypt.hash('Teste@123', 10);
    
    usuarioAdmin = await Usuario.create({
      cpf: '12345678901',
      nome: 'Admin Teste',
      email: 'admin@teste.com',
      senha_hash: senhaHash,
      nivel_acesso_id: nivelAdmin.id
    });

    usuarioVistoriador = await Usuario.create({
      cpf: '12345678902',
      nome: 'Vistoriador Teste',
      email: 'vistoriador@teste.com',
      senha_hash: senhaHash,
      nivel_acesso_id: nivelVistoriador.id
    });

    // Criar status padrão
    await StatusVistoria.create({
      nome: 'PENDENTE',
      descricao: 'Vistoria pendente'
    });
  });

  describe('POST /api/vistorias', () => {
    it('deve criar nova vistoria com dados válidos', async () => {
      const vistoriaData = {
        embarcacao_nome: 'Barco Teste',
        embarcacao_nr_inscricao_barco: 'BT001',
        local_tipo: 'MARINA',
        local_cep: '12345-678',
        vistoriador_id: usuarioVistoriador.id
      };

      const response = await request(app)
        .post('/api/vistorias')
        .send(vistoriaData)
        .expect(201);

      expect(response.body).toBeDefined();
      expect(response.body.embarcacao_id).toBeDefined();
      expect(response.body.local_id).toBeDefined();
      expect(response.body.vistoriador_id).toBe(vistoriaData.vistoriador_id);
      expect(response.body.administrador_id).toBe(usuarioAdmin.id);
      expect(response.body.status_id).toBeDefined();

      // Verificar se a embarcação foi criada
      const embarcacao = await Embarcacao.findOne({
        where: { nr_inscricao_barco: vistoriaData.embarcacao_nr_inscricao_barco }
      });
      expect(embarcacao).toBeDefined();
      expect(embarcacao.nome).toBe(vistoriaData.embarcacao_nome);

      // Verificar se o local foi criado
      const local = await Local.findOne({
        where: { cep: vistoriaData.local_cep }
      });
      expect(local).toBeDefined();
      expect(local.tipo).toBe(vistoriaData.local_tipo);

      // Verificar se a vistoria foi criada
      const vistoria = await Vistoria.findByPk(response.body.id);
      expect(vistoria).toBeDefined();
    });

    it('deve usar embarcação existente quando número do casco já existe', async () => {
      // Criar embarcação existente
      const embarcacaoExistente = await Embarcacao.create({
        nome: 'Barco Existente',
        nr_inscricao_barco: 'EXISTENTE001'
      });

      const vistoriaData = {
        embarcacao_nome: 'Nome Diferente',
        embarcacao_nr_inscricao_barco: 'EXISTENTE001',
        local_tipo: 'MARINA',
        local_cep: '12345-678',
        vistoriador_id: usuarioVistoriador.id
      };

      const response = await request(app)
        .post('/api/vistorias')
        .send(vistoriaData)
        .expect(201);

      // Verificar se usou a embarcação existente
      const vistoria = await Vistoria.findByPk(response.body.id, {
        include: Embarcacao
      });
      expect(vistoria.Embarcacao.id).toBe(embarcacaoExistente.id);
      expect(vistoria.Embarcacao.nome).toBe('Barco Existente'); // Nome original mantido
    });

    it('deve criar novo local para cada vistoria', async () => {
      const vistoriaData1 = {
        embarcacao_nome: 'Barco 1',
        embarcacao_nr_inscricao_barco: 'B001',
        local_tipo: 'MARINA',
        local_cep: '11111-111',
        vistoriador_id: usuarioVistoriador.id
      };

      const vistoriaData2 = {
        embarcacao_nome: 'Barco 2',
        embarcacao_nr_inscricao_barco: 'B002',
        local_tipo: 'RESIDENCIA',
        local_cep: '22222-222',
        vistoriador_id: usuarioVistoriador.id
      };

      await request(app)
        .post('/api/vistorias')
        .send(vistoriaData1)
        .expect(201);

      await request(app)
        .post('/api/vistorias')
        .send(vistoriaData2)
        .expect(201);

      // Verificar se foram criados dois locais diferentes
      const locais = await Local.findAll();
      expect(locais).toHaveLength(2);
      expect(locais[0].cep).toBe('11111-111');
      expect(locais[1].cep).toBe('22222-222');
    });

    it('deve definir status como PENDENTE por padrão', async () => {
      const vistoriaData = {
        embarcacao_nome: 'Barco Status',
        embarcacao_nr_inscricao_barco: 'STATUS001',
        local_tipo: 'MARINA',
        local_cep: '12345-678',
        vistoriador_id: usuarioVistoriador.id
      };

      const response = await request(app)
        .post('/api/vistorias')
        .send(vistoriaData)
        .expect(201);

      const vistoria = await Vistoria.findByPk(response.body.id, {
        include: StatusVistoria
      });
      expect(vistoria.StatusVistoria.nome).toBe('PENDENTE');
    });

    it('deve definir administrador_id como usuário logado', async () => {
      const vistoriaData = {
        embarcacao_nome: 'Barco Admin',
        embarcacao_nr_inscricao_barco: 'ADMIN001',
        local_tipo: 'MARINA',
        local_cep: '12345-678',
        vistoriador_id: usuarioVistoriador.id
      };

      const response = await request(app)
        .post('/api/vistorias')
        .send(vistoriaData)
        .expect(201);

      const vistoria = await Vistoria.findByPk(response.body.id, {
        include: {
          model: Usuario,
          as: 'administrador'
        }
      });
      expect(vistoria.administrador.id).toBe(usuarioAdmin.id);
      expect(vistoria.administrador.nome).toBe('Admin Teste');
    });

    it('deve falhar quando vistoriador_id não existe', async () => {
      const vistoriaData = {
        embarcacao_nome: 'Barco Erro',
        embarcacao_nr_inscricao_barco: 'ERRO001',
        local_tipo: 'MARINA',
        local_cep: '12345-678',
        vistoriador_id: 99999 // ID inexistente
      };

      const response = await request(app)
        .post('/api/vistorias')
        .send(vistoriaData)
        .expect(500);

      expect(response.body.error).toBe('Erro interno do servidor.');
    });

    it('deve falhar quando status PENDENTE não existe', async () => {
      // Deletar status PENDENTE
      await StatusVistoria.destroy({ where: { nome: 'PENDENTE' } });

      const vistoriaData = {
        embarcacao_nome: 'Barco Sem Status',
        embarcacao_nr_inscricao_barco: 'SEMSTATUS001',
        local_tipo: 'MARINA',
        local_cep: '12345-678',
        vistoriador_id: usuarioVistoriador.id
      };

      const response = await request(app)
        .post('/api/vistorias')
        .send(vistoriaData)
        .expect(500);

      expect(response.body.error).toBe('Erro interno do servidor.');
    });
  });

  describe('Validações de dados', () => {
    it('deve aceitar local_tipo MARINA', async () => {
      const vistoriaData = {
        embarcacao_nome: 'Barco Marina',
        embarcacao_nr_inscricao_barco: 'MARINA001',
        local_tipo: 'MARINA',
        local_cep: '12345-678',
        vistoriador_id: usuarioVistoriador.id
      };

      const response = await request(app)
        .post('/api/vistorias')
        .send(vistoriaData)
        .expect(201);

      const vistoria = await Vistoria.findByPk(response.body.id, {
        include: Local
      });
      expect(vistoria.Local.tipo).toBe('MARINA');
    });

    it('deve aceitar local_tipo RESIDENCIA', async () => {
      const vistoriaData = {
        embarcacao_nome: 'Barco Residência',
        embarcacao_nr_inscricao_barco: 'RESID001',
        local_tipo: 'RESIDENCIA',
        local_cep: '12345-678',
        vistoriador_id: usuarioVistoriador.id
      };

      const response = await request(app)
        .post('/api/vistorias')
        .send(vistoriaData)
        .expect(201);

      const vistoria = await Vistoria.findByPk(response.body.id, {
        include: Local
      });
      expect(vistoria.Local.tipo).toBe('RESIDENCIA');
    });

    it('deve aceitar CEPs em diferentes formatos', async () => {
      const ceps = ['12345-678', '12345678', '12345 678'];

      for (const cep of ceps) {
        const vistoriaData = {
          embarcacao_nome: `Barco CEP ${cep}`,
          embarcacao_nr_inscricao_barco: `CEP${cep.replace(/\D/g, '')}`,
          local_tipo: 'MARINA',
          local_cep: cep,
          vistoriador_id: usuarioVistoriador.id
        };

        const response = await request(app)
          .post('/api/vistorias')
          .send(vistoriaData)
          .expect(201);

        const vistoria = await Vistoria.findByPk(response.body.id, {
          include: Local
        });
        expect(vistoria.Local.cep).toBe(cep);
      }
    });
  });

  describe('Cenários de erro', () => {
    it('deve retornar erro 500 em caso de erro interno', async () => {
      // Mock para simular erro interno
      const originalCreate = Local.create;
      Local.create = jest.fn().mockRejectedValue(new Error('Erro de conexão'));

      const vistoriaData = {
        embarcacao_nome: 'Barco Erro',
        embarcacao_nr_inscricao_barco: 'ERRO001',
        local_tipo: 'MARINA',
        local_cep: '12345-678',
        vistoriador_id: usuarioVistoriador.id
      };

      const response = await request(app)
        .post('/api/vistorias')
        .send(vistoriaData)
        .expect(500);

      expect(response.body.error).toBe('Erro interno do servidor.');

      // Restaurar função original
      Local.create = originalCreate;
    });

    it('deve lidar com requisição malformada', async () => {
      const response = await request(app)
        .post('/api/vistorias')
        .send('dados inválidos')
        .expect(400);
    });
  });

  describe('Logs de criação', () => {
    it('deve logar erro ao criar vistoria', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      // Mock para simular erro
      const originalCreate = Vistoria.create;
      Vistoria.create = jest.fn().mockRejectedValue(new Error('Erro de banco'));

      const vistoriaData = {
        embarcacao_nome: 'Barco Log',
        embarcacao_nr_inscricao_barco: 'LOG001',
        local_tipo: 'MARINA',
        local_cep: '12345-678',
        vistoriador_id: usuarioVistoriador.id
      };

      await request(app)
        .post('/api/vistorias')
        .send(vistoriaData)
        .expect(500);

      expect(consoleSpy).toHaveBeenCalledWith('Erro ao criar vistoria:', expect.any(Error));

      // Restaurar
      Vistoria.create = originalCreate;
      consoleSpy.mockRestore();
    });
  });

  describe('Integração com banco de dados', () => {
    it('deve criar todas as entidades relacionadas corretamente', async () => {
      const vistoriaData = {
        embarcacao_nome: 'Barco Integração',
        embarcacao_nr_inscricao_barco: 'INT001',
        local_tipo: 'MARINA',
        local_cep: '12345-678',
        vistoriador_id: usuarioVistoriador.id
      };

      const response = await request(app)
        .post('/api/vistorias')
        .send(vistoriaData)
        .expect(201);

      // Verificar vistoria com todas as associações
      const vistoria = await Vistoria.findByPk(response.body.id, {
        include: [
          {
            model: Embarcacao,
            attributes: ['nome', 'nr_inscricao_barco']
          },
          {
            model: Local,
            attributes: ['tipo', 'cep']
          },
          {
            model: Usuario,
            as: 'vistoriador',
            attributes: ['nome', 'email']
          },
          {
            model: Usuario,
            as: 'administrador',
            attributes: ['nome', 'email']
          },
          {
            model: StatusVistoria,
            attributes: ['nome', 'descricao']
          }
        ]
      });

      expect(vistoria).toBeDefined();
      expect(vistoria.Embarcacao.nome).toBe('Barco Integração');
      expect(vistoria.Embarcacao.nr_inscricao_barco).toBe('INT001');
      expect(vistoria.Local.tipo).toBe('MARINA');
      expect(vistoria.Local.cep).toBe('12345-678');
      expect(vistoria.vistoriador.nome).toBe('Vistoriador Teste');
      expect(vistoria.administrador.nome).toBe('Admin Teste');
      expect(vistoria.StatusVistoria.nome).toBe('PENDENTE');
    });
  });
});
