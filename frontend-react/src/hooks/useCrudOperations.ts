/**
 * Hook para operacoes CRUD seguras
 * Fornece tratamento padronizado de erros para criar, atualizar e excluir
 */

import { useState, useCallback } from 'react';

interface CrudState {
  loading: boolean;
  error: string | null;
  success: string | null;
}

interface CrudOptions {
  onSuccess?: (message: string) => void;
  onError?: (error: string) => void;
  successDuration?: number;
  timeout?: number;
}

interface CrudResult<T> {
  data: T | null;
  success: boolean;
  error: string | null;
}

export function useCrudOperations(options: CrudOptions = {}) {
  const {
    onSuccess,
    onError,
    successDuration = 3000,
    timeout = 30000
  } = options;

  const [state, setState] = useState<CrudState>({
    loading: false,
    error: null,
    success: null
  });

  // Limpar mensagens
  const clearMessages = useCallback(() => {
    setState(prev => ({ ...prev, error: null, success: null }));
  }, []);

  // Executar operacao com tratamento de erros
  const executeOperation = useCallback(async <T>(
    operation: () => Promise<T>,
    successMessage: string
  ): Promise<CrudResult<T>> => {
    setState({ loading: true, error: null, success: null });

    try {
      // Criar promise com timeout
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Tempo limite excedido. Tente novamente.')), timeout);
      });

      const result = await Promise.race([operation(), timeoutPromise]);

      setState({ loading: false, error: null, success: successMessage });
      onSuccess?.(successMessage);

      // Limpar mensagem de sucesso apos o tempo definido
      if (successDuration > 0) {
        setTimeout(() => {
          setState(prev => ({ ...prev, success: null }));
        }, successDuration);
      }

      return { data: result, success: true, error: null };
    } catch (err: any) {
      const errorMessage = extractErrorMessage(err);
      setState({ loading: false, error: errorMessage, success: null });
      onError?.(errorMessage);
      return { data: null, success: false, error: errorMessage };
    }
  }, [timeout, successDuration, onSuccess, onError]);

  // Criar registro
  const create = useCallback(async <T>(
    createFn: () => Promise<T>,
    entityName: string = 'Registro'
  ): Promise<CrudResult<T>> => {
    return executeOperation(createFn, `${entityName} criado(a) com sucesso!`);
  }, [executeOperation]);

  // Atualizar registro
  const update = useCallback(async <T>(
    updateFn: () => Promise<T>,
    entityName: string = 'Registro'
  ): Promise<CrudResult<T>> => {
    return executeOperation(updateFn, `${entityName} atualizado(a) com sucesso!`);
  }, [executeOperation]);

  // Excluir registro
  const remove = useCallback(async <T>(
    deleteFn: () => Promise<T>,
    entityName: string = 'Registro'
  ): Promise<CrudResult<T>> => {
    return executeOperation(deleteFn, `${entityName} excluido(a) com sucesso!`);
  }, [executeOperation]);

  // Alternar status
  const toggleStatus = useCallback(async <T>(
    toggleFn: () => Promise<T>,
    entityName: string = 'Registro',
    isActive: boolean = true
  ): Promise<CrudResult<T>> => {
    const action = isActive ? 'desativado(a)' : 'ativado(a)';
    return executeOperation(toggleFn, `${entityName} ${action} com sucesso!`);
  }, [executeOperation]);

  return {
    ...state,
    create,
    update,
    remove,
    toggleStatus,
    executeOperation,
    clearMessages,
    isIdle: !state.loading && !state.error && !state.success
  };
}

/**
 * Extrai mensagem de erro de diferentes tipos de erro
 */
function extractErrorMessage(error: any): string {
  // Erro de rede/conexao
  if (!error.response && error.message) {
    if (error.message.includes('Network Error') || error.message.includes('fetch')) {
      return 'Erro de conexao. Verifique sua internet e tente novamente.';
    }
    if (error.message.includes('timeout') || error.message.includes('Tempo limite')) {
      return 'Tempo limite excedido. O servidor pode estar lento. Tente novamente.';
    }
    return error.message;
  }

  // Erro do backend
  if (error.response?.data) {
    const backendError = error.response.data;
    
    // Mensagem direta
    if (backendError.message) {
      return backendError.message;
    }
    
    // Campo error
    if (backendError.error) {
      return backendError.error;
    }
    
    // Detalhes de validacao
    if (backendError.details && Array.isArray(backendError.details)) {
      const messages = backendError.details.map((d: any) => d.msg || d.message).filter(Boolean);
      if (messages.length > 0) {
        return messages.join('. ');
      }
    }
    
    // Erros de validacao (express-validator)
    if (backendError.errors && Array.isArray(backendError.errors)) {
      const messages = backendError.errors.map((e: any) => e.msg || e.message).filter(Boolean);
      if (messages.length > 0) {
        return messages.join('. ');
      }
    }
  }

  // Erro HTTP padrao
  if (error.response?.status) {
    switch (error.response.status) {
      case 400:
        return 'Dados invalidos. Verifique as informacoes e tente novamente.';
      case 401:
        return 'Sessao expirada. Faca login novamente.';
      case 403:
        return 'Voce nao tem permissao para realizar esta acao.';
      case 404:
        return 'Registro nao encontrado.';
      case 409:
        return 'Conflito: este registro ja existe ou esta em uso.';
      case 422:
        return 'Dados nao puderam ser processados. Verifique as informacoes.';
      case 500:
        return 'Erro interno do servidor. Tente novamente mais tarde.';
      case 502:
      case 503:
      case 504:
        return 'Servidor indisponivel. Tente novamente em alguns minutos.';
      default:
        return `Erro do servidor (${error.response.status}). Tente novamente.`;
    }
  }

  // Fallback
  return 'Erro inesperado. Tente novamente.';
}

/**
 * Hook simplificado para loading de dados
 */
export function useDataLoading<T>(loadFn: () => Promise<T>) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await loadFn();
      setData(result);
      return result;
    } catch (err: any) {
      const errorMessage = extractErrorMessage(err);
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, [loadFn]);

  const reset = useCallback(() => {
    setData(null);
    setLoading(false);
    setError(null);
  }, []);

  return {
    data,
    loading,
    error,
    load,
    reset,
    setData
  };
}

export default useCrudOperations;

