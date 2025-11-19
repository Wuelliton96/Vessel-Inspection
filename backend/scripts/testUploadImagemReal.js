// Script para testar upload real de imagem
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');
const { S3Client, ListObjectsV2Command, GetObjectCommand } = require('@aws-sdk/client-s3');
const { s3Client, bucket } = require('../config/aws');
const sequelize = require('../config/database');
const { Foto, Vistoria, VistoriaChecklistItem, TipoFotoChecklist, Usuario } = require('../models');

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
    const uploadDir = path.dirname(testImagePath);
    
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    // Criar uma imagem JPEG mínima válida (header JPEG)
    // Isso cria um JPEG válido de 1x1 pixel
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
          
          const getResult = await s3Client.send(getCommand);
          console.log('✓ Arquivo encontrado no S3');
          console.log(`  - Key: ${s3Key}`);
          console.log(`  - URL: https://${bucket}.s3.us-east-1.amazonaws.com/${s3Key}`);
        } catch (error) {
          console.error(`✗ Erro ao verificar no S3: ${error.message}`);
        }
      }
      
      // 7. Limpar
      if (fs.existsSync(testImagePath)) {
        fs.unlinkSync(testImagePath);
        console.log('\n✓ Arquivo de teste removido');
      }
      
      console.log('\n========================================');
      console.log('✓ TESTE CONCLUÍDO COM SUCESSO!');
      console.log('========================================\n');
      
    } catch (uploadError) {
      console.error('\n✗ Erro no upload:', uploadError.response?.data || uploadError.message);
      if (uploadError.response?.data) {
        console.error('  Detalhes:', JSON.stringify(uploadError.response.data, null, 2));
      }
      throw uploadError;
    }
    
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

testUploadImagemReal();

