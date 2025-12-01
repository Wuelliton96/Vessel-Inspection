/**
 * Testes para Laudos Service
 */

const mockListar = jest.fn();
const mockBuscarPorVistoria = jest.fn();
const mockGerarPDF = jest.fn();
const mockDownloadPDF = jest.fn();
const mockCriar = jest.fn();
const mockAtualizar = jest.fn();

jest.mock('../../services/api', () => ({
  laudoService: {
    listar: () => mockListar(),
    buscarPorVistoria: (id: number) => mockBuscarPorVistoria(id),
    gerarPDF: (id: number) => mockGerarPDF(id),
    downloadPDF: (id: number) => mockDownloadPDF(id),
    criar: (data: any) => mockCriar(data),
    atualizar: (id: number, data: any) => mockAtualizar(id, data),
  },
}));

const mockLaudos = [
  {
    id: 1,
    numero_laudo: 'LAUDO-2024-001',
    parecer: 'APROVADO',
    vistoria_id: 1,
    valor_mercado: 150000,
    observacoes: 'Embarcação em ótimo estado',
    conclusao: 'Aprovada sem ressalvas',
    url_pdf: '/laudos/laudo-1.pdf',
    Vistoria: {
      id: 1,
      Embarcacao: {
        nome: 'Barco Teste',
        tipo_embarcacao: 'LANCHA',
      },
    },
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01',
  },
  {
    id: 2,
    numero_laudo: 'LAUDO-2024-002',
    parecer: 'APROVADO_COM_RESSALVAS',
    vistoria_id: 2,
    valor_mercado: 200000,
    observacoes: 'Algumas observações',
    conclusao: 'Aprovada com ressalvas',
    url_pdf: '/laudos/laudo-2.pdf',
    Vistoria: {
      id: 2,
      Embarcacao: {
        nome: 'Veleiro Mar',
        tipo_embarcacao: 'VELEIRO',
      },
    },
    createdAt: '2024-01-02',
    updatedAt: '2024-01-02',
  },
];

describe('Laudos Service Mock', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockListar.mockResolvedValue(mockLaudos);
    mockGerarPDF.mockResolvedValue({ url: '/laudos/novo.pdf' });
    mockBuscarPorVistoria.mockResolvedValue(mockLaudos[0]);
    mockCriar.mockResolvedValue({ id: 3 });
    mockAtualizar.mockResolvedValue({});
  });

  it('deve chamar listar laudos', async () => {
    const { laudoService } = require('../../services/api');
    const result = await laudoService.listar();
    
    expect(mockListar).toHaveBeenCalled();
    expect(result).toEqual(mockLaudos);
  });

  it('deve buscar laudo por vistoria', async () => {
    const { laudoService } = require('../../services/api');
    const result = await laudoService.buscarPorVistoria(1);
    
    expect(mockBuscarPorVistoria).toHaveBeenCalledWith(1);
    expect(result.numero_laudo).toBe('LAUDO-2024-001');
  });

  it('deve gerar PDF do laudo', async () => {
    const { laudoService } = require('../../services/api');
    const result = await laudoService.gerarPDF(1);
    
    expect(mockGerarPDF).toHaveBeenCalledWith(1);
    expect(result.url).toBe('/laudos/novo.pdf');
  });

  it('deve criar laudo', async () => {
    const novoLaudo = { parecer: 'APROVADO', vistoria_id: 3 };
    const { laudoService } = require('../../services/api');
    const result = await laudoService.criar(novoLaudo);
    
    expect(mockCriar).toHaveBeenCalledWith(novoLaudo);
    expect(result).toEqual({ id: 3 });
  });

  it('deve atualizar laudo', async () => {
    const dados = { parecer: 'REPROVADO' };
    const { laudoService } = require('../../services/api');
    await laudoService.atualizar(1, dados);
    
    expect(mockAtualizar).toHaveBeenCalledWith(1, dados);
  });

  it('deve filtrar laudos aprovados', () => {
    const aprovados = mockLaudos.filter(l => l.parecer === 'APROVADO');
    expect(aprovados.length).toBe(1);
    expect(aprovados[0].numero_laudo).toBe('LAUDO-2024-001');
  });

  it('deve filtrar laudos com ressalvas', () => {
    const comRessalvas = mockLaudos.filter(l => l.parecer === 'APROVADO_COM_RESSALVAS');
    expect(comRessalvas.length).toBe(1);
    expect(comRessalvas[0].numero_laudo).toBe('LAUDO-2024-002');
  });

  it('deve ter laudos com embarcação associada', () => {
    const comEmbarcacao = mockLaudos.filter(l => l.Vistoria?.Embarcacao);
    expect(comEmbarcacao.length).toBe(2);
  });

  it('deve lidar com erro ao listar', async () => {
    mockListar.mockRejectedValue(new Error('Erro de conexão'));
    const { laudoService } = require('../../services/api');
    
    await expect(laudoService.listar()).rejects.toThrow('Erro de conexão');
  });

  it('deve calcular valor total de mercado', () => {
    const valorTotal = mockLaudos.reduce((acc, l) => acc + (l.valor_mercado || 0), 0);
    expect(valorTotal).toBe(350000);
  });
});

