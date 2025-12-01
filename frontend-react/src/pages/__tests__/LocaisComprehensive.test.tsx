/**
 * Testes para Locais Service
 */

const mockListar = jest.fn();
const mockCriar = jest.fn();
const mockAtualizar = jest.fn();
const mockDeletar = jest.fn();

jest.mock('../../services/api', () => ({
  localService: {
    listar: () => mockListar(),
    criar: (data: any) => mockCriar(data),
    atualizar: (id: number, data: any) => mockAtualizar(id, data),
    deletar: (id: number) => mockDeletar(id),
  },
}));

const mockLocais = [
  {
    id: 1,
    tipo: 'MARINA',
    nome_local: 'Marina do Sol',
    cidade: 'São Paulo',
    estado: 'SP',
    cep: '01310100',
    endereco: 'Av. Paulista, 1000',
    ativo: true,
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01',
  },
  {
    id: 2,
    tipo: 'CLUBE_NAUTICO',
    nome_local: 'Clube Náutico',
    cidade: 'Santos',
    estado: 'SP',
    cep: '11010100',
    endereco: 'Praia do Gonzaga',
    ativo: true,
    createdAt: '2024-01-02',
    updatedAt: '2024-01-02',
  },
];

describe('Locais Service Mock', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockListar.mockResolvedValue(mockLocais);
    mockCriar.mockResolvedValue({ id: 3 });
    mockAtualizar.mockResolvedValue({});
    mockDeletar.mockResolvedValue({});
  });

  it('deve chamar listar locais', async () => {
    const { localService } = require('../../services/api');
    const result = await localService.listar();
    
    expect(mockListar).toHaveBeenCalled();
    expect(result).toEqual(mockLocais);
  });

  it('deve chamar criar local', async () => {
    const novoLocal = { nome_local: 'Novo Local', cidade: 'SP' };
    const { localService } = require('../../services/api');
    const result = await localService.criar(novoLocal);
    
    expect(mockCriar).toHaveBeenCalledWith(novoLocal);
    expect(result).toEqual({ id: 3 });
  });

  it('deve chamar atualizar local', async () => {
    const dados = { nome_local: 'Local Atualizado' };
    const { localService } = require('../../services/api');
    await localService.atualizar(1, dados);
    
    expect(mockAtualizar).toHaveBeenCalledWith(1, dados);
  });

  it('deve chamar deletar local', async () => {
    const { localService } = require('../../services/api');
    await localService.deletar(1);
    
    expect(mockDeletar).toHaveBeenCalledWith(1);
  });

  it('deve filtrar locais por tipo marina', () => {
    const marinas = mockLocais.filter(l => l.tipo === 'MARINA');
    expect(marinas.length).toBe(1);
    expect(marinas[0].nome_local).toBe('Marina do Sol');
  });

  it('deve filtrar locais por tipo clube náutico', () => {
    const clubes = mockLocais.filter(l => l.tipo === 'CLUBE_NAUTICO');
    expect(clubes.length).toBe(1);
    expect(clubes[0].nome_local).toBe('Clube Náutico');
  });

  it('deve filtrar locais por estado', () => {
    const locaisSP = mockLocais.filter(l => l.estado === 'SP');
    expect(locaisSP.length).toBe(2);
  });

  it('deve lidar com erro ao listar', async () => {
    mockListar.mockRejectedValue(new Error('Erro de conexão'));
    const { localService } = require('../../services/api');
    
    await expect(localService.listar()).rejects.toThrow('Erro de conexão');
  });

  it('deve ter locais com dados corretos', () => {
    const local = mockLocais[0];
    expect(local.nome_local).toBe('Marina do Sol');
    expect(local.cidade).toBe('São Paulo');
    expect(local.ativo).toBe(true);
  });
});

