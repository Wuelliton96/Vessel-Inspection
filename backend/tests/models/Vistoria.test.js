const { 
  Vistoria, 
  Usuario, 
  Embarcacao, 
  Local, 
  StatusVistoria, 
  NivelAcesso 
} = require('../../models');

describe('Modelo Vistoria', () => {
  let vistoriador, administrador, embarcacao, local, statusPendente;

  beforeEach(async () => {
    // Criar nível de acesso
    const nivelVistoriador = await NivelAcesso.create({
      nome: 'VISTORIADOR',
      descricao: 'Nível para vistoriadores'
    });

    const nivelAdmin = await NivelAcesso.create({
      nome: 'ADMINISTRADOR',
      descricao: 'Nível para administradores'
    });

    // Criar usuários
    vistoriador = await Usuario.create({
      clerk_user_id: 'clerk_vistoriador',
      nome: 'Vistoriador Teste',
      email: 'vistoriador@teste.com',
      nivel_acesso_id: nivelVistoriador.id
    });

    administrador = await Usuario.create({
      clerk_user_id: 'clerk_admin',
      nome: 'Admin Teste',
      email: 'admin@teste.com',
      nivel_acesso_id: nivelAdmin.id
    });

    // Criar embarcação
    embarcacao = await Embarcacao.create({
      nome: 'Barco Vistoria',
      nr_inscricao_barco: 'VIST001'
    });

    // Criar local
    local = await Local.create({
      tipo: 'MARINA',
      nome_local: 'Marina Teste',
      cep: '12345-678'
    });

    // Criar status
    statusPendente = await StatusVistoria.create({
      nome: 'PENDENTE',
      descricao: 'Vistoria pendente'
    });
  });

  describe('Criação de vistoria', () => {
    it('deve criar uma vistoria com dados válidos', async () => {
      const vistoriaData = {
        embarcacao_id: embarcacao.id,
        local_id: local.id,
        vistoriador_id: vistoriador.id,
        administrador_id: administrador.id,
        status_id: statusPendente.id,
        dados_rascunho: { campo1: 'valor1', campo2: 'valor2' }
      };

      const vistoria = await Vistoria.create(vistoriaData);

      expect(vistoria).toBeDefined();
      expect(vistoria.embarcacao_id).toBe(vistoriaData.embarcacao_id);
      expect(vistoria.local_id).toBe(vistoriaData.local_id);
      expect(vistoria.vistoriador_id).toBe(vistoriaData.vistoriador_id);
      expect(vistoria.administrador_id).toBe(vistoriaData.administrador_id);
      expect(vistoria.status_id).toBe(vistoriaData.status_id);
      expect(vistoria.dados_rascunho).toEqual(vistoriaData.dados_rascunho);
    });

    it('deve criar vistoria sem dados_rascunho', async () => {
      const vistoriaData = {
        embarcacao_id: embarcacao.id,
        local_id: local.id,
        vistoriador_id: vistoriador.id,
        administrador_id: administrador.id,
        status_id: statusPendente.id
      };

      const vistoria = await Vistoria.create(vistoriaData);

      expect(vistoria).toBeDefined();
      expect(vistoria.dados_rascunho).toBeNull();
    });

    it('deve criar vistoria com data de conclusão', async () => {
      const dataConclusao = new Date();
      const vistoriaData = {
        embarcacao_id: embarcacao.id,
        local_id: local.id,
        vistoriador_id: vistoriador.id,
        administrador_id: administrador.id,
        status_id: statusPendente.id,
        data_conclusao: dataConclusao
      };

      const vistoria = await Vistoria.create(vistoriaData);

      expect(vistoria).toBeDefined();
      expect(vistoria.data_conclusao).toEqual(dataConclusao);
    });

    it('deve criar vistoria com data de aprovação', async () => {
      const dataAprovacao = new Date();
      const vistoriaData = {
        embarcacao_id: embarcacao.id,
        local_id: local.id,
        vistoriador_id: vistoriador.id,
        administrador_id: administrador.id,
        status_id: statusPendente.id,
        data_aprovacao: dataAprovacao
      };

      const vistoria = await Vistoria.create(vistoriaData);

      expect(vistoria).toBeDefined();
      expect(vistoria.data_aprovacao).toEqual(dataAprovacao);
    });
  });

  describe('Associações', () => {
    let vistoria;

    beforeEach(async () => {
      vistoria = await Vistoria.create({
        embarcacao_id: embarcacao.id,
        local_id: local.id,
        vistoriador_id: vistoriador.id,
        administrador_id: administrador.id,
        status_id: statusPendente.id
      });
    });

    it('deve incluir embarcação ao buscar vistoria', async () => {
      const vistoriaComEmbarcacao = await Vistoria.findByPk(vistoria.id, {
        include: Embarcacao
      });

      expect(vistoriaComEmbarcacao).toBeDefined();
      expect(vistoriaComEmbarcacao.Embarcacao).toBeDefined();
      expect(vistoriaComEmbarcacao.Embarcacao.nome).toBe('Barco Vistoria');
    });

    it('deve incluir local ao buscar vistoria', async () => {
      const vistoriaComLocal = await Vistoria.findByPk(vistoria.id, {
        include: Local
      });

      expect(vistoriaComLocal).toBeDefined();
      expect(vistoriaComLocal.Local).toBeDefined();
      expect(vistoriaComLocal.Local.tipo).toBe('MARINA');
    });

    it('deve incluir vistoriador ao buscar vistoria', async () => {
      const vistoriaComVistoriador = await Vistoria.findByPk(vistoria.id, {
        include: {
          model: Usuario,
          as: 'vistoriador'
        }
      });

      expect(vistoriaComVistoriador).toBeDefined();
      expect(vistoriaComVistoriador.vistoriador).toBeDefined();
      expect(vistoriaComVistoriador.vistoriador.nome).toBe('Vistoriador Teste');
    });

    it('deve incluir administrador ao buscar vistoria', async () => {
      const vistoriaComAdmin = await Vistoria.findByPk(vistoria.id, {
        include: {
          model: Usuario,
          as: 'administrador'
        }
      });

      expect(vistoriaComAdmin).toBeDefined();
      expect(vistoriaComAdmin.administrador).toBeDefined();
      expect(vistoriaComAdmin.administrador.nome).toBe('Admin Teste');
    });

    it('deve incluir status ao buscar vistoria', async () => {
      const vistoriaComStatus = await Vistoria.findByPk(vistoria.id, {
        include: StatusVistoria
      });

      expect(vistoriaComStatus).toBeDefined();
      expect(vistoriaComStatus.StatusVistoria).toBeDefined();
      expect(vistoriaComStatus.StatusVistoria.nome).toBe('PENDENTE');
    });
  });

  describe('Operações CRUD', () => {
    let vistoria;

    beforeEach(async () => {
      vistoria = await Vistoria.create({
        embarcacao_id: embarcacao.id,
        local_id: local.id,
        vistoriador_id: vistoriador.id,
        administrador_id: administrador.id,
        status_id: statusPendente.id,
        dados_rascunho: { teste: 'inicial' }
      });
    });

    it('deve buscar vistoria por ID', async () => {
      const vistoriaEncontrada = await Vistoria.findByPk(vistoria.id);
      expect(vistoriaEncontrada).toBeDefined();
      expect(vistoriaEncontrada.id).toBe(vistoria.id);
    });

    it('deve atualizar dados_rascunho da vistoria', async () => {
      const novosDados = { teste: 'atualizado', novo_campo: 'valor' };
      await vistoria.update({ dados_rascunho: novosDados });
      
      const vistoriaAtualizada = await Vistoria.findByPk(vistoria.id);
      expect(vistoriaAtualizada.dados_rascunho).toEqual(novosDados);
    });

    it('deve atualizar data de conclusão', async () => {
      const dataConclusao = new Date();
      await vistoria.update({ data_conclusao: dataConclusao });
      
      const vistoriaAtualizada = await Vistoria.findByPk(vistoria.id);
      expect(vistoriaAtualizada.data_conclusao).toEqual(dataConclusao);
    });

    it('deve atualizar data de aprovação', async () => {
      const dataAprovacao = new Date();
      await vistoria.update({ data_aprovacao: dataAprovacao });
      
      const vistoriaAtualizada = await Vistoria.findByPk(vistoria.id);
      expect(vistoriaAtualizada.data_aprovacao).toEqual(dataAprovacao);
    });

    it('deve deletar vistoria', async () => {
      await vistoria.destroy();
      
      const vistoriaDeletada = await Vistoria.findByPk(vistoria.id);
      expect(vistoriaDeletada).toBeNull();
    });
  });

  describe('Consultas complexas', () => {
    beforeEach(async () => {
      // Criar múltiplas vistorias para testes
      await Vistoria.create({
        embarcacao_id: embarcacao.id,
        local_id: local.id,
        vistoriador_id: vistoriador.id,
        administrador_id: administrador.id,
        status_id: statusPendente.id,
        dados_rascunho: { tipo: 'completa' }
      });

      await Vistoria.create({
        embarcacao_id: embarcacao.id,
        local_id: local.id,
        vistoriador_id: vistoriador.id,
        administrador_id: administrador.id,
        status_id: statusPendente.id,
        dados_rascunho: { tipo: 'simples' }
      });
    });

    it('deve buscar vistorias por vistoriador', async () => {
      const vistorias = await Vistoria.findAll({
        where: { vistoriador_id: vistoriador.id }
      });

      expect(vistorias).toHaveLength(2);
      vistorias.forEach(vistoria => {
        expect(vistoria.vistoriador_id).toBe(vistoriador.id);
      });
    });

    it('deve buscar vistorias por administrador', async () => {
      const vistorias = await Vistoria.findAll({
        where: { administrador_id: administrador.id }
      });

      expect(vistorias).toHaveLength(2);
      vistorias.forEach(vistoria => {
        expect(vistoria.administrador_id).toBe(administrador.id);
      });
    });

    it('deve buscar vistorias por embarcação', async () => {
      const vistorias = await Vistoria.findAll({
        where: { embarcacao_id: embarcacao.id }
      });

      expect(vistorias).toHaveLength(2);
      vistorias.forEach(vistoria => {
        expect(vistoria.embarcacao_id).toBe(embarcacao.id);
      });
    });
  });
});
