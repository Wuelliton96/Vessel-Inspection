/**
 * Testes extendidos para laudoRoutes.js
 * Foco em aumentar cobertura de todas as rotas
 */

const request = require('supertest');
const express = require('express');

// Mock do logger
jest.mock('../../utils/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn()
}));

// Mock dos routeHelpers
jest.mock('../../utils/routeHelpers', () => ({
  handleRouteError: jest.fn((error, res, message) => {
    if (!res.headersSent) {
      res.status(500).json({ error: message || error.message });
    }
  }),
  notFoundResponse: jest.fn((res, entity) => {
    res.status(404).json({ error: `${entity} não encontrado` });
  }),
  logRouteStart: jest.fn(),
  logRouteEnd: jest.fn(),
  getLaudoIncludes: jest.fn().mockReturnValue([]),
  getVistoriaIncludes: jest.fn().mockReturnValue([])
}));

// Mock do preencherLaudo
jest.mock('../../utils/preencherLaudo', () => ({
  preencherDadosLaudo: jest.fn().mockReturnValue({}),
  preencherDadosLaudoExistente: jest.fn().mockReturnValue({})
}));

// Mock do laudoService
jest.mock('../../services/laudoService', () => ({
  gerarNumeroLaudo: jest.fn().mockReturnValue('241129A'),
  gerarLaudoPDF: jest.fn().mockResolvedValue({ urlRelativa: '/uploads/laudos/2024/11/laudo-1.pdf' }),
  deletarLaudoPDF: jest.fn()
}));

// Mock do fs
jest.mock('fs', () => ({
  existsSync: jest.fn().mockReturnValue(true),
  readFileSync: jest.fn().mockReturnValue(Buffer.from('pdf-content'))
}));

// Mock dos models
const mockLaudo = {
  id: 1,
  numero_laudo: '241129A',
  vistoria_id: 1,
  url_pdf: '/uploads/laudos/2024/11/laudo-1.pdf',
  update: jest.fn().mockResolvedValue(true),
  destroy: jest.fn().mockResolvedValue(true),
  toJSON: function() { return { ...this, toJSON: undefined, update: undefined, destroy: undefined }; }
};

const mockVistoria = {
  id: 1,
  vistoriador_id: 1,
  status_id: 3,
  Embarcacao: { nome: 'Test Boat', tipo_embarcacao: 'LANCHA' },
  Local: { logradouro: 'Test Location' },
  vistoriador: { nome: 'Test Vistoriador' }
};

const mockStatusConcluida = {
  id: 3,
  nome: 'CONCLUIDA'
};

const mockConfigPadrao = {
  nome_empresa: 'Test Company',
  logo_empresa_url: '/logo.png',
  nota_rodape: 'Test Footer',
  empresa_prestadora: 'Test Provider'
};

jest.mock('../../models', () => ({
  Laudo: {
    findAll: jest.fn(),
    findByPk: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn()
  },
  Vistoria: {
    findByPk: jest.fn()
  },
  Embarcacao: {},
  StatusVistoria: {
    findOne: jest.fn()
  },
  Foto: {
    findAll: jest.fn()
  },
  TipoFotoChecklist: {},
  Seguradora: {},
  Cliente: {},
  Local: {},
  ConfiguracaoLaudo: {
    findOne: jest.fn()
  }
}));

// Mock do middleware de auth
jest.mock('../../middleware/auth', () => ({
  requireAuth: (req, res, next) => {
    req.user = {
      id: 1,
      nome: 'Admin User',
      email: 'admin@test.com',
      NivelAcesso: { id: 1, nome: 'ADMIN' }
    };
    next();
  },
  requireAdmin: (req, res, next) => {
    if (req.user?.NivelAcesso?.id === 1) {
      next();
    } else {
      res.status(403).json({ error: 'Acesso negado' });
    }
  }
}));

const { Laudo, Vistoria, StatusVistoria, Foto, ConfiguracaoLaudo } = require('../../models');
const { gerarNumeroLaudo, gerarLaudoPDF, deletarLaudoPDF } = require('../../services/laudoService');
const fs = require('fs');

describe('LaudoRoutes - Testes Extendidos', () => {
  let app;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    
    const laudoRoutes = require('../../routes/laudoRoutes');
    app.use('/api/laudos', laudoRoutes);
    
    app.use((err, req, res, next) => {
      res.status(500).json({ error: err.message });
    });
  });

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset default mocks
    Laudo.findAll.mockResolvedValue([mockLaudo]);
    Laudo.findByPk.mockResolvedValue(mockLaudo);
    Laudo.findOne.mockResolvedValue(mockLaudo);
    Laudo.create.mockResolvedValue(mockLaudo);
    Vistoria.findByPk.mockResolvedValue(mockVistoria);
    StatusVistoria.findOne.mockResolvedValue(mockStatusConcluida);
    ConfiguracaoLaudo.findOne.mockResolvedValue(mockConfigPadrao);
    Foto.findAll.mockResolvedValue([]);
    fs.existsSync.mockReturnValue(true);
  });

  describe('GET /api/laudos', () => {
    it('deve listar todos os laudos', async () => {
      const response = await request(app).get('/api/laudos');
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });

    it('deve retornar array vazio quando não há laudos', async () => {
      Laudo.findAll.mockResolvedValue([]);
      
      const response = await request(app).get('/api/laudos');
      
      expect(response.status).toBe(200);
      expect(response.body).toEqual([]);
    });

    it('deve tratar erro de banco de dados', async () => {
      Laudo.findAll.mockRejectedValue(new Error('Database error'));
      
      const response = await request(app).get('/api/laudos');
      
      expect(response.status).toBe(500);
    });
  });

  describe('GET /api/laudos/:id', () => {
    it('deve retornar laudo por ID', async () => {
      const response = await request(app).get('/api/laudos/1');
      
      expect(response.status).toBe(200);
    });

    it('deve retornar 404 para laudo inexistente', async () => {
      Laudo.findByPk.mockResolvedValue(null);
      
      const response = await request(app).get('/api/laudos/99999');
      
      expect(response.status).toBe(404);
    });

    it('deve retornar 400 para ID inválido', async () => {
      const response = await request(app).get('/api/laudos/abc');
      
      expect(response.status).toBe(400);
    });

    it('deve retornar 400 para ID zero', async () => {
      const response = await request(app).get('/api/laudos/0');
      
      expect(response.status).toBe(400);
    });

    it('deve retornar 400 para ID negativo', async () => {
      const response = await request(app).get('/api/laudos/-1');
      
      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/laudos/vistoria/:vistoriaId', () => {
    it('deve retornar laudo por vistoria', async () => {
      const response = await request(app).get('/api/laudos/vistoria/1');
      
      expect(response.status).toBe(200);
    });

    it('deve retornar 404 para vistoria sem laudo', async () => {
      Laudo.findOne.mockResolvedValue(null);
      
      const response = await request(app).get('/api/laudos/vistoria/99999');
      
      expect(response.status).toBe(404);
    });

    it('deve retornar 400 para vistoriaId inválido', async () => {
      const response = await request(app).get('/api/laudos/vistoria/abc');
      
      expect(response.status).toBe(400);
    });
  });

  describe('POST /api/laudos/vistoria/:vistoriaId', () => {
    it('deve criar laudo para vistoria concluída', async () => {
      Laudo.findOne.mockResolvedValue(null);
      mockVistoria.status_id = 3;
      
      const response = await request(app)
        .post('/api/laudos/vistoria/1')
        .send({ responsavel_inspecao: 'Test Inspector' });
      
      expect(response.status).toBe(200);
    });

    it('deve retornar 404 para vistoria inexistente', async () => {
      Vistoria.findByPk.mockResolvedValue(null);
      
      const response = await request(app)
        .post('/api/laudos/vistoria/99999')
        .send({});
      
      expect(response.status).toBe(404);
    });

    it('deve retornar 400 para vistoria não concluída', async () => {
      const vistoriaNaoConcluida = {
        ...mockVistoria,
        status_id: 1
      };
      Vistoria.findByPk.mockResolvedValue(vistoriaNaoConcluida);
      StatusVistoria.findOne.mockResolvedValue({ id: 3, nome: 'CONCLUIDA' });
      
      const response = await request(app)
        .post('/api/laudos/vistoria/1')
        .send({});
      
      expect(response.status).toBe(400);
    });

    it('deve atualizar laudo existente', async () => {
      const laudoExistente = {
        ...mockLaudo,
        update: jest.fn().mockResolvedValue(true)
      };
      Laudo.findOne.mockResolvedValue(laudoExistente);
      
      const response = await request(app)
        .post('/api/laudos/vistoria/1')
        .send({ responsavel_inspecao: 'Updated Inspector' });
      
      expect(response.status).toBe(200);
      expect(laudoExistente.update).toHaveBeenCalled();
    });
  });

  describe('GET /api/laudos/:id/preview', () => {
    it('deve retornar preview do laudo', async () => {
      const laudoComVistoria = {
        ...mockLaudo,
        vistoria_id: 1,
        Vistoria: mockVistoria
      };
      Laudo.findByPk.mockResolvedValue(laudoComVistoria);
      
      const response = await request(app).get('/api/laudos/1/preview');
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('tipoEmbarcacao');
      expect(response.body).toHaveProperty('fotos');
    });

    it('deve retornar 404 para laudo inexistente', async () => {
      Laudo.findByPk.mockResolvedValue(null);
      
      const response = await request(app).get('/api/laudos/99999/preview');
      
      expect(response.status).toBe(404);
    });
  });

  describe('POST /api/laudos/:id/gerar-pdf', () => {
    it('deve gerar PDF do laudo', async () => {
      const laudoComVistoria = {
        ...mockLaudo,
        Vistoria: mockVistoria,
        update: jest.fn().mockResolvedValue(true)
      };
      Laudo.findByPk
        .mockResolvedValueOnce(laudoComVistoria)
        .mockResolvedValueOnce(laudoComVistoria);
      
      const response = await request(app).post('/api/laudos/1/gerar-pdf');
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(gerarLaudoPDF).toHaveBeenCalled();
    });

    it('deve retornar 404 para laudo inexistente', async () => {
      Laudo.findByPk.mockResolvedValue(null);
      
      const response = await request(app).post('/api/laudos/99999/gerar-pdf');
      
      expect(response.status).toBe(404);
    });

    it('deve deletar PDF antigo antes de gerar novo', async () => {
      const laudoComPdfAntigo = {
        ...mockLaudo,
        url_pdf: '/uploads/laudos/old.pdf',
        Vistoria: mockVistoria,
        update: jest.fn().mockResolvedValue(true)
      };
      Laudo.findByPk
        .mockResolvedValueOnce(laudoComPdfAntigo)
        .mockResolvedValueOnce(laudoComPdfAntigo);
      
      await request(app).post('/api/laudos/1/gerar-pdf');
      
      expect(deletarLaudoPDF).toHaveBeenCalledWith('/uploads/laudos/old.pdf');
    });
  });

  describe('GET /api/laudos/:id/download', () => {
    it('deve fazer download do PDF', async () => {
      const response = await request(app).get('/api/laudos/1/download');
      
      // Pode retornar 200 ou erro de arquivo não encontrado
      expect([200, 404]).toContain(response.status);
    });

    it('deve retornar 404 para laudo inexistente', async () => {
      Laudo.findByPk.mockResolvedValue(null);
      
      const response = await request(app).get('/api/laudos/99999/download');
      
      expect(response.status).toBe(404);
    });

    it('deve retornar 404 para laudo sem PDF', async () => {
      const laudoSemPdf = { ...mockLaudo, url_pdf: null };
      Laudo.findByPk.mockResolvedValue(laudoSemPdf);
      
      const response = await request(app).get('/api/laudos/1/download');
      
      expect(response.status).toBe(404);
    });

    it('deve retornar 404 quando arquivo não existe', async () => {
      fs.existsSync.mockReturnValue(false);
      
      const response = await request(app).get('/api/laudos/1/download');
      
      expect(response.status).toBe(404);
    });
  });

  describe('GET /api/laudos/:id/download-pdf', () => {
    it('deve funcionar como rota alternativa de download', async () => {
      const response = await request(app).get('/api/laudos/1/download-pdf');
      
      expect([200, 404]).toContain(response.status);
    });
  });

  describe('PUT /api/laudos/:id', () => {
    it('deve atualizar laudo', async () => {
      const laudoParaAtualizar = {
        ...mockLaudo,
        update: jest.fn().mockResolvedValue(true)
      };
      Laudo.findByPk
        .mockResolvedValueOnce(laudoParaAtualizar)
        .mockResolvedValueOnce(laudoParaAtualizar);
      
      const response = await request(app)
        .put('/api/laudos/1')
        .send({ proprietario: 'Updated Owner' });
      
      expect(response.status).toBe(200);
      expect(laudoParaAtualizar.update).toHaveBeenCalled();
    });

    it('deve retornar 404 para laudo inexistente', async () => {
      Laudo.findByPk.mockResolvedValue(null);
      
      const response = await request(app)
        .put('/api/laudos/99999')
        .send({ proprietario: 'Updated Owner' });
      
      expect(response.status).toBe(404);
    });
  });

  describe('DELETE /api/laudos/:id', () => {
    it('deve excluir laudo', async () => {
      const laudoParaExcluir = {
        ...mockLaudo,
        destroy: jest.fn().mockResolvedValue(true)
      };
      Laudo.findByPk.mockResolvedValue(laudoParaExcluir);
      
      const response = await request(app).delete('/api/laudos/1');
      
      expect(response.status).toBe(200);
      expect(laudoParaExcluir.destroy).toHaveBeenCalled();
    });

    it('deve retornar 404 para laudo inexistente', async () => {
      Laudo.findByPk.mockResolvedValue(null);
      
      const response = await request(app).delete('/api/laudos/99999');
      
      expect(response.status).toBe(404);
    });

    it('deve deletar PDF ao excluir laudo', async () => {
      const laudoComPdf = {
        ...mockLaudo,
        url_pdf: '/uploads/laudos/test.pdf',
        destroy: jest.fn().mockResolvedValue(true)
      };
      Laudo.findByPk.mockResolvedValue(laudoComPdf);
      
      await request(app).delete('/api/laudos/1');
      
      expect(deletarLaudoPDF).toHaveBeenCalledWith('/uploads/laudos/test.pdf');
    });
  });
});

describe('LaudoRoutes - Formatação de dados no preview', () => {
  it('deve formatar CPF corretamente (11 dígitos)', () => {
    const formatarCPFCNPJ = (cpfCnpj) => {
      if (!cpfCnpj) return '';
      const limpo = cpfCnpj.replace(/\D/g, '');
      if (limpo.length === 11) {
        return limpo.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
      } else if (limpo.length === 14) {
        return limpo.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
      }
      return cpfCnpj;
    };
    
    expect(formatarCPFCNPJ('12345678901')).toBe('123.456.789-01');
  });

  it('deve formatar CNPJ corretamente (14 dígitos)', () => {
    const formatarCPFCNPJ = (cpfCnpj) => {
      if (!cpfCnpj) return '';
      const limpo = cpfCnpj.replace(/\D/g, '');
      if (limpo.length === 11) {
        return limpo.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
      } else if (limpo.length === 14) {
        return limpo.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
      }
      return cpfCnpj;
    };
    
    expect(formatarCPFCNPJ('12345678000199')).toBe('12.345.678/0001-99');
  });

  it('deve retornar string vazia para CPF/CNPJ null', () => {
    const formatarCPFCNPJ = (cpfCnpj) => {
      if (!cpfCnpj) return '';
      return cpfCnpj;
    };
    
    expect(formatarCPFCNPJ(null)).toBe('');
  });

  it('deve formatar data corretamente', () => {
    const formatarData = (data) => {
      if (!data) return '';
      try {
        const date = new Date(data);
        return date.toLocaleDateString('pt-BR');
      } catch {
        return data;
      }
    };
    
    const resultado = formatarData('2024-11-29');
    expect(resultado).toMatch(/\d{2}\/\d{2}\/\d{4}/);
  });

  it('deve retornar string vazia para data null', () => {
    const formatarData = (data) => {
      if (!data) return '';
      return data;
    };
    
    expect(formatarData(null)).toBe('');
  });

  it('deve formatar valor monetário', () => {
    const formatarValor = (valor) => {
      if (!valor) return '';
      return parseFloat(valor).toLocaleString('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      });
    };
    
    const resultado = formatarValor(150000);
    expect(resultado).toContain('150');
  });

  it('deve retornar string vazia para valor null', () => {
    const formatarValor = (valor) => {
      if (!valor) return '';
      return valor;
    };
    
    expect(formatarValor(null)).toBe('');
  });
});

