const { Local, sequelize } = require('../../models');

describe('Modelo Local', () => {
  beforeEach(async () => {
    // Limpar locais antes de cada teste (apenas os que não têm foreign keys)
    try {
      // Tentar deletar, mas ignorar se houver foreign key constraints
      await Local.destroy({ where: {}, force: true });
    } catch (error) {
      // Ignorar erro se houver foreign key constraints
      // Isso pode acontecer se houver vistorias usando os locais
    }
  });

  afterAll(async () => {
    await sequelize.close();
  });

  describe('Criação de local', () => {
    it('deve criar um local com dados válidos', async () => {
      const localData = {
        tipo: 'MARINA',
        nome_local: 'Marina Teste',
        cep: '12345-678',
        logradouro: 'Rua das Marinhas',
        numero: '123',
        complemento: 'Bloco A',
        bairro: 'Centro',
        cidade: 'Rio de Janeiro',
        estado: 'RJ'
      };

      const local = await Local.create(localData);

      expect(local).toBeDefined();
      expect(local.tipo).toBe(localData.tipo);
      expect(local.nome_local).toBe(localData.nome_local);
      expect(local.cep).toBe(localData.cep);
      expect(local.logradouro).toBe(localData.logradouro);
      expect(local.numero).toBe(localData.numero);
      expect(local.complemento).toBe(localData.complemento);
      expect(local.bairro).toBe(localData.bairro);
      expect(local.cidade).toBe(localData.cidade);
      expect(local.estado).toBe(localData.estado);
    });

    it('deve criar local apenas com tipo obrigatório', async () => {
      const localData = {
        tipo: 'RESIDENCIA'
      };

      const local = await Local.create(localData);

      expect(local).toBeDefined();
      expect(local.tipo).toBe(localData.tipo);
      expect(local.nome_local).toBeNull();
      expect(local.cep).toBeNull();
    });

    it('deve falhar ao criar local sem tipo', async () => {
      const localData = {
        nome_local: 'Local sem tipo'
      };

      await expect(Local.create(localData)).rejects.toThrow();
    });

    it('deve falhar ao criar local com tipo inválido', async () => {
      const localData = {
        tipo: 'TIPO_INVALIDO'
      };

      await expect(Local.create(localData)).rejects.toThrow();
    });
  });

  describe('Validações de ENUM', () => {
    it('deve aceitar tipo MARINA', async () => {
      const local = await Local.create({ tipo: 'MARINA' });
      expect(local.tipo).toBe('MARINA');
    });

    it('deve aceitar tipo RESIDENCIA', async () => {
      const local = await Local.create({ tipo: 'RESIDENCIA' });
      expect(local.tipo).toBe('RESIDENCIA');
    });
  });

  describe('Validações de tamanho', () => {
    it('deve limitar estado a 2 caracteres', async () => {
      const localData = {
        tipo: 'MARINA',
        estado: 'RJ'
      };

      const local = await Local.create(localData);
      expect(local.estado).toBe('RJ');
    });

    it('deve falhar com estado maior que 2 caracteres', async () => {
      const localData = {
        tipo: 'MARINA',
        estado: 'RIO'
      };

      await expect(Local.create(localData)).rejects.toThrow();
    });
  });

  describe('Operações CRUD', () => {
    let local;

    beforeEach(async () => {
      local = await Local.create({
        tipo: 'MARINA',
        nome_local: 'Marina CRUD',
        cep: '12345-678',
        cidade: 'Rio de Janeiro',
        estado: 'RJ'
      });
    });

    it('deve buscar local por ID', async () => {
      const localEncontrado = await Local.findByPk(local.id);
      expect(localEncontrado).toBeDefined();
      expect(localEncontrado.nome_local).toBe('Marina CRUD');
    });

    it('deve buscar local por tipo', async () => {
      const locais = await Local.findAll({
        where: { tipo: 'MARINA' }
      });

      expect(locais.length).toBeGreaterThan(0);
      locais.forEach(l => {
        expect(l.tipo).toBe('MARINA');
      });
    });

    it('deve atualizar local', async () => {
      await local.update({ 
        nome_local: 'Marina Atualizada',
        cidade: 'São Paulo',
        estado: 'SP'
      });
      
      const localAtualizado = await Local.findByPk(local.id);
      expect(localAtualizado.nome_local).toBe('Marina Atualizada');
      expect(localAtualizado.cidade).toBe('São Paulo');
      expect(localAtualizado.estado).toBe('SP');
    });

    it('deve deletar local', async () => {
      await local.destroy();
      
      const localDeletado = await Local.findByPk(local.id);
      expect(localDeletado).toBeNull();
    });
  });

  describe('Consultas por localização', () => {
    beforeEach(async () => {
      await Local.create({
        tipo: 'MARINA',
        cidade: 'Rio de Janeiro',
        estado: 'RJ'
      });

      await Local.create({
        tipo: 'RESIDENCIA',
        cidade: 'São Paulo',
        estado: 'SP'
      });

      await Local.create({
        tipo: 'MARINA',
        cidade: 'Rio de Janeiro',
        estado: 'RJ'
      });
    });

    it('deve buscar locais por cidade', async () => {
      const locaisRJ = await Local.findAll({
        where: { cidade: 'Rio de Janeiro' }
      });

      expect(locaisRJ).toHaveLength(2);
      locaisRJ.forEach(local => {
        expect(local.cidade).toBe('Rio de Janeiro');
      });
    });

    it('deve buscar locais por estado', async () => {
      const locaisSP = await Local.findAll({
        where: { estado: 'SP' }
      });

      expect(locaisSP).toHaveLength(1);
      expect(locaisSP[0].estado).toBe('SP');
    });

    it('deve buscar locais por tipo e cidade', async () => {
      const marinasRJ = await Local.findAll({
        where: { 
          tipo: 'MARINA',
          cidade: 'Rio de Janeiro'
        }
      });

      expect(marinasRJ).toHaveLength(2);
      marinasRJ.forEach(local => {
        expect(local.tipo).toBe('MARINA');
        expect(local.cidade).toBe('Rio de Janeiro');
      });
    });
  });
});
