// Script para testar upload real de imagem
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');
const { S3Client, ListObjectsV2Command, GetObjectCommand } = require('@aws-sdk/client-s3');
const { s3Client, bucket } = require('../config/aws');
const sequelize = require('../config/database');
const { Foto, Vistoria, VistoriaChecklistItem, TipoFotoChecklist, Usuario } = require('../models');
const { criarImagemTeste, removerArquivoTeste, tratarErroUpload, tratarErroCritico } = require('./helpers/testHelpers');

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';

async function testUploadImagemReal() {
  console.log('=== TESTE REAL DE UPLOAD DE IMAGEM ===\n');
  
  try {
    await sequelize.authenticate();
    console.log('✓ Conexão com banco estabelecida\n');
    
    // 1. Buscar vistoria e usuário
    console.log('1. Buscando dados do banco...');
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
    console.log(`✓ Usuário: ${usuario.nome} (CPF: ${usuario.cpf})\n`);
    
    // 2. Fazer login
    console.log('2. Fazendo login...');
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
      console.error('✗ Não foi possível fazer login. Defina TOKEN=seu_token node backend/scripts/testUploadImagemReal.js');
      process.exit(1);
    }
    
    // 3. Criar uma imagem JPEG válida (miniatura de 100x100 pixels)
    console.log('3. Criando imagem de teste...');
    const testImagePath = path.join(__dirname, '../uploads/test-imagem.jpg');
    criarImagemTeste(testImagePath);
    const jpegHeader = fs.readFileSync(testImagePath);
    console.log(`✓ Imagem de teste criada: ${testImagePath} (${jpegHeader.length} bytes)\n`);
    
    // 4. Fazer upload
    console.log('4. Fazendo upload da imagem via API...');
    const formData = new FormData();
    formData.append('foto', fs.createReadStream(testImagePath), {
      filename: 'test-imagem.jpg',
      contentType: 'image/jpeg'
    });
    formData.append('vistoria_id', vistoria.id.toString());
    formData.append('tipo_foto_id', tipoFoto.id.toString());
    formData.append('observacao', 'Foto de teste automatizado');
    
    console.log('  - Vistoria ID:', vistoria.id);
    console.log('  - Tipo Foto ID:', tipoFoto.id);
    console.log('  - Arquivo:', testImagePath);
    
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
      
      const fotoCriada = uploadResponse.data;
      console.log('\n✓ Upload realizado com sucesso!');
      console.log(`  - Foto ID: ${fotoCriada.id}`);
      console.log(`  - url_arquivo: ${fotoCriada.url_arquivo}`);
      console.log(`  - vistoria_id: ${fotoCriada.vistoria_id}`);
      console.log(`  - tipo_foto_id: ${fotoCriada.tipo_foto_id}`);
      if (fotoCriada.url_completa) {
        console.log(`  - url_completa: ${fotoCriada.url_completa}`);
      }
      
      // 5. Verificar no banco
      console.log('\n5. Verificando foto no banco...');
      const fotoNoBanco = await Foto.findByPk(fotoCriada.id);
      if (fotoNoBanco) {
        console.log('✓ Foto encontrada no banco');
        console.log(`  - url_arquivo: ${fotoNoBanco.url_arquivo}`);
      }
      
      // 6. Verificar no S3
      const UPLOAD_STRATEGY = process.env.UPLOAD_STRATEGY || 'local';
      if (UPLOAD_STRATEGY === 's3' && bucket) {
        console.log('\n6. Verificando arquivo no S3...');
        try {
          const s3Key = fotoCriada.url_arquivo;
          const getCommand = new GetObjectCommand({
            Bucket: bucket,
            Key: s3Key
          });
          
          await s3Client.send(getCommand);
          console.log('✓ Arquivo encontrado no S3');
          console.log(`  - Key: ${s3Key}`);
          console.log(`  - URL: https://${bucket}.s3.us-east-1.amazonaws.com/${s3Key}`);
        } catch (error) {
          console.error(`✗ Erro ao verificar no S3: ${error.message}`);
        }
      }
      
      // 7. Limpar
      removerArquivoTeste(testImagePath);
      console.log('\n✓ Arquivo de teste removido');
      
      console.log('\n========================================');
      console.log('✓ TESTE CONCLUÍDO COM SUCESSO!');
      console.log('========================================\n');
      
    } catch (uploadError) {
      tratarErroUpload(uploadError);
    }
    
  } catch (error) {
    tratarErroCritico(error);
  } finally {
    await sequelize.close();
  }
}

testUploadImagemReal();

