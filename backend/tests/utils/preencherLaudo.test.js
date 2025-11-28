const { preencherDadosLaudo, preencherDadosLaudoExistente } = require('../../utils/preencherLaudo');

describe('Preencher Laudo Utils - Testes Adicionais', () => {
  describe('preencherDadosLaudoExistente', () => {
    it('deve preencher dados existentes com informações da vistoria', () => {
      const laudo = {
        nome_embarcacao: 'Boat Original',
        nome_proprietario: 'Cliente Original'
      };

      const vistoria = {
        Embarcacao: {
          nome: 'Boat Updated',
          Cliente: {
            nome: 'Cliente Updated'
          }
        }
      };

      const resultado = preencherDadosLaudoExistente(laudo, vistoria);

      expect(resultado).toBeDefined();
      expect(typeof resultado).toBe('object');
    });

    it('deve preservar dados existentes quando vistoria não tem informações', () => {
      const laudo = {
        nome_embarcacao: 'Boat Original',
        nome_proprietario: 'Cliente Original'
      };

      const vistoria = {
        Embarcacao: null
      };

      const resultado = preencherDadosLaudoExistente(laudo, vistoria);

      expect(resultado.nome_embarcacao).toBe('Boat Original');
    });

    it('deve lidar com laudo vazio', () => {
      const resultado = preencherDadosLaudoExistente({}, {});

      expect(resultado).toBeDefined();
      expect(typeof resultado).toBe('object');
    });
  });

  describe('preencherDadosLaudo - Casos Adicionais', () => {
    it('deve preencher dados financeiros da embarcação', () => {
      const vistoria = {
        Embarcacao: {
          valor_embarcacao: 50000,
          porte: 'GRANDE'
        }
      };

      const resultado = preencherDadosLaudo(vistoria);

      expect(resultado).toBeDefined();
    });

    it('deve preencher dados de contato do cliente', () => {
      const vistoria = {
        Embarcacao: {
          Cliente: {
            nome: 'Cliente',
            telefone: '+5511999998888',
            email: 'cliente@test.com'
          }
        }
      };

      const resultado = preencherDadosLaudo(vistoria);

      expect(resultado.nome_proprietario).toBe('Cliente');
      expect(resultado.email_proprietario).toBe('cliente@test.com');
    });

    it('deve construir endereço completo com todos os campos', () => {
      const vistoria = {
        Local: {
          logradouro: 'Rua Test',
          numero: '123',
          complemento: 'Apto 10',
          bairro: 'Centro',
          cidade: 'São Paulo',
          estado: 'SP',
          cep: '01234567'
        }
      };

      const resultado = preencherDadosLaudo(vistoria);

      expect(resultado.endereco_local_vistoria).toContain('Rua Test');
      expect(resultado.endereco_local_vistoria).toContain('123');
      expect(resultado.endereco_local_vistoria).toContain('Apto 10');
      expect(resultado.endereco_local_vistoria).toContain('Centro');
      expect(resultado.endereco_local_vistoria).toContain('São Paulo');
      expect(resultado.endereco_local_vistoria).toContain('SP');
      expect(resultado.endereco_local_vistoria).toContain('01234567');
    });

    it('deve lidar com endereço parcial', () => {
      const vistoria = {
        Local: {
          cidade: 'São Paulo',
          estado: 'SP'
        }
      };

      const resultado = preencherDadosLaudo(vistoria);

      expect(resultado.endereco_local_vistoria).toContain('São Paulo');
      expect(resultado.endereco_local_vistoria).toContain('SP');
    });

    it('deve usar Vistoriador quando vistoriador não existe', () => {
      const vistoria = {
        Vistoriador: {
          nome: 'Vistoriador Alt',
          cpf: '11122233344'
        }
      };

      const resultado = preencherDadosLaudo(vistoria);

      expect(resultado.nome_vistoriador).toBe('Vistoriador Alt');
    });

    it('deve priorizar vistoriador sobre Vistoriador', () => {
      const vistoria = {
        vistoriador: {
          nome: 'Vistoriador Principal',
          cpf: '11122233344'
        },
        Vistoriador: {
          nome: 'Vistoriador Alternativo',
          cpf: '99988877766'
        }
      };

      const resultado = preencherDadosLaudo(vistoria);

      expect(resultado.nome_vistoriador).toBe('Vistoriador Principal');
    });
  });
});
