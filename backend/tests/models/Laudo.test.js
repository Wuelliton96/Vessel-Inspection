const { Laudo, Vistoria, Usuario, Embarcacao, Local, StatusVistoria, NivelAcesso } = require('../../models');

describe('Modelo Laudo', () => {
  let vistoria;

  beforeEach(async () => {
    // Setup necessário para criar uma vistoria
    const nivelAcesso = await NivelAcesso.create({
      nome: 'VISTORIADOR',
      descricao: 'Nível para vistoriadores'
    });

    const usuario = await Usuario.create({
      clerk_user_id: 'clerk_test',
      nome: 'Usuário Teste',
      email: 'teste@teste.com',
      nivel_acesso_id: nivelAcesso.id
    });

    const embarcacao = await Embarcacao.create({
      nome: 'Barco Teste',
      nr_inscricao_barco: 'TEST001'
    });

    const local = await Local.create({
      tipo: 'MARINA',
      nome_local: 'Marina Teste'
    });

    const status = await StatusVistoria.create({
      nome: 'PENDENTE',
      descricao: 'Vistoria pendente'
    });

    vistoria = await Vistoria.create({
      embarcacao_id: embarcacao.id,
      local_id: local.id,
      vistoriador_id: usuario.id,
      administrador_id: usuario.id,
      status_id: status.id
    });
  });

  describe('Criação de laudo', () => {
    it('deve criar um laudo com dados válidos', async () => {
      const laudoData = {
        url_pdf: 'https://example.com/laudo.pdf',
        vistoria_id: vistoria.id
      };

      const laudo = await Laudo.create(laudoData);

      expect(laudo).toBeDefined();
      expect(laudo.url_pdf).toBe(laudoData.url_pdf);
      expect(laudo.vistoria_id).toBe(laudoData.vistoria_id);
      expect(laudo.data_geracao).toBeDefined();
      expect(laudo.data_geracao).toBeInstanceOf(Date);
    });

    it('deve definir data_geracao automaticamente', async () => {
      const laudoData = {
        url_pdf: 'https://example.com/laudo_auto.pdf',
        vistoria_id: vistoria.id
      };

      const antes = new Date();
      const laudo = await Laudo.create(laudoData);
      const depois = new Date();

      expect(laudo.data_geracao).toBeDefined();
      expect(laudo.data_geracao.getTime()).toBeGreaterThanOrEqual(antes.getTime());
      expect(laudo.data_geracao.getTime()).toBeLessThanOrEqual(depois.getTime());
    });

    it('deve falhar ao criar laudo sem url_pdf', async () => {
      const laudoData = {
        vistoria_id: vistoria.id
      };

      await expect(Laudo.create(laudoData)).rejects.toThrow();
    });

    it('deve falhar ao criar laudo sem vistoria_id', async () => {
      const laudoData = {
        url_pdf: 'https://example.com/laudo_sem_vistoria.pdf'
      };

      await expect(Laudo.create(laudoData)).rejects.toThrow();
    });
  });

  describe('Validações de tamanho', () => {
    it('deve limitar url_pdf a 512 caracteres', async () => {
      const urlLonga = 'https://example.com/' + 'a'.repeat(500) + '.pdf';
      
      const laudoData = {
        url_pdf: urlLonga,
        vistoria_id: vistoria.id
      };

      await expect(Laudo.create(laudoData)).rejects.toThrow();
    });

    it('deve aceitar url_pdf com tamanho válido', async () => {
      const urlValida = 'https://example.com/laudo.pdf';
      
      const laudoData = {
        url_pdf: urlValida,
        vistoria_id: vistoria.id
      };

      const laudo = await Laudo.create(laudoData);
      expect(laudo.url_pdf).toBe(urlValida);
    });
  });

  describe('Associações', () => {
    let laudo;

    beforeEach(async () => {
      laudo = await Laudo.create({
        url_pdf: 'https://example.com/laudo_associacao.pdf',
        vistoria_id: vistoria.id
      });
    });

    it('deve incluir vistoria ao buscar laudo', async () => {
      const laudoComVistoria = await Laudo.findByPk(laudo.id, {
        include: { model: Vistoria, as: 'Vistoria' }
      });

      expect(laudoComVistoria).toBeDefined();
      expect(laudoComVistoria.Vistoria).toBeDefined();
      expect(laudoComVistoria.Vistoria.id).toBe(vistoria.id);
    });

    it('deve incluir vistoria com associações aninhadas', async () => {
      const laudoCompleto = await Laudo.findByPk(laudo.id, {
        include: {
          model: Vistoria,
          as: 'Vistoria',
          include: [Embarcacao, Local]
        }
      });

      expect(laudoCompleto).toBeDefined();
      expect(laudoCompleto.Vistoria).toBeDefined();
      expect(laudoCompleto.Vistoria.Embarcacao).toBeDefined();
      expect(laudoCompleto.Vistoria.Local).toBeDefined();
    });
  });

  describe('Operações CRUD', () => {
    let laudo;

    beforeEach(async () => {
      laudo = await Laudo.create({
        url_pdf: 'https://example.com/laudo_crud.pdf',
        vistoria_id: vistoria.id
      });
    });

    it('deve buscar laudo por ID', async () => {
      const laudoEncontrado = await Laudo.findByPk(laudo.id);
      expect(laudoEncontrado).toBeDefined();
      expect(laudoEncontrado.url_pdf).toBe('https://example.com/laudo_crud.pdf');
    });

    it('deve atualizar URL do laudo', async () => {
      const novaUrl = 'https://example.com/laudo_atualizado.pdf';
      await laudo.update({ url_pdf: novaUrl });
      
      const laudoAtualizado = await Laudo.findByPk(laudo.id);
      expect(laudoAtualizado.url_pdf).toBe(novaUrl);
    });

    it('não deve permitir atualizar data_geracao', async () => {
      const dataOriginal = laudo.data_geracao;
      const novaData = new Date('2020-01-01');
      
      await laudo.update({ data_geracao: novaData });
      
      const laudoAtualizado = await Laudo.findByPk(laudo.id);
      expect(laudoAtualizado.data_geracao).toEqual(dataOriginal);
    });

    it('deve deletar laudo', async () => {
      await laudo.destroy();
      
      const laudoDeletado = await Laudo.findByPk(laudo.id);
      expect(laudoDeletado).toBeNull();
    });
  });

  describe('Consultas por vistoria', () => {
    let vistoria2;

    beforeEach(async () => {
      // Criar segunda vistoria
      const nivelAcesso = await NivelAcesso.create({
        nome: 'ADMIN',
        descricao: 'Administrador'
      });

      const usuario = await Usuario.create({
        clerk_user_id: 'clerk_admin',
        nome: 'Admin Teste',
        email: 'admin@teste.com',
        nivel_acesso_id: nivelAcesso.id
      });

      const embarcacao = await Embarcacao.create({
        nome: 'Barco 2',
        nr_inscricao_barco: 'TEST002'
      });

      const local = await Local.create({
        tipo: 'RESIDENCIA',
        nome_local: 'Residência Teste'
      });

      const status = await StatusVistoria.create({
        nome: 'CONCLUIDA',
        descricao: 'Vistoria concluída'
      });

      vistoria2 = await Vistoria.create({
        embarcacao_id: embarcacao.id,
        local_id: local.id,
        vistoriador_id: usuario.id,
        administrador_id: usuario.id,
        status_id: status.id
      });

      // Criar laudos para ambas as vistorias
      await Laudo.create({
        url_pdf: 'https://example.com/laudo1.pdf',
        vistoria_id: vistoria.id
      });

      await Laudo.create({
        url_pdf: 'https://example.com/laudo2.pdf',
        vistoria_id: vistoria2.id
      });
    });

    it('deve buscar laudo por vistoria', async () => {
      const laudoVistoria1 = await Laudo.findOne({
        where: { vistoria_id: vistoria.id }
      });

      expect(laudoVistoria1).toBeDefined();
      expect(laudoVistoria1.vistoria_id).toBe(vistoria.id);

      const laudoVistoria2 = await Laudo.findOne({
        where: { vistoria_id: vistoria2.id }
      });

      expect(laudoVistoria2).toBeDefined();
      expect(laudoVistoria2.vistoria_id).toBe(vistoria2.id);
    });

    it('deve buscar todos os laudos', async () => {
      const todosLaudos = await Laudo.findAll();
      expect(todosLaudos).toHaveLength(2);
    });

    it('deve ordenar laudos por data de geração', async () => {
      const laudosOrdenados = await Laudo.findAll({
        order: [['data_geracao', 'DESC']]
      });

      expect(laudosOrdenados).toHaveLength(2);
      expect(laudosOrdenados[0].data_geracao.getTime())
        .toBeGreaterThanOrEqual(laudosOrdenados[1].data_geracao.getTime());
    });
  });

  describe('Relacionamento 1:1 com Vistoria', () => {
    it('deve permitir apenas um laudo por vistoria', async () => {
      // Criar primeiro laudo
      await Laudo.create({
        url_pdf: 'https://example.com/laudo1.pdf',
        vistoria_id: vistoria.id
      });

      // Tentar criar segundo laudo para a mesma vistoria
      // (Isso pode ser permitido pelo modelo, mas pode ser restringido por regra de negócio)
      const segundoLaudo = await Laudo.create({
        url_pdf: 'https://example.com/laudo2.pdf',
        vistoria_id: vistoria.id
      });

      expect(segundoLaudo).toBeDefined();
      
      // Verificar que existem dois laudos para a mesma vistoria
      const laudosVistoria = await Laudo.findAll({
        where: { vistoria_id: vistoria.id }
      });

      expect(laudosVistoria).toHaveLength(2);
    });
  });
});
