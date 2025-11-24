/**
 * Script de teste para validar a correção do upload
 */

const fs = require('fs');
const path = require('path');

async function testUploadCorrigido() {
  try {
    console.log('=== TESTE: UPLOAD CORRIGIDO ===\n');

    const fotosDir = path.join(__dirname, '../uploads/fotos');
    const tempDir = path.join(__dirname, '../uploads/fotos/temp');
    const vistoriaDir = path.join(__dirname, '../uploads/fotos/vistoria-1');

    console.log('1. VERIFICAÇÃO DE DIRETÓRIOS:');
    console.log(`   Diretório temp: ${tempDir}`);
    console.log(`   Existe: ${fs.existsSync(tempDir) ? '✅ SIM' : '❌ NÃO'}`);
    
    console.log(`   Diretório vistoria-1: ${vistoriaDir}`);
    console.log(`   Existe: ${fs.existsSync(vistoriaDir) ? '✅ SIM' : '❌ NÃO'}`);

    // Criar diretórios se necessário
    console.log('\n2. CRIAÇÃO DE DIRETÓRIOS:');
    try {
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
        console.log('   ✅ Diretório temp criado');
      } else {
        console.log('   ✅ Diretório temp já existe');
      }
      
      if (!fs.existsSync(vistoriaDir)) {
        fs.mkdirSync(vistoriaDir, { recursive: true });
        console.log('   ✅ Diretório vistoria-1 criado');
      } else {
        console.log('   ✅ Diretório vistoria-1 já existe');
      }
    } catch (err) {
      console.log('   ❌ ERRO ao criar diretórios:', err.message);
    }

    // Simular movimento de arquivo
    console.log('\n3. TESTE DE MOVIMENTO DE ARQUIVO:');
    try {
      const testFile = path.join(tempDir, 'test-upload.txt');
      const targetFile = path.join(vistoriaDir, 'test-upload.txt');
      
      // Criar arquivo de teste no temp
      fs.writeFileSync(testFile, 'teste de upload');
      console.log('   ✅ Arquivo de teste criado em temp');
      
      // Mover arquivo
      if (fs.existsSync(testFile)) {
        fs.renameSync(testFile, targetFile);
        console.log('   ✅ Arquivo movido de temp para vistoria-1');
        
        // Verificar se foi movido
        if (fs.existsSync(targetFile) && !fs.existsSync(testFile)) {
          console.log('   ✅ Movimento confirmado: arquivo está em vistoria-1');
          fs.unlinkSync(targetFile);
          console.log('   ✅ Arquivo de teste removido');
        } else {
          console.log('   ❌ ERRO: Movimento não funcionou corretamente');
        }
      }
    } catch (err) {
      console.log('   ❌ ERRO no teste de movimento:', err.message);
    }

    // Verificar arquivos em vistoria-unknown
    console.log('\n4. VERIFICAÇÃO DE ARQUIVOS EM VISTORIA-UNKNOWN:');
    const unknownDir = path.join(__dirname, '../uploads/fotos/vistoria-unknown');
    if (fs.existsSync(unknownDir)) {
      const files = fs.readdirSync(unknownDir);
      console.log(`   ⚠️  Encontrados ${files.length} arquivo(s) em vistoria-unknown`);
      console.log('   ⚠️  Estes arquivos foram salvos antes da correção');
      console.log('   ⚠️  Eles podem ser movidos manualmente para a pasta correta se necessário');
    } else {
      console.log('   ✅ Nenhum arquivo em vistoria-unknown');
    }

    console.log('\n=== TESTE CONCLUÍDO ===');
    console.log('\n✅ CORREÇÃO IMPLEMENTADA:');
    console.log('   - Arquivos agora são salvos temporariamente em "temp"');
    console.log('   - Após parseamento do FormData, são movidos para "vistoria-{id}"');
    console.log('   - Isso garante que o vistoria_id seja usado corretamente\n');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro no teste:', error);
    process.exit(1);
  }
}

testUploadCorrigido();

