import { useEffect, useRef, useCallback } from 'react';

/**
 * Hook para detectar inatividade do usuário e executar uma ação após um tempo determinado
 * @param callback Função a ser executada quando o timeout de inatividade for atingido
 * @param timeout Tempo em milissegundos antes de considerar inatividade (padrão: 2 minutos)
 */
export const useInactivityTimeout = (
  callback: () => void,
  timeout: number = 2 * 60 * 1000 // 2 minutos em milissegundos
) => {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastActivityRef = useRef<number>(Date.now());
  const callbackRef = useRef(callback);

  // Atualizar a referência do callback sempre que mudar
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  const resetTimeout = useCallback(() => {
    lastActivityRef.current = Date.now();
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      const timeSinceLastActivity = Date.now() - lastActivityRef.current;
      
      // Só executa o callback se realmente passou o tempo de inatividade
      if (timeSinceLastActivity >= timeout) {
        callbackRef.current();
      }
    }, timeout);
  }, [timeout]);

  useEffect(() => {
    // Se timeout for Infinity, não fazer nada
    if (timeout === Infinity) {
      return;
    }

    // Eventos que indicam atividade do usuário
    const events = [
      'mousedown',
      'mousemove',
      'keypress',
      'scroll',
      'touchstart',
      'click',
      'keydown'
    ];

    // Iniciar o timeout
    resetTimeout();

    // Adicionar listeners para os eventos
    events.forEach((event) => {
      window.addEventListener(event, resetTimeout, true);
    });

    // Cleanup: remover listeners e limpar timeout
    return () => {
      events.forEach((event) => {
        window.removeEventListener(event, resetTimeout, true);
      });
      
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [resetTimeout, timeout]);
};

