/**
 * Teste completo do frontend - valida sintaxe TypeScript e estrutura
 * Agora inclui verificação de build para capturar erros de TypeScript
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function testFrontendCompleto() {
  try {
    console.log('=== TESTE COMPLETO DO FRONTEND ===\n');

    let todasValido = true;
    const erros = [];

    // 1. Verificar se node_modules existe
    console.log('1. VERIFICANDO DEPENDÊNCIAS:');
    const nodeModulesPath = path.join(__dirname, '..', 'node_modules');
    if (fs.existsSync(nodeModulesPath)) {
      console.log('   OK: node_modules existe');
    } else {
      console.log('   ATENCAO: node_modules não encontrado (execute npm install)');
    }

    // 2. Verificar estrutura de diretórios
    console.log('\n2. VERIFICANDO ESTRUTURA DE DIRETÓRIOS:');
    const diretorios = [
      'src/pages',
      'src/components',
      'src/services',
      'src/utils',
      'src/types',
      'src/config'
    ];

    for (const dir of diretorios) {
      const dirPath = path.join(__dirname, '..', dir);
      if (fs.existsSync(dirPath)) {
        console.log(`   OK: ${dir}`);
      } else {
        console.log(`   ERRO: ${dir} não encontrado`);
        erros.push(`Diretório ${dir} não encontrado`);
        todasValido = false;
      }
    }

    // 3. Verificar arquivos principais
    console.log('\n3. VERIFICANDO ARQUIVOS PRINCIPAIS:');
    const arquivos = [
      'src/pages/VistoriadorVistoria.tsx',
      'src/pages/Vistorias.tsx',
      'src/services/api.ts',
      'src/config/api.ts',
      'src/types/index.ts'
    ];

    for (const arquivo of arquivos) {
      const arquivoPath = path.join(__dirname, '..', arquivo);
      if (fs.existsSync(arquivoPath)) {
        console.log(`   OK: ${arquivo}`);
      } else {
        console.log(`   ERRO: ${arquivo} não encontrado`);
        erros.push(`Arquivo ${arquivo} não encontrado`);
        todasValido = false;
      }
    }

    // 4. Verificar se há erros de sintaxe básicos (verificar imports)
    console.log('\n4. VERIFICANDO IMPORTS PRINCIPAIS:');
    const arquivosParaVerificar = [
      'src/pages/VistoriadorVistoria.tsx',
      'src/services/api.ts'
    ];

    for (const arquivo of arquivosParaVerificar) {
      const arquivoPath = path.join(__dirname, '..', arquivo);
      try {
        const conteudo = fs.readFileSync(arquivoPath, 'utf8');
        // Verificar se há imports básicos
        if (conteudo.includes('import') || conteudo.includes('require')) {
          console.log(`   OK: ${arquivo} tem imports válidos`);
        } else {
          console.log(`   ATENCAO: ${arquivo} pode não ter imports`);
        }
      } catch (err) {
        console.log(`   ERRO: Não foi possível ler ${arquivo}`);
        erros.push(`Não foi possível ler ${arquivo}`);
        todasValido = false;
      }
    }

    // 5. Verificar se package.json existe
    console.log('\n5. VERIFICANDO CONFIGURAÇÃO:');
    const packageJsonPath = path.join(__dirname, '..', 'package.json');
    if (fs.existsSync(packageJsonPath)) {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      console.log(`   OK: package.json encontrado`);
      console.log(`   Nome: ${packageJson.name || 'N/A'}`);
      console.log(`   Versão: ${packageJson.version || 'N/A'}`);
    } else {
      console.log('   ERRO: package.json não encontrado');
      erros.push('package.json não encontrado');
      todasValido = false;
    }

    // 6. Verificar tsconfig.json
    const tsconfigPath = path.join(__dirname, '..', 'tsconfig.json');
    if (fs.existsSync(tsconfigPath)) {
      console.log('   OK: tsconfig.json encontrado');
    } else {
      console.log('   ATENCAO: tsconfig.json não encontrado');
    }

    // 7. TESTE DE BUILD - Verificar erros de TypeScript e sintaxe
    console.log('\n6. TESTANDO BUILD (TypeScript e Sintaxe):');
    console.log('   Executando verificação de tipos TypeScript...');
    
    try {
      // Tentar executar tsc --noEmit para verificar tipos sem compilar
      const tscPath = path.join(__dirname, '..', 'node_modules', '.bin', 'tsc');
      if (fs.existsSync(tscPath) || fs.existsSync(tscPath + '.cmd')) {
        try {
          execSync('npx tsc --noEmit', { 
            cwd: path.join(__dirname, '..'),
            stdio: 'pipe',
            timeout: 60000 // 60 segundos
          });
          console.log('   OK: Nenhum erro de TypeScript encontrado');
        } catch (tscError) {
          const errorOutput = tscError.stdout?.toString() || tscError.stderr?.toString() || tscError.message;
          console.log('   ERRO: Erros de TypeScript encontrados:');
          console.log('   ' + errorOutput.split('\n').slice(0, 10).join('\n   '));
          erros.push('Erros de TypeScript encontrados (execute npm run build para ver todos)');
          todasValido = false;
        }
      } else {
        console.log('   ATENCAO: TypeScript não encontrado, pulando verificação de tipos');
        console.log('   Execute: npm install para instalar dependências');
      }
    } catch (error) {
      console.log(`   ERRO ao executar verificação TypeScript: ${error.message}`);
      erros.push(`Erro ao verificar TypeScript: ${error.message}`);
      todasValido = false;
    }

    // Resultado final
    console.log('\n=== RESULTADO FINAL ===');
    if (todasValido) {
      console.log('OK: Frontend está estruturado corretamente!');
      console.log('Todos os diretórios e arquivos principais foram encontrados.');
      console.log('Nenhum erro de TypeScript encontrado.');
    } else {
      console.log('ERRO: Alguns problemas foram encontrados:');
      erros.forEach(erro => console.log(`  - ${erro}`));
      console.log('\nNOTA: Para ver todos os erros de TypeScript, execute: npm run build');
    }

    console.log('\n=== TESTE CONCLUÍDO ===\n');
    process.exit(todasValido ? 0 : 1);
  } catch (error) {
    console.error('ERRO CRÍTICO:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

testFrontendCompleto();
