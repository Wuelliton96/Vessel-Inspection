// Script completo para testar upload de foto
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');
const { S3Client, ListObjectsV2Command, GetObjectCommand } = require('@aws-sdk/client-s3');
const { s3Client, bucket } = require('../config/aws');
const sequelize = require('../config/database');
const { Foto, Vistoria, VistoriaChecklistItem, TipoFotoChecklist, Usuario } = require('../models');

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';
const UPLOAD_STRATEGY = process.env.UPLOAD_STRATEGY || 'local';

async function testUploadCompleto() {
  console.log('=== TESTE COMPLETO DE UPLOAD DE FOTO ===\n');
  console.log(`Estratégia: ${UPLOAD_STRATEGY.toUpperCase()}`);
  console.log(`API Base URL: ${API_BASE_URL}\n`);
  
  try {
    await sequelize.authenticate();
    console.log('✓ Conexão com banco estabelecida\n');
    
    // 1. Verificar backend
    console.log('1. Verificando se o backend está rodando...');
    try {
      const healthCheck = await axios.get(`${API_BASE_URL}/health`, { timeout: 5000 });
      console.log('✓ Backend está rodando\n');
    } catch (error) {
      console.error('✗ Backend não está rodando. Inicie o servidor com: npm run dev\n');
      process.exit(1);
    }
    
    // 2. Buscar dados do banco
    console.log('2. Buscando dados do banco...');
    const vistoria = await Vistoria.findOne({
      include: [{
        model: VistoriaChecklistItem,
        as: 'checklistItens',
        where: { status: 'PENDENTE' },
        required: false
      }]
    });
    
    if (!vistoria) {
      console.error('✗ Nenhuma vistoria encontrada.');
      process.exit(1);
    }
    
    const tipoFoto = await TipoFotoChecklist.findOne();
    if (!tipoFoto) {
      console.error('✗ Nenhum tipo de foto encontrado.');
      process.exit(1);
    }
    
    const usuario = await Usuario.findOne({ where: { ativo: true } });
    if (!usuario) {
      console.error('✗ Nenhum usuário encontrado.');
      process.exit(1);
    }
    
    console.log(`✓ Vistoria: ID ${vistoria.id}`);
    console.log(`✓ Tipo Foto: ${tipoFoto.nome_exibicao} (ID: ${tipoFoto.id})`);
    console.log(`✓ Usuário: ${usuario.nome} (CPF: ${usuario.cpf})`);
    console.log(`✓ Itens de checklist pendentes: ${vistoria.checklistItens?.length || 0}\n`);
    
    // 3. Fazer login
    console.log('3. Fazendo login...');
    const senhasComuns = ['123456', 'senha123', 'admin123', '1234', 'senha'];
    let token = null;
    
    for (const senha of senhasComuns) {
      try {
        const loginResponse = await axios.post(`${API_BASE_URL}/api/auth/login`, {
          cpf: usuario.cpf,
          senha: senha
        });
        
        token = loginResponse.data.token;
        console.log('✓ Login realizado com sucesso\n');
        break;
      } catch (error) {
        // Continuar tentando
      }
    }
    
    if (!token) {
      console.error('✗ Não foi possível fazer login automaticamente.');
      console.log('  Por favor, forneça um token via TOKEN=seu_token node backend/scripts/testUploadCompleto.js\n');
      process.exit(1);
    }
    
    // 4. Criar imagem de teste
    console.log('4. Criando imagem de teste...');
    const testImagePath = path.join(__dirname, '../uploads/test-upload.jpg');
    const uploadDir = path.dirname(testImagePath);
    
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    // Criar uma imagem JPEG válida mínima
    const jpegHeader = Buffer.from([
      0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0x00, 0x01, 0x01, 0x01, 0x00, 0x48,
      0x00, 0x48, 0x00, 0x00, 0xFF, 0xDB, 0x00, 0x43, 0x00, 0x08, 0x06, 0x06, 0x07, 0x06, 0x05, 0x08,
      0x07, 0x07, 0x07, 0x09, 0x09, 0x08, 0x0A, 0x0C, 0x14, 0x0D, 0x0C, 0x0B, 0x0B, 0x0C, 0x19, 0x12,
      0x13, 0x0F, 0x14, 0x1D, 0x1A, 0x1F, 0x1E, 0x1D, 0x1A, 0x1C, 0x1C, 0x20, 0x24, 0x2E, 0x27, 0x20,
      0x22, 0x2C, 0x23, 0x1C, 0x1C, 0x28, 0x37, 0x29, 0x2C, 0x30, 0x31, 0x34, 0x34, 0x34, 0x1F, 0x27,
      0x39, 0x3D, 0x38, 0x32, 0x3C, 0x2E, 0x33, 0x34, 0x32, 0xFF, 0xC0, 0x00, 0x0B, 0x08, 0x00, 0x01,
      0x00, 0x01, 0x01, 0x01, 0x11, 0x00, 0xFF, 0xC4, 0x00, 0x14, 0x00, 0x01, 0x00, 0x00, 0x00, 0x00,
      0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x08, 0xFF, 0xC4, 0x00, 0x14,
      0x10, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
      0x00, 0x00, 0xFF, 0xDA, 0x00, 0x08, 0x01, 0x01, 0x00, 0x00, 0x3F, 0x00, 0x40, 0xFF, 0xD9
    ]);
    
    fs.writeFileSync(testImagePath, jpegHeader);
    console.log(`✓ Imagem criada: ${testImagePath} (${jpegHeader.length} bytes)\n`);
    
    // 5. Preparar FormData
    console.log('5. Preparando FormData...');
    const formData = new FormData();
    formData.append('foto', fs.createReadStream(testImagePath), {
      filename: 'test-upload.jpg',
      contentType: 'image/jpeg'
    });
    formData.append('vistoria_id', vistoria.id.toString());
    formData.append('tipo_foto_id', tipoFoto.id.toString());
    formData.append('observacao', 'Foto de teste automatizado');
    
    console.log('  - Vistoria ID:', vistoria.id.toString());
    console.log('  - Tipo Foto ID:', tipoFoto.id.toString());
    console.log('  - Arquivo:', testImagePath);
    console.log('  - Content-Type: image/jpeg\n');
    
    // 6. Contar fotos antes do upload
    console.log('6. Verificando estado inicial...');
    const fotosAntes = await Foto.count({ where: { vistoria_id: vistoria.id } });
    console.log(`  - Fotos no banco antes: ${fotosAntes}`);
    
    if (UPLOAD_STRATEGY === 's3' && bucket) {
      try {
        const listCommand = new ListObjectsV2Command({
          Bucket: bucket,
          Prefix: `vistorias/${vistoria.id}/`
        });
        const listResult = await s3Client.send(listCommand);
        const objetosAntes = listResult.Contents?.length || 0;
        console.log(`  - Objetos no S3 antes: ${objetosAntes}`);
      } catch (error) {
        console.log(`  - Erro ao listar S3: ${error.message}`);
      }
    }
    console.log('');
    
    // 7. Fazer upload
    console.log('7. Fazendo upload da foto via API...');
    let fotoCriada = null;
    let uploadError = null;
    
    try {
      const uploadResponse = await axios.post(`${API_BASE_URL}/api/fotos`, formData, {
        headers: {
          ...formData.getHeaders(),
          Authorization: `Bearer ${token}`
        },
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
        timeout: 30000
      });
      
      fotoCriada = uploadResponse.data;
      console.log('✓ Upload realizado com sucesso!');
      console.log(`  - Status: ${uploadResponse.status}`);
      console.log(`  - Foto ID: ${fotoCriada.id}`);
      console.log(`  - url_arquivo: ${fotoCriada.url_arquivo}`);
      console.log(`  - vistoria_id: ${fotoCriada.vistoria_id}`);
      console.log(`  - tipo_foto_id: ${fotoCriada.tipo_foto_id}`);
      if (fotoCriada.url_completa) {
        console.log(`  - url_completa: ${fotoCriada.url_completa}`);
      }
      console.log('');
      
    } catch (error) {
      uploadError = error;
      console.error('✗ Erro no upload:');
      console.error(`  - Status: ${error.response?.status || 'N/A'}`);
      console.error(`  - Mensagem: ${error.message}`);
      if (error.response?.data) {
        console.error(`  - Resposta:`, JSON.stringify(error.response.data, null, 2));
      }
      console.log('');
    }
    
    // 8. Verificar no banco de dados
    console.log('8. Verificando foto no banco de dados...');
    const fotosDepois = await Foto.count({ where: { vistoria_id: vistoria.id } });
    console.log(`  - Fotos no banco depois: ${fotosDepois}`);
    console.log(`  - Diferença: ${fotosDepois - fotosAntes} foto(s)`);
    
    if (fotoCriada) {
      const fotoNoBanco = await Foto.findByPk(fotoCriada.id);
      if (fotoNoBanco) {
        console.log('\n✓ Foto encontrada no banco:');
        console.log(`  - ID: ${fotoNoBanco.id}`);
        console.log(`  - url_arquivo: ${fotoNoBanco.url_arquivo}`);
        console.log(`  - vistoria_id: ${fotoNoBanco.vistoria_id}`);
        console.log(`  - tipo_foto_id: ${fotoNoBanco.tipo_foto_id}`);
        console.log(`  - observacao: ${fotoNoBanco.observacao || 'null'}`);
        console.log(`  - created_at: ${fotoNoBanco.created_at}`);
        console.log(`  - updated_at: ${fotoNoBanco.updated_at}`);
      } else {
        console.error('\n✗ Foto NÃO encontrada no banco!');
        console.error('  A foto foi retornada pela API mas não foi salva no banco.');
      }
    } else {
      console.log('\n⚠ Upload falhou, verificando se alguma foto foi criada...');
      const ultimaFoto = await Foto.findOne({
        where: { vistoria_id: vistoria.id },
        order: [['created_at', 'DESC']]
      });
      
      if (ultimaFoto && new Date(ultimaFoto.created_at) > new Date(Date.now() - 60000)) {
        console.log('⚠ Uma foto foi criada recentemente:');
        console.log(`  - ID: ${ultimaFoto.id}`);
        console.log(`  - url_arquivo: ${ultimaFoto.url_arquivo}`);
        console.log(`  - created_at: ${ultimaFoto.created_at}`);
      } else {
        console.log('✗ Nenhuma foto recente encontrada.');
      }
    }
    
    // 9. Verificar no S3 (se usando S3)
    if (UPLOAD_STRATEGY === 's3' && bucket && fotoCriada) {
      console.log('\n9. Verificando arquivo no S3...');
      try {
        const s3Key = fotoCriada.url_arquivo;
        const getCommand = new GetObjectCommand({
          Bucket: bucket,
          Key: s3Key
        });
        
        const getResult = await s3Client.send(getCommand);
        console.log('✓ Arquivo encontrado no S3:');
        console.log(`  - Key: ${s3Key}`);
        console.log(`  - ContentType: ${getResult.ContentType}`);
        console.log(`  - ContentLength: ${getResult.ContentLength} bytes`);
        console.log(`  - URL: https://${bucket}.s3.us-east-1.amazonaws.com/${s3Key}`);
        
        // Listar objetos na pasta
        const listCommand = new ListObjectsV2Command({
          Bucket: bucket,
          Prefix: `vistorias/${vistoria.id}/`
        });
        const listResult = await s3Client.send(listCommand);
        const objetos = listResult.Contents || [];
        console.log(`\n  Total de objetos na pasta vistorias/${vistoria.id}/: ${objetos.length}`);
        
      } catch (error) {
        console.error(`✗ Erro ao verificar arquivo no S3: ${error.message}`);
        console.error(`  Key esperada: ${fotoCriada.url_arquivo}`);
      }
    } else if (UPLOAD_STRATEGY === 'local' && fotoCriada) {
      console.log('\n9. Verificando arquivo local...');
      const localPath = path.join(__dirname, '../uploads/fotos', `vistoria-${vistoria.id}`, fotoCriada.url_arquivo);
      if (fs.existsSync(localPath)) {
        const stats = fs.statSync(localPath);
        console.log('✓ Arquivo encontrado localmente:');
        console.log(`  - Caminho: ${localPath}`);
        console.log(`  - Tamanho: ${stats.size} bytes`);
        console.log(`  - Modificado: ${stats.mtime}`);
      } else {
        console.error(`✗ Arquivo NÃO encontrado: ${localPath}`);
      }
    }
    
    // 10. Verificar checklist
    console.log('\n10. Verificando checklist...');
    if (fotoCriada) {
      const itemAtualizado = await VistoriaChecklistItem.findOne({
        where: { foto_id: fotoCriada.id }
      });
      
      if (itemAtualizado) {
        console.log('✓ Item do checklist vinculado:');
        console.log(`  - Item: "${itemAtualizado.nome}" (ID: ${itemAtualizado.id})`);
        console.log(`  - Status: ${itemAtualizado.status}`);
        console.log(`  - Foto ID: ${itemAtualizado.foto_id}`);
        console.log(`  - Concluído em: ${itemAtualizado.concluido_em}`);
      } else {
        console.log('⚠ Nenhum item do checklist foi vinculado à foto');
        console.log('  (Isso pode ser normal se não houver correspondência no mapeamento)');
      }
    }
    
    // 11. Limpar
    console.log('\n11. Limpando arquivo de teste...');
    if (fs.existsSync(testImagePath)) {
      fs.unlinkSync(testImagePath);
      console.log('✓ Arquivo de teste removido');
    }
    
    // 12. Resumo
    console.log('\n========================================');
    console.log('RESUMO DO TESTE');
    console.log('========================================');
    
    if (fotoCriada) {
      const fotoNoBanco = await Foto.findByPk(fotoCriada.id);
      console.log('✓ Upload: SUCESSO');
      console.log(`✓ Banco de dados: ${fotoNoBanco ? 'FOTO SALVA' : 'FOTO NÃO SALVA'}`);
      
      if (UPLOAD_STRATEGY === 's3' && bucket) {
        try {
          const getCommand = new GetObjectCommand({
            Bucket: bucket,
            Key: fotoCriada.url_arquivo
          });
          await s3Client.send(getCommand);
          console.log('✓ S3: ARQUIVO ENCONTRADO');
        } catch {
          console.log('✗ S3: ARQUIVO NÃO ENCONTRADO');
        }
      } else if (UPLOAD_STRATEGY === 'local') {
        const localPath = path.join(__dirname, '../uploads/fotos', `vistoria-${vistoria.id}`, fotoCriada.url_arquivo);
        console.log(`✓ Local: ${fs.existsSync(localPath) ? 'ARQUIVO ENCONTRADO' : 'ARQUIVO NÃO ENCONTRADO'}`);
      }
      
      const itemChecklist = await VistoriaChecklistItem.findOne({
        where: { foto_id: fotoCriada.id }
      });
      console.log(`✓ Checklist: ${itemChecklist ? 'VINCULADO' : 'NÃO VINCULADO'}`);
      
    } else {
      console.log('✗ Upload: FALHOU');
      console.log(`  Erro: ${uploadError?.message || 'Desconhecido'}`);
      if (uploadError?.response?.data) {
        console.log(`  Detalhes: ${JSON.stringify(uploadError.response.data)}`);
      }
    }
    
    console.log('========================================\n');
    
  } catch (error) {
    console.error('\n✗ ERRO CRÍTICO:', error.message);
    if (error.stack) {
      console.error(error.stack);
    }
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

testUploadCompleto();

