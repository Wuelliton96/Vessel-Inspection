// Configuração global para os testes
process.env.NODE_ENV = 'test';

// Carregar variáveis de ambiente do arquivo .env
const path = require('node:path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

// PROTEÇÃO CRÍTICA: Garantir que TEST_DATABASE_URL está configurado
// Isso previne que testes apaguem dados de produção
if (!process.env.TEST_DATABASE_URL && !process.env.DATABASE_URL) {
  throw new Error(
    'ERRO CRITICO: TEST_DATABASE_URL ou DATABASE_URL deve ser configurada para testes!\n' +
    'Configure TEST_DATABASE_URL com um banco de dados SEPARADO para testes.\n' +
    'NUNCA use o banco de produção em testes!'
  );
}

// Aviso se estiver usando DATABASE_URL em vez de TEST_DATABASE_URL
if (!process.env.TEST_DATABASE_URL && process.env.DATABASE_URL) {
  console.warn(
    'AVISO: Usando DATABASE_URL em vez de TEST_DATABASE_URL.\n' +
    'Recomendado: Configure TEST_DATABASE_URL com um banco de teste separado.'
  );
}

// Configurar timeout para operações de banco de dados
jest.setTimeout(60000);

// Sincronização global do banco de dados antes de todos os testes
// Usar uma Promise global para garantir que a sincronização aconteça apenas uma vez
let dbSyncPromise = null;
let dbSynced = false;

const syncDatabase = async () => {
  if (dbSynced) {
    return true;
  }
  
  if (dbSyncPromise) {
    return dbSyncPromise;
  }
  
  dbSyncPromise = (async () => {
    const { sequelize } = require('../models');
    
    try {
      // Autenticar conexão com timeout
      const authPromise = sequelize.authenticate();
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout na autenticação do banco')), 10000)
      );
      
      await Promise.race([authPromise, timeoutPromise]);
      console.log('[SETUP] Conexão com banco de dados autenticada');
      
      // Tentar sincronização sem opções primeiro (mais seguro) com timeout
      console.log('[SETUP] Iniciando sincronização do banco de dados...');
      try {
        const syncPromise = sequelize.sync();
        const syncTimeout = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout na sincronização')), 30000)
        );
        
        await Promise.race([syncPromise, syncTimeout]);
        console.log('[SETUP] Banco de dados sincronizado');
        dbSynced = true;
        return true;
      } catch (syncError) {
        // Se falhar, tentar com alter
        if (syncError.message.includes('cache lookup failed') || 
            syncError.message.includes('type') || 
            syncError.message.includes('Timeout')) {
          console.log('[SETUP] Erro na sincronização, tentando com alter: true...');
          try {
            const alterPromise = sequelize.sync({ alter: true });
            const alterTimeout = new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Timeout na sincronização com alter')), 30000)
            );
            
            await Promise.race([alterPromise, alterTimeout]);
            console.log('[SETUP] Banco de dados sincronizado com alter: true');
            dbSynced = true;
            return true;
          } catch (alterError) {
            console.warn('[SETUP] Sincronização com alter falhou:', alterError.message);
            // Não tentar force em testes - pode apagar dados
            console.warn('[SETUP] Continuando sem sincronização - assumindo que tabelas já existem');
            dbSynced = true;
            return false;
          }
        } else {
          throw syncError;
        }
      }
    } catch (error) {
      console.error('[SETUP] Erro geral ao sincronizar banco de dados:', error.message);
      // Continuar mesmo se falhar - pode ser que as tabelas já existam
      console.warn('[SETUP] Continuando mesmo com erro - tabelas podem já existir');
      dbSynced = true;
      return false;
    }
  })();
  
  return dbSyncPromise;
};

// Executar sincronização antes de todos os testes
// Usar uma abordagem mais tolerante a falhas
beforeAll(async () => {
  // Marcar como tentado para evitar loops infinitos
  if (dbSynced) return;
  
  try {
    // Tentar sincronização com timeout mais curto
    const syncWithTimeout = Promise.race([
      syncDatabase(),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout geral na sincronização')), 45000)
      )
    ]);
    
    const result = await syncWithTimeout;
    if (!result) {
      console.warn('[SETUP] Sincronização retornou false, mas continuando...');
    }
  } catch (error) {
    console.error('[SETUP] Erro na sincronização inicial:', error.message);
    // Marcar como sincronizado mesmo com erro para não tentar novamente
    dbSynced = true;
    // Não lançar erro para não bloquear todos os testes
    // Os testes individuais podem tentar sincronizar novamente se necessário
  }
}, 60000); // Timeout de 60 segundos para sincronização

// Exportar função de sincronização para uso em outros lugares
global.syncTestDatabase = syncDatabase;

// Mock do console para reduzir ruído nos testes (mas manter logs do setup)
// Apenas mockar após a sincronização inicial
let consoleMocked = false;

const mockConsole = () => {
  if (consoleMocked) return;
  consoleMocked = true;
  
  // Manter console original para logs importantes
  const originalConsole = { ...console };
  
  globalThis.console = {
    ...originalConsole,
    log: (...args) => {
      // Manter logs do setup
      if (args[0] && typeof args[0] === 'string' && args[0].includes('[SETUP]')) {
        originalConsole.log(...args);
      }
    },
    warn: (...args) => {
      // Manter warnings do setup
      if (args[0] && typeof args[0] === 'string' && args[0].includes('[SETUP]')) {
        originalConsole.warn(...args);
      }
    },
    error: (...args) => {
      // Sempre mostrar erros
      originalConsole.error(...args);
    },
  };
};

// Mockar console após um pequeno delay para permitir logs do setup
setTimeout(() => {
  mockConsole();
}, 1000);
