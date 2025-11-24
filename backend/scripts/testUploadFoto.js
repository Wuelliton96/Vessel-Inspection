/**
 * Script de teste para verificar problemas de upload de fotos
 */

const fs = require('fs');
const path = require('path');

async function testUploadFoto() {
  try {
    console.log('=== TESTE: UPLOAD DE FOTOS ===\n');

    // Verificar diretório de uploads
    const uploadsDir = path.join(__dirname, '../uploads');
    const fotosDir = path.join(__dirname, '../uploads/fotos');
    
    console.log('1. VERIFICAÇÃO DE DIRETÓRIOS:');
    console.log(`   Diretório uploads: ${uploadsDir}`);
    console.log(`   Existe: ${fs.existsSync(uploadsDir) ? '✅ SIM' : '❌ NÃO'}`);
    
    console.log(`   Diretório fotos: ${fotosDir}`);
    console.log(`   Existe: ${fs.existsSync(fotosDir) ? '✅ SIM' : '❌ NÃO'}`);

    // Verificar permissões
    console.log('\n2. VERIFICAÇÃO DE PERMISSÕES:');
    try {
      if (fs.existsSync(uploadsDir)) {
        fs.accessSync(uploadsDir, fs.constants.W_OK);
        console.log('   ✅ Permissão de escrita no diretório uploads: OK');
      } else {
        console.log('   ⚠️  Diretório uploads não existe');
      }
      
      if (fs.existsSync(fotosDir)) {
        fs.accessSync(fotosDir, fs.constants.W_OK);
        console.log('   ✅ Permissão de escrita no diretório fotos: OK');
      } else {
        console.log('   ⚠️  Diretório fotos não existe');
      }
    } catch (err) {
      console.log('   ❌ ERRO de permissão:', err.message);
    }

    // Criar diretórios se não existirem
    console.log('\n3. CRIAÇÃO DE DIRETÓRIOS:');
    try {
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
        console.log('   ✅ Diretório uploads criado');
      } else {
        console.log('   ✅ Diretório uploads já existe');
      }
      
      if (!fs.existsSync(fotosDir)) {
        fs.mkdirSync(fotosDir, { recursive: true });
        console.log('   ✅ Diretório fotos criado');
      } else {
        console.log('   ✅ Diretório fotos já existe');
      }
    } catch (err) {
      console.log('   ❌ ERRO ao criar diretórios:', err.message);
    }

    // Testar criação de diretório para uma vistoria específica
    console.log('\n4. TESTE DE CRIAÇÃO DE DIRETÓRIO PARA VISTORIA:');
    const vistoriaId = 1;
    const vistoriaDir = path.join(fotosDir, `vistoria-${vistoriaId}`);
    
    try {
      if (!fs.existsSync(vistoriaDir)) {
        fs.mkdirSync(vistoriaDir, { recursive: true });
        console.log(`   ✅ Diretório vistoria-${vistoriaId} criado: ${vistoriaDir}`);
      } else {
        console.log(`   ✅ Diretório vistoria-${vistoriaId} já existe: ${vistoriaDir}`);
      }
      
      // Testar escrita de arquivo
      const testFile = path.join(vistoriaDir, 'test.txt');
      fs.writeFileSync(testFile, 'teste');
      fs.unlinkSync(testFile);
      console.log('   ✅ Teste de escrita/leitura: OK');
    } catch (err) {
      console.log('   ❌ ERRO ao criar diretório da vistoria:', err.message);
    }

    // Verificar variáveis de ambiente
    console.log('\n5. VARIÁVEIS DE AMBIENTE:');
    console.log(`   UPLOAD_STRATEGY: ${process.env.UPLOAD_STRATEGY || 'local (padrão)'}`);
    
    if (process.env.UPLOAD_STRATEGY === 's3') {
      console.log(`   AWS_S3_BUCKET: ${process.env.AWS_S3_BUCKET || 'NÃO CONFIGURADO'}`);
      console.log(`   AWS_ACCESS_KEY_ID: ${process.env.AWS_ACCESS_KEY_ID ? '✅ CONFIGURADO' : '❌ NÃO CONFIGURADO'}`);
      console.log(`   AWS_SECRET_ACCESS_KEY: ${process.env.AWS_SECRET_ACCESS_KEY ? '✅ CONFIGURADO' : '❌ NÃO CONFIGURADO'}`);
    }

    // Verificar espaço em disco
    console.log('\n6. ESPAÇO EM DISCO:');
    try {
      const stats = fs.statSync(uploadsDir);
      console.log('   ✅ Informações do diretório obtidas');
    } catch (err) {
      console.log('   ⚠️  Não foi possível obter informações do diretório');
    }

    // Listar vistorias existentes
    console.log('\n7. VISTORIAS COM FOTOS:');
    try {
      if (fs.existsSync(fotosDir)) {
        const vistorias = fs.readdirSync(fotosDir, { withFileTypes: true })
          .filter(dirent => dirent.isDirectory())
          .map(dirent => dirent.name);
        
        if (vistorias.length > 0) {
          console.log(`   ✅ Encontradas ${vistorias.length} pasta(s) de vistoria:`);
          vistorias.forEach(v => {
            const vDir = path.join(fotosDir, v);
            const files = fs.readdirSync(vDir).length;
            console.log(`      - ${v}: ${files} arquivo(s)`);
          });
        } else {
          console.log('   ⚠️  Nenhuma pasta de vistoria encontrada');
        }
      }
    } catch (err) {
      console.log('   ❌ ERRO ao listar vistorias:', err.message);
    }

    console.log('\n=== TESTE CONCLUÍDO ===\n');
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro no teste:', error);
    process.exit(1);
  }
}

testUploadFoto();

