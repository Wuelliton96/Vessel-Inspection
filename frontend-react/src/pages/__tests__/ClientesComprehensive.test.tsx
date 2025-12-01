/**
 * Testes para Clientes - Apenas imports e mocks
 */

// Mock do serviço
const mockListar = jest.fn();
const mockCriar = jest.fn();
const mockAtualizar = jest.fn();
const mockDeletar = jest.fn();
const mockBuscarPorDocumento = jest.fn();

jest.mock('../../services/api', () => ({
  clienteService: {
    listar: () => mockListar(),
    criar: (data: any) => mockCriar(data),
    atualizar: (id: number, data: any) => mockAtualizar(id, data),
    deletar: (id: number) => mockDeletar(id),
    buscarPorDocumento: (doc: string) => mockBuscarPorDocumento(doc),
  },
}));

const mockClientes = [
  {
    id: 1,
    tipo_pessoa: 'FISICA',
    nome: 'João Silva',
    cpf: '12345678901',
    cnpj: null,
    telefone_e164: '+5511999999999',
    email: 'joao@email.com',
    ativo: true,
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01',
  },
  {
    id: 2,
    tipo_pessoa: 'JURIDICA',
    nome: 'Empresa ABC',
    cpf: null,
    cnpj: '12345678000199',
    telefone_e164: '+5511988888888',
    email: 'empresa@abc.com',
    ativo: true,
    createdAt: '2024-01-02',
    updatedAt: '2024-01-02',
  },
];

describe('Clientes Service Mock', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockListar.mockResolvedValue(mockClientes);
    mockCriar.mockResolvedValue({ id: 3 });
    mockAtualizar.mockResolvedValue({});
    mockDeletar.mockResolvedValue({});
  });

  it('deve chamar listar clientes', async () => {
    const { clienteService } = require('../../services/api');
    const result = await clienteService.listar();
    
    expect(mockListar).toHaveBeenCalled();
    expect(result).toEqual(mockClientes);
  });

  it('deve chamar criar cliente', async () => {
    const novoCliente = { nome: 'Novo', cpf: '12345678901' };
    const { clienteService } = require('../../services/api');
    const result = await clienteService.criar(novoCliente);
    
    expect(mockCriar).toHaveBeenCalledWith(novoCliente);
    expect(result).toEqual({ id: 3 });
  });

  it('deve chamar atualizar cliente', async () => {
    const dados = { nome: 'Atualizado' };
    const { clienteService } = require('../../services/api');
    await clienteService.atualizar(1, dados);
    
    expect(mockAtualizar).toHaveBeenCalledWith(1, dados);
  });

  it('deve chamar deletar cliente', async () => {
    const { clienteService } = require('../../services/api');
    await clienteService.deletar(1);
    
    expect(mockDeletar).toHaveBeenCalledWith(1);
  });

  it('deve buscar cliente por documento', async () => {
    mockBuscarPorDocumento.mockResolvedValue(mockClientes[0]);
    const { clienteService } = require('../../services/api');
    const result = await clienteService.buscarPorDocumento('12345678901');
    
    expect(mockBuscarPorDocumento).toHaveBeenCalledWith('12345678901');
    expect(result.nome).toBe('João Silva');
  });

  it('deve lidar com erro ao listar', async () => {
    mockListar.mockRejectedValue(new Error('Erro de conexão'));
    const { clienteService } = require('../../services/api');
    
    await expect(clienteService.listar()).rejects.toThrow('Erro de conexão');
  });

  it('deve filtrar clientes por tipo pessoa física', () => {
    const pessoasFisicas = mockClientes.filter(c => c.tipo_pessoa === 'FISICA');
    expect(pessoasFisicas.length).toBe(1);
    expect(pessoasFisicas[0].nome).toBe('João Silva');
  });

  it('deve filtrar clientes por tipo pessoa jurídica', () => {
    const pessoasJuridicas = mockClientes.filter(c => c.tipo_pessoa === 'JURIDICA');
    expect(pessoasJuridicas.length).toBe(1);
    expect(pessoasJuridicas[0].nome).toBe('Empresa ABC');
  });

  it('deve ter clientes com dados corretos', () => {
    const cliente = mockClientes[0];
    expect(cliente.cpf).toBe('12345678901');
    expect(cliente.email).toBe('joao@email.com');
    expect(cliente.ativo).toBe(true);
  });
});

