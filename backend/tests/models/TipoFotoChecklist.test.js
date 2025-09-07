const { TipoFotoChecklist } = require('../../models');

describe('Modelo TipoFotoChecklist', () => {
  describe('Criação de tipo de foto checklist', () => {
    it('deve criar um tipo de foto com dados válidos', async () => {
      const tipoData = {
        codigo: 'FOTO001',
        nome_exibicao: 'Foto do Casco',
        descricao: 'Foto obrigatória do casco da embarcação',
        obrigatorio: true
      };

      const tipo = await TipoFotoChecklist.create(tipoData);

      expect(tipo).toBeDefined();
      expect(tipo.codigo).toBe(tipoData.codigo);
      expect(tipo.nome_exibicao).toBe(tipoData.nome_exibicao);
      expect(tipo.descricao).toBe(tipoData.descricao);
      expect(tipo.obrigatorio).toBe(tipoData.obrigatorio);
    });

    it('deve criar tipo de foto sem descrição', async () => {
      const tipoData = {
        codigo: 'FOTO002',
        nome_exibicao: 'Foto do Motor',
        obrigatorio: false
      };

      const tipo = await TipoFotoChecklist.create(tipoData);

      expect(tipo).toBeDefined();
      expect(tipo.codigo).toBe(tipoData.codigo);
      expect(tipo.nome_exibicao).toBe(tipoData.nome_exibicao);
      expect(tipo.descricao).toBeNull();
      expect(tipo.obrigatorio).toBe(tipoData.obrigatorio);
    });

    it('deve definir obrigatorio como true por padrão', async () => {
      const tipoData = {
        codigo: 'FOTO003',
        nome_exibicao: 'Foto Padrão'
      };

      const tipo = await TipoFotoChecklist.create(tipoData);

      expect(tipo.obrigatorio).toBe(true);
    });

    it('deve falhar ao criar tipo sem codigo', async () => {
      const tipoData = {
        nome_exibicao: 'Foto sem código',
        obrigatorio: true
      };

      await expect(TipoFotoChecklist.create(tipoData)).rejects.toThrow();
    });

    it('deve falhar ao criar tipo sem nome_exibicao', async () => {
      const tipoData = {
        codigo: 'FOTO004',
        obrigatorio: true
      };

      await expect(TipoFotoChecklist.create(tipoData)).rejects.toThrow();
    });
  });

  describe('Validações de unicidade', () => {
    it('deve falhar ao criar tipo com codigo duplicado', async () => {
      const tipoData1 = {
        codigo: 'CODIGO_DUPLICADO',
        nome_exibicao: 'Primeiro Tipo',
        obrigatorio: true
      };

      const tipoData2 = {
        codigo: 'CODIGO_DUPLICADO',
        nome_exibicao: 'Segundo Tipo',
        obrigatorio: false
      };

      await TipoFotoChecklist.create(tipoData1);
      await expect(TipoFotoChecklist.create(tipoData2)).rejects.toThrow();
    });
  });

  describe('Operações CRUD', () => {
    let tipo;

    beforeEach(async () => {
      tipo = await TipoFotoChecklist.create({
        codigo: 'FOTO_CRUD',
        nome_exibicao: 'Tipo CRUD',
        descricao: 'Tipo para testes CRUD',
        obrigatorio: true
      });
    });

    it('deve buscar tipo por ID', async () => {
      const tipoEncontrado = await TipoFotoChecklist.findByPk(tipo.id);
      expect(tipoEncontrado).toBeDefined();
      expect(tipoEncontrado.codigo).toBe('FOTO_CRUD');
    });

    it('deve buscar tipo por código', async () => {
      const tipoEncontrado = await TipoFotoChecklist.findOne({
        where: { codigo: 'FOTO_CRUD' }
      });
      expect(tipoEncontrado).toBeDefined();
      expect(tipoEncontrado.id).toBe(tipo.id);
    });

    it('deve atualizar tipo', async () => {
      await tipo.update({ 
        nome_exibicao: 'Tipo Atualizado',
        descricao: 'Descrição atualizada',
        obrigatorio: false
      });
      
      const tipoAtualizado = await TipoFotoChecklist.findByPk(tipo.id);
      expect(tipoAtualizado.nome_exibicao).toBe('Tipo Atualizado');
      expect(tipoAtualizado.descricao).toBe('Descrição atualizada');
      expect(tipoAtualizado.obrigatorio).toBe(false);
    });

    it('deve deletar tipo', async () => {
      await tipo.destroy();
      
      const tipoDeletado = await TipoFotoChecklist.findByPk(tipo.id);
      expect(tipoDeletado).toBeNull();
    });
  });

  describe('Tipos de foto padrão do sistema', () => {
    it('deve criar tipos de foto padrão do sistema', async () => {
      const tiposPadrao = [
        {
          codigo: 'CASCO',
          nome_exibicao: 'Foto do Casco',
          descricao: 'Foto obrigatória do casco da embarcação',
          obrigatorio: true
        },
        {
          codigo: 'MOTOR',
          nome_exibicao: 'Foto do Motor',
          descricao: 'Foto do motor da embarcação',
          obrigatorio: true
        },
        {
          codigo: 'INTERIOR',
          nome_exibicao: 'Foto do Interior',
          descricao: 'Foto do interior da embarcação',
          obrigatorio: false
        },
        {
          codigo: 'DOCUMENTOS',
          nome_exibicao: 'Foto dos Documentos',
          descricao: 'Foto dos documentos da embarcação',
          obrigatorio: true
        }
      ];

      for (const tipoData of tiposPadrao) {
        const tipo = await TipoFotoChecklist.create(tipoData);
        expect(tipo).toBeDefined();
        expect(tipo.codigo).toBe(tipoData.codigo);
        expect(tipo.nome_exibicao).toBe(tipoData.nome_exibicao);
        expect(tipo.obrigatorio).toBe(tipoData.obrigatorio);
      }
    });
  });

  describe('Consultas por obrigatoriedade', () => {
    beforeEach(async () => {
      await TipoFotoChecklist.create({
        codigo: 'OBRIGATORIO1',
        nome_exibicao: 'Tipo Obrigatório 1',
        obrigatorio: true
      });

      await TipoFotoChecklist.create({
        codigo: 'OBRIGATORIO2',
        nome_exibicao: 'Tipo Obrigatório 2',
        obrigatorio: true
      });

      await TipoFotoChecklist.create({
        codigo: 'OPCIONAL1',
        nome_exibicao: 'Tipo Opcional 1',
        obrigatorio: false
      });

      await TipoFotoChecklist.create({
        codigo: 'OPCIONAL2',
        nome_exibicao: 'Tipo Opcional 2',
        obrigatorio: false
      });
    });

    it('deve buscar apenas tipos obrigatórios', async () => {
      const tiposObrigatorios = await TipoFotoChecklist.findAll({
        where: { obrigatorio: true }
      });

      expect(tiposObrigatorios).toHaveLength(2);
      tiposObrigatorios.forEach(tipo => {
        expect(tipo.obrigatorio).toBe(true);
      });
    });

    it('deve buscar apenas tipos opcionais', async () => {
      const tiposOpcionais = await TipoFotoChecklist.findAll({
        where: { obrigatorio: false }
      });

      expect(tiposOpcionais).toHaveLength(2);
      tiposOpcionais.forEach(tipo => {
        expect(tipo.obrigatorio).toBe(false);
      });
    });

    it('deve buscar todos os tipos', async () => {
      const todosTipos = await TipoFotoChecklist.findAll();
      expect(todosTipos).toHaveLength(4);
    });
  });

  describe('Consultas complexas', () => {
    beforeEach(async () => {
      await TipoFotoChecklist.create({
        codigo: 'CASCO',
        nome_exibicao: 'Foto do Casco',
        descricao: 'Casco da embarcação',
        obrigatorio: true
      });

      await TipoFotoChecklist.create({
        codigo: 'MOTOR',
        nome_exibicao: 'Foto do Motor',
        descricao: 'Motor da embarcação',
        obrigatorio: true
      });

      await TipoFotoChecklist.create({
        codigo: 'INTERIOR',
        nome_exibicao: 'Foto do Interior',
        descricao: 'Interior da embarcação',
        obrigatorio: false
      });
    });

    it('deve buscar tipos por nome contendo texto específico', async () => {
      const tiposComCasco = await TipoFotoChecklist.findAll({
        where: {
          nome_exibicao: {
            [require('sequelize').Op.like]: '%Casco%'
          }
        }
      });

      expect(tiposComCasco).toHaveLength(1);
      expect(tiposComCasco[0].codigo).toBe('CASCO');
    });

    it('deve buscar tipos por descrição contendo texto específico', async () => {
      const tiposComEmbarcacao = await TipoFotoChecklist.findAll({
        where: {
          descricao: {
            [require('sequelize').Op.like]: '%embarcação%'
          }
        }
      });

      expect(tiposComEmbarcacao).toHaveLength(3);
    });

    it('deve ordenar tipos por código', async () => {
      const tiposOrdenados = await TipoFotoChecklist.findAll({
        order: [['codigo', 'ASC']]
      });

      expect(tiposOrdenados).toHaveLength(3);
      expect(tiposOrdenados[0].codigo).toBe('CASCO');
      expect(tiposOrdenados[1].codigo).toBe('INTERIOR');
      expect(tiposOrdenados[2].codigo).toBe('MOTOR');
    });

    it('deve buscar tipos obrigatórios ordenados por nome', async () => {
      const tiposObrigatoriosOrdenados = await TipoFotoChecklist.findAll({
        where: { obrigatorio: true },
        order: [['nome_exibicao', 'ASC']]
      });

      expect(tiposObrigatoriosOrdenados).toHaveLength(2);
      expect(tiposObrigatoriosOrdenados[0].codigo).toBe('CASCO');
      expect(tiposObrigatoriosOrdenados[1].codigo).toBe('MOTOR');
    });
  });
});
