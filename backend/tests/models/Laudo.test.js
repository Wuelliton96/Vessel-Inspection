const { Laudo, Vistoria, Usuario, Embarcacao, Local, StatusVistoria, NivelAcesso } = require('../../models');

describe('Modelo Laudo', () => {
  let vistoria;

  beforeEach(async () => {
    const nivelAdmin = await NivelAcesso.create({
      nome: 'ADMINISTRADOR',
      descricao: 'Administrador do sistema'
    });

    const usuario = await Usuario.create({
      nome: 'Admin Teste',
      email: 'admin@laudo.test',
      senha_hash: 'hash123',
      nivel_acesso_id: nivelAdmin.id
    });

    const embarcacao = await Embarcacao.create({
      nome: 'Embarcação Teste',
      nr_inscricao_barco: 'EMB-LAUDO-001'
    });

    const local = await Local.create({
      tipo: 'MARINA',
      nome_local: 'Marina Teste'
    });

    const status = await StatusVistoria.create({
      nome: 'CONCLUIDA',
      descricao: 'Vistoria concluída'
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
        vistoria_id: vistoria.id,
        numero_laudo: '251111A',
        versao: 'BS 2021-01',
        nome_moto_aquatica: 'Sea Doo RXT X 325',
        proprietario: 'João Silva',
        cpf_cnpj: '123.456.789-00',
        valor_risco: 175000.00
      };

      const laudo = await Laudo.create(laudoData);

      expect(laudo).toBeDefined();
      expect(laudo.numero_laudo).toBe(laudoData.numero_laudo);
      expect(laudo.vistoria_id).toBe(laudoData.vistoria_id);
      expect(laudo.nome_moto_aquatica).toBe(laudoData.nome_moto_aquatica);
      expect(laudo.versao).toBe('BS 2021-01');
      expect(parseFloat(laudo.valor_risco)).toBe(175000.00);
    });

    it('deve ter versão padrão BS 2021-01', async () => {
      const laudo = await Laudo.create({
        vistoria_id: vistoria.id,
        numero_laudo: '251111B'
      });

      expect(laudo.versao).toBe('BS 2021-01');
    });

    it('deve definir data_geracao automaticamente', async () => {
      const antes = new Date();
      const laudo = await Laudo.create({
        vistoria_id: vistoria.id,
        numero_laudo: '251111C'
      });
      const depois = new Date();

      expect(laudo.data_geracao).toBeDefined();
      expect(laudo.data_geracao.getTime()).toBeGreaterThanOrEqual(antes.getTime());
      expect(laudo.data_geracao.getTime()).toBeLessThanOrEqual(depois.getTime());
    });

    it('deve falhar ao criar laudo sem vistoria_id', async () => {
      await expect(Laudo.create({
        numero_laudo: '251111D'
      })).rejects.toThrow();
    });

    it('deve falhar ao criar laudo sem numero_laudo', async () => {
      await expect(Laudo.create({
        vistoria_id: vistoria.id
      })).rejects.toThrow();
    });

    it('deve garantir numero_laudo único', async () => {
      await Laudo.create({
        vistoria_id: vistoria.id,
        numero_laudo: '251111E'
      });

      const vistoria2 = await Vistoria.create({
        embarcacao_id: vistoria.embarcacao_id,
        local_id: vistoria.local_id,
        vistoriador_id: vistoria.vistoriador_id,
        administrador_id: vistoria.administrador_id,
        status_id: vistoria.status_id
      });

      await expect(Laudo.create({
        vistoria_id: vistoria2.id,
        numero_laudo: '251111E'
      })).rejects.toThrow();
    });

    it('deve garantir vistoria_id único (1:1)', async () => {
      await Laudo.create({
        vistoria_id: vistoria.id,
        numero_laudo: '251111F'
      });

      await expect(Laudo.create({
        vistoria_id: vistoria.id,
        numero_laudo: '251111G'
      })).rejects.toThrow();
    });
  });

  describe('Campos de dados gerais', () => {
    it('deve armazenar dados gerais corretamente', async () => {
      const laudo = await Laudo.create({
        vistoria_id: vistoria.id,
        numero_laudo: '251111H',
        nome_moto_aquatica: 'Yamaha VX Cruiser',
        local_guarda: 'Marina Porto Belo',
        proprietario: 'Maria Santos',
        cpf_cnpj: '987.654.321-00',
        endereco_proprietario: 'Rua das Flores, 123',
        responsavel: 'Pedro Oliveira',
        data_inspecao: '2025-11-10',
        local_vistoria: 'Marina Porto Belo - Santos/SP',
        empresa_prestadora: 'Tech Survey Ltda',
        responsavel_inspecao: 'SPS R1234',
        participantes_inspecao: 'Pedro e João'
      });

      expect(laudo.nome_moto_aquatica).toBe('Yamaha VX Cruiser');
      expect(laudo.proprietario).toBe('Maria Santos');
      expect(laudo.responsavel_inspecao).toBe('SPS R1234');
    });
  });

  describe('Campos de embarcação', () => {
    it('deve armazenar dados da embarcação', async () => {
      const laudo = await Laudo.create({
        vistoria_id: vistoria.id,
        numero_laudo: '251111I',
        inscricao_capitania: 'A ser inscrita',
        estaleiro_construtor: 'Yamaha',
        tipo_embarcacao: 'Moto aquática',
        modelo_embarcacao: 'VX Cruiser',
        ano_fabricacao: 2024,
        capacidade: '1 tripulante / 2 passageiros',
        classificacao_embarcacao: 'Recreio',
        area_navegacao: 'Interior',
        situacao_capitania: 'Regular',
        valor_risco: 150000.50
      });

      expect(laudo.modelo_embarcacao).toBe('VX Cruiser');
      expect(laudo.ano_fabricacao).toBe(2024);
      expect(parseFloat(laudo.valor_risco)).toBe(150000.50);
    });
  });

  describe('Campos de propulsão', () => {
    it('deve armazenar dados de propulsão', async () => {
      const laudo = await Laudo.create({
        vistoria_id: vistoria.id,
        numero_laudo: '251111J',
        quantidade_motores: 2,
        tipo_motor: 'Centro',
        fabricante_motor: 'Yamaha',
        modelo_motor: 'F250',
        numero_serie_motor: 'SN123456',
        potencia_motor: '250 HP',
        combustivel_utilizado: 'Gasolina',
        capacidade_tanque: '100 litros',
        ano_fabricacao_motor: 2024
      });

      expect(laudo.quantidade_motores).toBe(2);
      expect(laudo.potencia_motor).toBe('250 HP');
      expect(laudo.fabricante_motor).toBe('Yamaha');
    });
  });

  describe('Checklists JSONB', () => {
    it('deve armazenar checklist elétrica como JSONB', async () => {
      const checklistEletrica = {
        terminais_estanhados: 'Sim',
        circuitos_protegidos: 'Sim',
        chave_geral: 'Não possui',
        terminais_baterias: 'Sim',
        baterias_fixadas: 'Sim',
        passagem_chicotes: 'Sim',
        cabo_arranque: 'Sim'
      };

      const laudo = await Laudo.create({
        vistoria_id: vistoria.id,
        numero_laudo: '251111K',
        checklist_eletrica: checklistEletrica
      });

      expect(laudo.checklist_eletrica).toEqual(checklistEletrica);
      expect(laudo.checklist_eletrica.terminais_estanhados).toBe('Sim');
    });

    it('deve armazenar checklist hidráulica como JSONB', async () => {
      const checklistHidraulica = {
        material_tanques: 'Sim',
        abracadeiras_inox: 'Sim'
      };

      const laudo = await Laudo.create({
        vistoria_id: vistoria.id,
        numero_laudo: '251111L',
        checklist_hidraulica: checklistHidraulica
      });

      expect(laudo.checklist_hidraulica).toEqual(checklistHidraulica);
    });

    it('deve armazenar checklist geral como JSONB', async () => {
      const checklistGeral = {
        carreta_condicoes: 'Sim'
      };

      const laudo = await Laudo.create({
        vistoria_id: vistoria.id,
        numero_laudo: '251111M',
        checklist_geral: checklistGeral
      });

      expect(laudo.checklist_geral).toEqual(checklistGeral);
    });
  });

  describe('Configurações do laudo', () => {
    it('deve armazenar configurações da empresa', async () => {
      const laudo = await Laudo.create({
        vistoria_id: vistoria.id,
        numero_laudo: '251111N',
        nome_empresa: 'Tech Survey Vistorias Ltda',
        logo_empresa_url: '/logos/tech-survey.png',
        nota_rodape: 'Relatório exclusivo para Essor Seguros'
      });

      expect(laudo.nome_empresa).toBe('Tech Survey Vistorias Ltda');
      expect(laudo.nota_rodape).toContain('Essor Seguros');
    });
  });

  describe('Relacionamento com Vistoria', () => {
    it('deve carregar vistoria relacionada', async () => {
      const laudo = await Laudo.create({
        vistoria_id: vistoria.id,
        numero_laudo: '251111O'
      });

      const laudoComVistoria = await Laudo.findByPk(laudo.id, {
        include: [{ model: Vistoria, as: 'Vistoria' }]
      });

      expect(laudoComVistoria.Vistoria).toBeDefined();
      expect(laudoComVistoria.Vistoria.id).toBe(vistoria.id);
    });
  });

  describe('Atualização de laudo', () => {
    it('deve atualizar campos do laudo', async () => {
      const laudo = await Laudo.create({
        vistoria_id: vistoria.id,
        numero_laudo: '251111P',
        proprietario: 'Nome Original'
      });

      await laudo.update({
        proprietario: 'Nome Atualizado',
        observacoes_vistoria: 'Novas observações'
      });

      expect(laudo.proprietario).toBe('Nome Atualizado');
      expect(laudo.observacoes_vistoria).toBe('Novas observações');
    });

    it('não deve permitir alterar data_geracao', async () => {
      const laudo = await Laudo.create({
        vistoria_id: vistoria.id,
        numero_laudo: '251111Q'
      });

      const dataOriginal = laudo.data_geracao;
      
      await laudo.update({
        data_geracao: new Date('2020-01-01')
      });

      expect(laudo.data_geracao).toEqual(dataOriginal);
    });
  });

  describe('Deleção de laudo', () => {
    it('deve deletar laudo com sucesso', async () => {
      const laudo = await Laudo.create({
        vistoria_id: vistoria.id,
        numero_laudo: '251111R'
      });

      await laudo.destroy();

      const laudoDeletado = await Laudo.findByPk(laudo.id);
      expect(laudoDeletado).toBeNull();
    });
  });

  describe('Campos numéricos', () => {
    it('deve aceitar valores decimais para valor_risco', async () => {
      const laudo = await Laudo.create({
        vistoria_id: vistoria.id,
        numero_laudo: '251111S',
        valor_risco: 123456.78
      });

      expect(parseFloat(laudo.valor_risco)).toBe(123456.78);
    });

    it('deve aceitar valores inteiros para quantidades', async () => {
      const laudo = await Laudo.create({
        vistoria_id: vistoria.id,
        numero_laudo: '251111T',
        quantidade_motores: 2,
        quantidade_baterias: 3,
        quantidade_geradores: 1
      });

      expect(laudo.quantidade_motores).toBe(2);
      expect(laudo.quantidade_baterias).toBe(3);
      expect(laudo.quantidade_geradores).toBe(1);
    });
  });

  describe('Campos de texto longo', () => {
    it('deve armazenar observações longas', async () => {
      const textoLongo = 'A'.repeat(1000);
      
      const laudo = await Laudo.create({
        vistoria_id: vistoria.id,
        numero_laudo: '251111U',
        observacoes_casco: textoLongo,
        observacoes_vistoria: textoLongo
      });

      expect(laudo.observacoes_casco).toBe(textoLongo);
      expect(laudo.observacoes_vistoria).toBe(textoLongo);
    });
  });

  describe('URL do PDF', () => {
    it('deve armazenar URL do PDF gerado', async () => {
      const laudo = await Laudo.create({
        vistoria_id: vistoria.id,
        numero_laudo: '251111V',
        url_pdf: '/uploads/laudos/2025/11/laudo-1.pdf'
      });

      expect(laudo.url_pdf).toBe('/uploads/laudos/2025/11/laudo-1.pdf');
    });

    it('deve permitir atualizar URL do PDF', async () => {
      const laudo = await Laudo.create({
        vistoria_id: vistoria.id,
        numero_laudo: '251111W'
      });

      await laudo.update({
        url_pdf: '/uploads/laudos/2025/11/laudo-novo.pdf'
      });

      expect(laudo.url_pdf).toBe('/uploads/laudos/2025/11/laudo-novo.pdf');
    });
  });

  describe('Timestamps', () => {
    it('deve ter created_at e updated_at', async () => {
      const laudo = await Laudo.create({
        vistoria_id: vistoria.id,
        numero_laudo: '251111X'
      });

      expect(laudo.created_at).toBeDefined();
      expect(laudo.updated_at).toBeDefined();
      expect(laudo.created_at).toBeInstanceOf(Date);
      expect(laudo.updated_at).toBeInstanceOf(Date);
    });

    it('deve atualizar updated_at ao modificar', async () => {
      const laudo = await Laudo.create({
        vistoria_id: vistoria.id,
        numero_laudo: '251111Y'
      });

      const updatedAtOriginal = laudo.updated_at;
      
      await new Promise(resolve => setTimeout(resolve, 100));
      
      await laudo.update({ proprietario: 'Novo Nome' });

      expect(laudo.updated_at.getTime()).toBeGreaterThan(updatedAtOriginal.getTime());
    });
  });
});

