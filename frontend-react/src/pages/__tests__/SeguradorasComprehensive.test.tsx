/**
 * Testes para Seguradoras Service
 */

const mockListar = jest.fn();
const mockCriar = jest.fn();
const mockAtualizar = jest.fn();
const mockDeletar = jest.fn();
const mockGetTiposPermitidos = jest.fn();
const mockSetTiposPermitidos = jest.fn();

jest.mock('../../services/api', () => ({
  seguradoraService: {
    listar: () => mockListar(),
    criar: (data: any) => mockCriar(data),
    atualizar: (id: number, data: any) => mockAtualizar(id, data),
    deletar: (id: number) => mockDeletar(id),
    getTiposPermitidos: (id: number) => mockGetTiposPermitidos(id),
    setTiposPermitidos: (id: number, tipos: string[]) => mockSetTiposPermitidos(id, tipos),
  },
}));

const mockSeguradoras = [
  {
    id: 1,
    nome: 'Seguradora ABC',
    ativo: true,
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01',
  },
  {
    id: 2,
    nome: 'Seguradora XYZ',
    ativo: false,
    createdAt: '2024-01-02',
    updatedAt: '2024-01-02',
  },
];

describe('Seguradoras Service Mock', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockListar.mockResolvedValue(mockSeguradoras);
    mockCriar.mockResolvedValue({ id: 3 });
    mockAtualizar.mockResolvedValue({});
    mockDeletar.mockResolvedValue({});
    mockGetTiposPermitidos.mockResolvedValue([
      { tipo_embarcacao: 'LANCHA' },
      { tipo_embarcacao: 'VELEIRO' },
    ]);
    mockSetTiposPermitidos.mockResolvedValue({});
  });

  it('deve chamar listar seguradoras', async () => {
    const { seguradoraService } = require('../../services/api');
    const result = await seguradoraService.listar();
    
    expect(mockListar).toHaveBeenCalled();
    expect(result).toEqual(mockSeguradoras);
  });

  it('deve chamar criar seguradora', async () => {
    const novaSeguradora = { nome: 'Nova Seguradora' };
    const { seguradoraService } = require('../../services/api');
    const result = await seguradoraService.criar(novaSeguradora);
    
    expect(mockCriar).toHaveBeenCalledWith(novaSeguradora);
    expect(result).toEqual({ id: 3 });
  });

  it('deve chamar atualizar seguradora', async () => {
    const dados = { nome: 'Seguradora Atualizada' };
    const { seguradoraService } = require('../../services/api');
    await seguradoraService.atualizar(1, dados);
    
    expect(mockAtualizar).toHaveBeenCalledWith(1, dados);
  });

  it('deve chamar deletar seguradora', async () => {
    const { seguradoraService } = require('../../services/api');
    await seguradoraService.deletar(1);
    
    expect(mockDeletar).toHaveBeenCalledWith(1);
  });

  it('deve buscar tipos permitidos', async () => {
    const { seguradoraService } = require('../../services/api');
    const result = await seguradoraService.getTiposPermitidos(1);
    
    expect(mockGetTiposPermitidos).toHaveBeenCalledWith(1);
    expect(result).toHaveLength(2);
  });

  it('deve definir tipos permitidos', async () => {
    const tipos = ['LANCHA', 'JET_SKI'];
    const { seguradoraService } = require('../../services/api');
    await seguradoraService.setTiposPermitidos(1, tipos);
    
    expect(mockSetTiposPermitidos).toHaveBeenCalledWith(1, tipos);
  });

  it('deve filtrar seguradoras ativas', () => {
    const ativas = mockSeguradoras.filter(s => s.ativo === true);
    expect(ativas.length).toBe(1);
    expect(ativas[0].nome).toBe('Seguradora ABC');
  });

  it('deve filtrar seguradoras inativas', () => {
    const inativas = mockSeguradoras.filter(s => s.ativo === false);
    expect(inativas.length).toBe(1);
    expect(inativas[0].nome).toBe('Seguradora XYZ');
  });

  it('deve lidar com erro ao listar', async () => {
    mockListar.mockRejectedValue(new Error('Erro de conexão'));
    const { seguradoraService } = require('../../services/api');
    
    await expect(seguradoraService.listar()).rejects.toThrow('Erro de conexão');
  });
});

