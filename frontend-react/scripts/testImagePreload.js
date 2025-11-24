/**
 * Teste do sistema de preload de imagens
 */

const fs = require('fs');
const path = require('path');

function testImagePreload() {
  try {
    console.log('=== TESTE DO SISTEMA DE PRELOAD DE IMAGENS ===\n');

    let todasValido = true;
    const erros = [];

    // 1. Verificar se o componente PreloadedImage existe
    console.log('1. VERIFICANDO COMPONENTE PreloadedImage:');
    const preloadedImagePath = path.join(__dirname, '..', 'src', 'components', 'PreloadedImage.tsx');
    if (fs.existsSync(preloadedImagePath)) {
      const conteudo = fs.readFileSync(preloadedImagePath, 'utf8');
      
      // Verificar se tem as funções essenciais
      if (conteudo.includes('preloadImage')) {
        console.log('   OK: Função preloadImage encontrada');
      } else {
        console.log('   ERRO: Função preloadImage não encontrada');
        erros.push('Função preloadImage não encontrada');
        todasValido = false;
      }

      if (conteudo.includes('PreloadedImage')) {
        console.log('   OK: Componente PreloadedImage encontrado');
      } else {
        console.log('   ERRO: Componente PreloadedImage não encontrado');
        erros.push('Componente PreloadedImage não encontrado');
        todasValido = false;
      }

      if (conteudo.includes('useImagePreloader')) {
        console.log('   OK: Hook useImagePreloader encontrado');
      } else {
        console.log('   ATENCAO: Hook useImagePreloader não encontrado (opcional)');
      }
    } else {
      console.log('   ERRO: Arquivo PreloadedImage.tsx não encontrado');
      erros.push('Arquivo PreloadedImage.tsx não encontrado');
      todasValido = false;
    }

    // 2. Verificar se o utilitário imagePreloader existe
    console.log('\n2. VERIFICANDO UTILITÁRIO imagePreloader:');
    const imagePreloaderPath = path.join(__dirname, '..', 'src', 'utils', 'imagePreloader.ts');
    if (fs.existsSync(imagePreloaderPath)) {
      const conteudo = fs.readFileSync(imagePreloaderPath, 'utf8');
      
      if (conteudo.includes('export function preloadImage')) {
        console.log('   OK: Função preloadImage exportada');
      } else {
        console.log('   ERRO: Função preloadImage não exportada');
        erros.push('Função preloadImage não exportada');
        todasValido = false;
      }

      if (conteudo.includes('export function preloadImages')) {
        console.log('   OK: Função preloadImages exportada');
      } else {
        console.log('   ATENCAO: Função preloadImages não encontrada (opcional)');
      }
    } else {
      console.log('   ERRO: Arquivo imagePreloader.ts não encontrado');
      erros.push('Arquivo imagePreloader.ts não encontrado');
      todasValido = false;
    }

    // 3. Verificar se os arquivos estão usando PreloadedImage
    console.log('\n3. VERIFICANDO USO DO PreloadedImage:');
    const arquivosParaVerificar = [
      { path: 'src/pages/FotosVistoria.tsx', nome: 'FotosVistoria' },
      { path: 'src/pages/Fotos.tsx', nome: 'Fotos' },
      { path: 'src/pages/VistoriadorVistoria.tsx', nome: 'VistoriadorVistoria' }
    ];

    for (const arquivo of arquivosParaVerificar) {
      const arquivoPath = path.join(__dirname, '..', arquivo.path);
      if (fs.existsSync(arquivoPath)) {
        const conteudo = fs.readFileSync(arquivoPath, 'utf8');
        
        if (conteudo.includes('PreloadedImage')) {
          console.log(`   OK: ${arquivo.nome} usa PreloadedImage`);
        } else {
          console.log(`   ATENCAO: ${arquivo.nome} não usa PreloadedImage`);
        }

        if (conteudo.includes("import PreloadedImage")) {
          console.log(`   OK: ${arquivo.nome} importa PreloadedImage`);
        } else {
          console.log(`   ERRO: ${arquivo.nome} não importa PreloadedImage`);
          erros.push(`${arquivo.nome} não importa PreloadedImage`);
          todasValido = false;
        }
      } else {
        console.log(`   ERRO: ${arquivo.path} não encontrado`);
        erros.push(`${arquivo.path} não encontrado`);
        todasValido = false;
      }
    }

    // Resultado final
    console.log('\n=== RESULTADO FINAL ===');
    if (todasValido) {
      console.log('OK: Sistema de preload de imagens está implementado corretamente!');
      console.log('Todos os componentes e utilitários foram encontrados.');
      console.log('Os arquivos estão usando PreloadedImage corretamente.');
    } else {
      console.log('ERRO: Alguns problemas foram encontrados:');
      erros.forEach(erro => console.log(`  - ${erro}`));
    }

    console.log('\n=== TESTE CONCLUÍDO ===\n');
    process.exit(todasValido ? 0 : 1);
  } catch (error) {
    console.error('ERRO CRÍTICO:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

testImagePreload();

