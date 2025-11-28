const { preencherDadosLaudo, preencherDadosLaudoExistente } = require('../../utils/preencherLaudo');

describe('preencherLaudo', () => {
  describe('preencherDadosLaudo', () => {
    it('deve preencher dados básicos da embarcação', () => {
      const vistoria = {
        Embarcacao: {
          nome: 'Barco Teste',
          proprietario_nome: 'João Silva',
          proprietario_cpf: '123.456.789-00',
          nr_inscricao_barco: 'BR-2024-001',
          tipo_embarcacao: 'LANCHA',
          ano_fabricacao: 2020,
          valor_embarcacao: 150000.00
        },
        data_conclusao: '2024-01-15',
        data_inicio: '2024-01-10',
        Local: {
          logradouro: 'Rua das Embarcações',
          numero: '100',
          bairro: 'Centro',
          cidade: 'Rio de Janeiro',
          estado: 'RJ'
        }
      };

      const dados = preencherDadosLaudo(vistoria);

      expect(dados.nome_moto_aquatica).toBe('Barco Teste');
      expect(dados.proprietario).toBe('João Silva');
      expect(dados.cpf_cnpj).toBe('123.456.789-00');
      expect(dados.inscricao_capitania).toBe('BR-2024-001');
      expect(dados.tipo_embarcacao).toBe('LANCHA');
      expect(dados.ano_fabricacao).toBe(2020);
      expect(dados.valor_risco).toBe(150000.00);
      expect(dados.data_inspecao).toBe('2024-01-15');
      expect(dados.local_vistoria).toContain('Rua das Embarcações');
      expect(dados.local_guarda).toContain('Rua das Embarcações');
    });

    it('deve usar dados do cliente quando embarcação não tem proprietário', () => {
      const vistoria = {
        Embarcacao: {
          nome: 'Barco Teste',
          Cliente: {
            nome: 'Maria Santos',
            cpf: '987.654.321-00',
            logradouro: 'Av. Principal',
            numero: '200',
            bairro: 'Centro',
            cidade: 'São Paulo',
            estado: 'SP'
          }
        },
        data_conclusao: '2024-01-15',
        Local: {
          logradouro: 'Rua das Embarcações',
          numero: '100',
          bairro: 'Centro',
          cidade: 'Rio de Janeiro',
          estado: 'RJ'
        }
      };

      const dados = preencherDadosLaudo(vistoria);

      expect(dados.proprietario).toBe('Maria Santos');
      expect(dados.cpf_cnpj).toBe('987.654.321-00');
      expect(dados.endereco_proprietario).toContain('Av. Principal');
      expect(dados.endereco_proprietario).toContain('200');
      expect(dados.endereco_proprietario).toContain('Centro');
      expect(dados.endereco_proprietario).toContain('São Paulo');
      expect(dados.endereco_proprietario).toContain('SP');
    });

    it('deve priorizar dados fornecidos em dadosIniciais', () => {
      const vistoria = {
        Embarcacao: {
          nome: 'Barco Teste',
          proprietario_nome: 'João Silva'
        },
        data_conclusao: '2024-01-15'
      };

      const dadosIniciais = {
        nome_moto_aquatica: 'Barco Customizado',
        proprietario: 'Pedro Costa'
      };

      const dados = preencherDadosLaudo(vistoria, dadosIniciais);

      expect(dados.nome_moto_aquatica).toBe('Barco Customizado');
      expect(dados.proprietario).toBe('Pedro Costa');
    });

    it('deve construir endereço do local corretamente', () => {
      const vistoria = {
        Embarcacao: {
          nome: 'Barco Teste'
        },
        data_conclusao: '2024-01-15',
        Local: {
          logradouro: 'Rua das Embarcações',
          numero: '100',
          bairro: 'Centro',
          cidade: 'Rio de Janeiro',
          estado: 'RJ'
        }
      };

      const dados = preencherDadosLaudo(vistoria);

      expect(dados.local_vistoria).toBe('Rua das Embarcações, 100, Centro, Rio de Janeiro, RJ');
      expect(dados.local_guarda).toBe('Rua das Embarcações, 100, Centro, Rio de Janeiro, RJ');
    });

    it('deve usar valor_embarcacao da vistoria quando disponível', () => {
      const vistoria = {
        Embarcacao: {
          nome: 'Barco Teste',
          valor_embarcacao: 200000.00
        },
        valor_embarcacao: 180000.00,
        data_conclusao: '2024-01-15'
      };

      const dados = preencherDadosLaudo(vistoria);

      expect(dados.valor_risco).toBe(180000.00);
    });
  });

  describe('preencherDadosLaudoExistente', () => {
    it('deve preservar dados existentes do laudo', () => {
      const laudo = {
        id: 1,
        nome_moto_aquatica: 'Barco Existente',
        proprietario: 'João Silva',
        cpf_cnpj: '123.456.789-00'
      };

      const vistoria = {
        Embarcacao: {
          nome: 'Barco Novo',
          proprietario_nome: 'Maria Santos'
        },
        data_conclusao: '2024-01-15'
      };

      const dados = preencherDadosLaudoExistente(laudo, vistoria);

      expect(dados.nome_moto_aquatica).toBe('Barco Existente');
      expect(dados.proprietario).toBe('João Silva');
      expect(dados.cpf_cnpj).toBe('123.456.789-00');
    });

    it('deve preencher campos vazios com dados da vistoria', () => {
      const laudo = {
        id: 1,
        nome_moto_aquatica: 'Barco Existente',
        proprietario: null,
        cpf_cnpj: '',
        tipo_embarcacao: null
      };

      const vistoria = {
        Embarcacao: {
          nome: 'Barco Novo',
          proprietario_nome: 'Maria Santos',
          proprietario_cpf: '987.654.321-00',
          tipo_embarcacao: 'LANCHA'
        },
        data_conclusao: '2024-01-15'
      };

      const dados = preencherDadosLaudoExistente(laudo, vistoria);

      expect(dados.nome_moto_aquatica).toBe('Barco Existente');
      expect(dados.proprietario).toBe('Maria Santos');
      expect(dados.cpf_cnpj).toBe('987.654.321-00');
      expect(dados.tipo_embarcacao).toBe('LANCHA');
    });

    it('deve priorizar dadosAtualizados sobre dados existentes', () => {
      const laudo = {
        id: 1,
        nome_moto_aquatica: 'Barco Existente',
        proprietario: 'João Silva'
      };

      const vistoria = {
        Embarcacao: {
          nome: 'Barco Novo',
          proprietario_nome: 'Maria Santos'
        },
        data_conclusao: '2024-01-15'
      };

      const dadosAtualizados = {
        nome_moto_aquatica: 'Barco Atualizado'
      };

      const dados = preencherDadosLaudoExistente(laudo, vistoria, dadosAtualizados);

      expect(dados.nome_moto_aquatica).toBe('Barco Atualizado');
      expect(dados.proprietario).toBe('João Silva');
    });
  });
});

