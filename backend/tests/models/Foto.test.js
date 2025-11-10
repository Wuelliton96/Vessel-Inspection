const { Foto, Vistoria, TipoFotoChecklist, Usuario, Embarcacao, Local, StatusVistoria, NivelAcesso } = require('../../models');

describe('Modelo Foto', () => {
  let vistoria, tipoFoto;

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

    tipoFoto = await TipoFotoChecklist.create({
      codigo: 'FOTO001',
      nome_exibicao: 'Foto do Casco',
      descricao: 'Foto obrigatória do casco da embarcação',
      obrigatorio: true
    });
  });

  describe('Criação de foto', () => {
    it('deve criar uma foto com dados válidos', async () => {
      const fotoData = {
        url_arquivo: 'https://example.com/foto1.jpg',
        observacao: 'Foto do casco em boas condições',
        vistoria_id: vistoria.id,
        tipo_foto_id: tipoFoto.id
      };

      const foto = await Foto.create(fotoData);

      expect(foto).toBeDefined();
      expect(foto.url_arquivo).toBe(fotoData.url_arquivo);
      expect(foto.observacao).toBe(fotoData.observacao);
      expect(foto.vistoria_id).toBe(fotoData.vistoria_id);
      expect(foto.tipo_foto_id).toBe(fotoData.tipo_foto_id);
    });

    it('deve criar foto sem observação', async () => {
      const fotoData = {
        url_arquivo: 'https://example.com/foto2.jpg',
        vistoria_id: vistoria.id,
        tipo_foto_id: tipoFoto.id
      };

      const foto = await Foto.create(fotoData);

      expect(foto).toBeDefined();
      expect(foto.url_arquivo).toBe(fotoData.url_arquivo);
      expect(foto.observacao).toBeNull();
    });

    it('deve falhar ao criar foto sem url_arquivo', async () => {
      const fotoData = {
        observacao: 'Foto sem URL',
        vistoria_id: vistoria.id,
        tipo_foto_id: tipoFoto.id
      };

      await expect(Foto.create(fotoData)).rejects.toThrow();
    });

    it('deve falhar ao criar foto sem vistoria_id', async () => {
      const fotoData = {
        url_arquivo: 'https://example.com/foto3.jpg',
        tipo_foto_id: tipoFoto.id
      };

      await expect(Foto.create(fotoData)).rejects.toThrow();
    });

    it('deve falhar ao criar foto sem tipo_foto_id', async () => {
      const fotoData = {
        url_arquivo: 'https://example.com/foto4.jpg',
        vistoria_id: vistoria.id
      };

      await expect(Foto.create(fotoData)).rejects.toThrow();
    });
  });

  describe('Validações de tamanho', () => {
    it('deve limitar url_arquivo a 512 caracteres', async () => {
      const urlLonga = 'https://example.com/' + 'a'.repeat(500) + '.jpg';
      
      const fotoData = {
        url_arquivo: urlLonga,
        vistoria_id: vistoria.id,
        tipo_foto_id: tipoFoto.id
      };

      await expect(Foto.create(fotoData)).rejects.toThrow();
    });

    it('deve aceitar url_arquivo com tamanho válido', async () => {
      const urlValida = 'https://example.com/foto.jpg';
      
      const fotoData = {
        url_arquivo: urlValida,
        vistoria_id: vistoria.id,
        tipo_foto_id: tipoFoto.id
      };

      const foto = await Foto.create(fotoData);
      expect(foto.url_arquivo).toBe(urlValida);
    });
  });

  describe('Associações', () => {
    let foto;

    beforeEach(async () => {
      foto = await Foto.create({
        url_arquivo: 'https://example.com/foto_associacao.jpg',
        observacao: 'Foto para teste de associação',
        vistoria_id: vistoria.id,
        tipo_foto_id: tipoFoto.id
      });
    });

    it('deve incluir vistoria ao buscar foto', async () => {
      const fotoComVistoria = await Foto.findByPk(foto.id, {
        include: Vistoria
      });

      expect(fotoComVistoria).toBeDefined();
      expect(fotoComVistoria.Vistoria).toBeDefined();
      expect(fotoComVistoria.Vistoria.id).toBe(vistoria.id);
    });

    it('deve incluir tipo de foto ao buscar foto', async () => {
      const fotoComTipo = await Foto.findByPk(foto.id, {
        include: TipoFotoChecklist
      });

      expect(fotoComTipo).toBeDefined();
      expect(fotoComTipo.TipoFotoChecklist).toBeDefined();
      expect(fotoComTipo.TipoFotoChecklist.codigo).toBe('FOTO001');
    });

    it('deve incluir vistoria e tipo de foto ao buscar foto', async () => {
      const fotoCompleta = await Foto.findByPk(foto.id, {
        include: [Vistoria, TipoFotoChecklist]
      });

      expect(fotoCompleta).toBeDefined();
      expect(fotoCompleta.Vistoria).toBeDefined();
      expect(fotoCompleta.TipoFotoChecklist).toBeDefined();
    });
  });

  describe('Operações CRUD', () => {
    let foto;

    beforeEach(async () => {
      foto = await Foto.create({
        url_arquivo: 'https://example.com/foto_crud.jpg',
        observacao: 'Foto para testes CRUD',
        vistoria_id: vistoria.id,
        tipo_foto_id: tipoFoto.id
      });
    });

    it('deve buscar foto por ID', async () => {
      const fotoEncontrada = await Foto.findByPk(foto.id);
      expect(fotoEncontrada).toBeDefined();
      expect(fotoEncontrada.url_arquivo).toBe('https://example.com/foto_crud.jpg');
    });

    it('deve atualizar observação da foto', async () => {
      await foto.update({ observacao: 'Observação atualizada' });
      
      const fotoAtualizada = await Foto.findByPk(foto.id);
      expect(fotoAtualizada.observacao).toBe('Observação atualizada');
    });

    it('deve atualizar URL da foto', async () => {
      const novaUrl = 'https://example.com/nova_foto.jpg';
      await foto.update({ url_arquivo: novaUrl });
      
      const fotoAtualizada = await Foto.findByPk(foto.id);
      expect(fotoAtualizada.url_arquivo).toBe(novaUrl);
    });

    it('deve deletar foto', async () => {
      await foto.destroy();
      
      const fotoDeletada = await Foto.findByPk(foto.id);
      expect(fotoDeletada).toBeNull();
    });
  });

  describe('Consultas por vistoria', () => {
    let tipoFoto2;

    beforeEach(async () => {
      tipoFoto2 = await TipoFotoChecklist.create({
        codigo: 'FOTO002',
        nome_exibicao: 'Foto do Motor',
        descricao: 'Foto do motor da embarcação',
        obrigatorio: false
      });

      // Criar múltiplas fotos para a mesma vistoria
      await Foto.create({
        url_arquivo: 'https://example.com/foto1.jpg',
        vistoria_id: vistoria.id,
        tipo_foto_id: tipoFoto.id
      });

      await Foto.create({
        url_arquivo: 'https://example.com/foto2.jpg',
        vistoria_id: vistoria.id,
        tipo_foto_id: tipoFoto2.id
      });
    });

    it('deve buscar todas as fotos de uma vistoria', async () => {
      const fotos = await Foto.findAll({
        where: { vistoria_id: vistoria.id }
      });

      expect(fotos).toHaveLength(2);
      fotos.forEach(foto => {
        expect(foto.vistoria_id).toBe(vistoria.id);
      });
    });

    it('deve buscar fotos por tipo', async () => {
      const fotosTipo1 = await Foto.findAll({
        where: { tipo_foto_id: tipoFoto.id }
      });

      expect(fotosTipo1).toHaveLength(1);
      expect(fotosTipo1[0].tipo_foto_id).toBe(tipoFoto.id);
    });

    it('deve buscar fotos com observação', async () => {
      await Foto.create({
        url_arquivo: 'https://example.com/foto_com_obs.jpg',
        observacao: 'Foto com observação',
        vistoria_id: vistoria.id,
        tipo_foto_id: tipoFoto.id
      });

      const fotosComObservacao = await Foto.findAll({
        where: {
          observacao: {
            [require('sequelize').Op.ne]: null
          }
        }
      });

      expect(fotosComObservacao.length).toBeGreaterThan(0);
      fotosComObservacao.forEach(foto => {
        expect(foto.observacao).toBeTruthy();
      });
    });
  });
});
