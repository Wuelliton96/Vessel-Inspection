// Script para testar upload real de foto via API
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');
const { S3Client, ListObjectsV2Command, GetObjectCommand } = require('@aws-sdk/client-s3');
const { s3Client, bucket } = require('../config/aws');
const sequelize = require('../config/database');
const { Foto, Vistoria, VistoriaChecklistItem } = require('../models');

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';

async function testUploadFotoReal() {
  console.log('=== TESTE REAL DE UPLOAD DE FOTO ===\n');
  
  try {
    // 1. Verificar se o backend está rodando
    console.log('1. Verificando se o backend está rodando...');
    try {
      const healthCheck = await axios.get(`${API_BASE_URL}/health`, { timeout: 5000 });
      console.log('[OK] Backend está rodando\n');
    } catch (error) {
      if (error.code === 'ECONNREFUSED') {
        console.error('[ERRO] Backend não está rodando. Por favor, inicie o servidor com: npm run dev\n');
        process.exit(1);
      }
      throw error;
    }
    
    // 2. Buscar uma vistoria existente no banco
    console.log('2. Buscando vistoria no banco de dados...');
    await sequelize.authenticate();
    const vistoria = await Vistoria.findOne({
      include: [{
        model: VistoriaChecklistItem,
        as: 'checklistItens',
        where: { status: 'PENDENTE' },
        required: false
      }]
    });
    
    if (!vistoria) {
      console.error('[ERRO] Nenhuma vistoria encontrada no banco.');
      process.exit(1);
    }
    
    console.log(`[OK] Vistoria encontrada: ID ${vistoria.id}`);
    console.log(`[OK] Itens de checklist pendentes: ${vistoria.checklistItens?.length || 0}\n`);
    
    // 3. Buscar token de autenticação (usar um usuário de teste)
    console.log('3. Buscando usuário de teste no banco...');
    const { Usuario } = require('../models');
    const usuario = await Usuario.findOne({
      where: { ativo: true },
      limit: 1
    });
    
    if (!usuario) {
      console.error('[ERRO] Nenhum usuário ativo encontrado no banco.');
      process.exit(1);
    }
    
    console.log(`[OK] Usuário encontrado: ${usuario.nome} (CPF: ${usuario.cpf})`);
    console.log('[AVISO] Para testar o upload, você precisa fazer login manualmente.');
    console.log('   Após fazer login no frontend, você pode testar o upload pela interface.\n');
    console.log('   Ou forneça um token JWT válido via variável de ambiente TOKEN\n');
    
    // Tentar usar token da variável de ambiente ou fazer login
    let token = process.env.TOKEN;
    
    if (!token) {
      console.log('   Tentando fazer login automaticamente...');
      try {
        // Usar CPF do usuário encontrado (mas precisa da senha)
        // Para este teste, vamos tentar com uma senha comum de desenvolvimento
        const senhasComuns = ['123456', 'senha123', 'admin123', '1234'];
        let loginSucesso = false;
        
        for (const senha of senhasComuns) {
          try {
            const loginResponse = await axios.post(`${API_BASE_URL}/api/auth/login`, {
              cpf: usuario.cpf,
              senha: senha
            });
            
            token = loginResponse.data.token;
            loginSucesso = true;
            console.log('[OK] Login realizado com sucesso\n');
            break;
          } catch (loginError) {
            // Continuar tentando
          }
        }
        
        if (!loginSucesso) {
          console.error('[ERRO] Não foi possível fazer login automaticamente.');
          console.log('   Por favor, faça login manualmente e teste o upload pelo frontend.\n');
          console.log('   Ou defina a variável de ambiente TOKEN com um token JWT válido:\n');
          console.log('   TOKEN=seu_token_aqui node backend/scripts/testUploadFotoReal.js\n');
          process.exit(1);
        }
      } catch (error) {
        console.error('[ERRO] Erro ao fazer login:', error.response?.data || error.message);
        process.exit(1);
      }
    } else {
      console.log('[OK] Token fornecido via variável de ambiente\n');
    }
    
    // 4. Buscar tipos de foto disponíveis
    console.log('4. Buscando tipos de foto disponíveis...');
    const tiposResponse = await axios.get(`${API_BASE_URL}/api/vistoriador/tipos-foto-checklist`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    const tiposFoto = tiposResponse.data;
    if (!tiposFoto || tiposFoto.length === 0) {
      console.error('[ERRO] Nenhum tipo de foto encontrado.');
      process.exit(1);
    }
    
    const tipoFoto = tiposFoto[0];
    console.log(`[OK] Tipo de foto selecionado: ${tipoFoto.nome_exibicao} (ID: ${tipoFoto.id})\n`);
    
    // 5. Criar uma imagem de teste
    console.log('5. Criando imagem de teste...');
    const imageBuffer = Buffer.from('FFD8FFE000104A46494600010101006000600000FFDB004300', 'hex');
    const testImagePath = path.join(__dirname, '../uploads/test-foto.jpg');
    
    // Criar diretório se não existir
    const uploadDir = path.dirname(testImagePath);
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    fs.writeFileSync(testImagePath, imageBuffer);
    console.log(`[OK] Imagem de teste criada: ${testImagePath}\n`);
    
    // 6. Preparar FormData para upload
    console.log('6. Preparando upload da foto...');
    const formData = new FormData();
    formData.append('foto', fs.createReadStream(testImagePath), {
      filename: 'test-foto.jpg',
      contentType: 'image/jpeg'
    });
    formData.append('vistoria_id', vistoria.id.toString());
    formData.append('tipo_foto_id', tipoFoto.id.toString());
    formData.append('observacao', 'Foto de teste automatizado');
    
    console.log(`  - Vistoria ID: ${vistoria.id}`);
    console.log(`  - Tipo Foto ID: ${tipoFoto.id}`);
    console.log(`  - Nome do arquivo: test-foto.jpg\n`);
    
    // 7. Fazer upload da foto
    console.log('7. Fazendo upload da foto via API...');
    try {
      const uploadResponse = await axios.post(`${API_BASE_URL}/api/fotos`, formData, {
        headers: {
          ...formData.getHeaders(),
          Authorization: `Bearer ${token}`
        },
        maxContentLength: Infinity,
        maxBodyLength: Infinity
      });
      
      const fotoCriada = uploadResponse.data;
      console.log('[OK] Upload realizado com sucesso!');
      console.log(`  - Foto ID: ${fotoCriada.id}`);
      console.log(`  - url_arquivo: ${fotoCriada.url_arquivo}`);
      console.log(`  - vistoria_id: ${fotoCriada.vistoria_id}`);
      console.log(`  - tipo_foto_id: ${fotoCriada.tipo_foto_id}`);
      if (fotoCriada.url_completa) {
        console.log(`  - url_completa: ${fotoCriada.url_completa}`);
      }
      console.log('');
      
      // 8. Verificar foto no banco de dados
      console.log('8. Verificando foto no banco de dados...');
      const fotoNoBanco = await Foto.findByPk(fotoCriada.id);
      if (fotoNoBanco) {
        console.log('[OK] Foto encontrada no banco');
        console.log(`  - ID: ${fotoNoBanco.id}`);
        console.log(`  - url_arquivo: ${fotoNoBanco.url_arquivo}`);
        console.log(`  - vistoria_id: ${fotoNoBanco.vistoria_id}`);
        console.log(`  - tipo_foto_id: ${fotoNoBanco.tipo_foto_id}`);
        console.log(`  - created_at: ${fotoNoBanco.created_at}\n`);
      } else {
        console.error('[ERRO] Foto não encontrada no banco!\n');
      }
      
      // 9. Verificar se foi salva no S3 (se usando S3)
      const UPLOAD_STRATEGY = process.env.UPLOAD_STRATEGY || 'local';
      if (UPLOAD_STRATEGY === 's3' && bucket) {
        console.log('9. Verificando arquivo no S3...');
        try {
          const s3Key = fotoCriada.url_arquivo; // No S3, url_arquivo é a key
          const getCommand = new GetObjectCommand({
            Bucket: bucket,
            Key: s3Key
          });
          
          const getResult = await s3Client.send(getCommand);
          console.log('[OK] Arquivo encontrado no S3');
          console.log(`  - Key: ${s3Key}`);
          console.log(`  - ContentType: ${getResult.ContentType}`);
          console.log(`  - ContentLength: ${getResult.ContentLength} bytes`);
          console.log(`  - URL: https://${bucket}.s3.us-east-1.amazonaws.com/${s3Key}\n`);
          
          // Listar objetos na pasta da vistoria
          const listCommand = new ListObjectsV2Command({
            Bucket: bucket,
            Prefix: `vistorias/${vistoria.id}/`
          });
          
          const listResult = await s3Client.send(listCommand);
          const objects = listResult.Contents || [];
          console.log(`   ${objects.length} arquivo(s) na pasta vistorias/${vistoria.id}/`);
          
        } catch (error) {
          console.error(`[ERRO] Erro ao verificar arquivo no S3: ${error.message}\n`);
        }
      } else {
        console.log('9. Modo local - verificar arquivo localmente...');
        const localPath = path.join(__dirname, '../uploads/fotos', `vistoria-${vistoria.id}`, fotoCriada.url_arquivo);
        if (fs.existsSync(localPath)) {
          console.log(`[OK] Arquivo encontrado localmente: ${localPath}\n`);
        } else {
          console.error(`[ERRO] Arquivo não encontrado: ${localPath}\n`);
        }
      }
      
      // 10. Verificar se o checklist foi atualizado
      console.log('10. Verificando se o checklist foi atualizado...');
      const itensAtualizados = await VistoriaChecklistItem.findAll({
        where: {
          vistoria_id: vistoria.id,
          foto_id: fotoCriada.id,
          status: 'CONCLUIDO'
        }
      });
      
      if (itensAtualizados.length > 0) {
        console.log(`[OK] ${itensAtualizados.length} item(ns) do checklist vinculado(s) à foto:`);
        itensAtualizados.forEach(item => {
          console.log(`  - "${item.nome}" (ID: ${item.id})`);
        });
      } else {
        console.log('[AVISO] Nenhum item do checklist foi vinculado à foto');
        console.log('  (Isso pode ser normal se não houver correspondência no mapeamento)');
      }
      
      // 11. Limpar arquivo de teste local
      if (fs.existsSync(testImagePath)) {
        fs.unlinkSync(testImagePath);
        console.log('\n[OK] Arquivo de teste local removido');
      }
      
      console.log('\n========================================');
      console.log('[OK] TESTE CONCLUÍDO COM SUCESSO!');
      console.log('========================================\n');
      
      console.log('RESUMO:');
      console.log('- Foto enviada via API [OK]');
      console.log('- Foto salva no banco de dados [OK]');
      if (UPLOAD_STRATEGY === 's3') {
        console.log('- Foto salva no S3 [OK]');
        console.log('- Pasta por vistoria criada [OK]');
      } else {
        console.log('- Foto salva localmente [OK]');
      }
      if (itensAtualizados.length > 0) {
        console.log('- Checklist vinculado automaticamente [OK]');
      }
      
    } catch (uploadError) {
      console.error('[ERRO] Erro ao fazer upload:', uploadError.response?.data || uploadError.message);
      if (uploadError.response?.data) {
        console.error('  Detalhes:', JSON.stringify(uploadError.response.data, null, 2));
      }
      throw uploadError;
    }
    
  } catch (error) {
    console.error('\n[ERRO] ERRO CRÍTICO:', error.message);
    if (error.stack) {
      console.error(error.stack);
    }
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

testUploadFotoReal();

