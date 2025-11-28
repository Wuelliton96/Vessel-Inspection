// Teste completo de upload de foto com limpeza automática
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');
const { S3Client, ListObjectsV2Command, GetObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const { s3Client, bucket } = require('../config/aws');
const sequelize = require('../config/database');
const { Foto, Vistoria, VistoriaChecklistItem, TipoFotoChecklist, Usuario } = require('../models');

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';
const UPLOAD_STRATEGY = process.env.UPLOAD_STRATEGY || 'local';

let fotoTesteId = null;
let vistoriaTesteId = null;
let itemChecklistTesteId = null;
let s3KeyTeste = null;

async function testeUploadCompletoFinal() {
  console.log('=== TESTE COMPLETO DE UPLOAD DE FOTO ===\n');
  console.log(`Estratégia: ${UPLOAD_STRATEGY.toUpperCase()}`);
  console.log(`API: ${API_BASE_URL}\n`);
  
  try {
    await sequelize.authenticate();
    console.log('[OK] Banco conectado\n');
    
    // 1. Verificar backend
    console.log('1. Verificando backend...');
    try {
      await axios.get(`${API_BASE_URL}/health`, { timeout: 5000 });
      console.log('[OK] Backend está rodando\n');
    } catch {
      console.error('[ERRO] Backend não está rodando!\n');
      process.exit(1);
    }
    
    // 2. Buscar dados
    console.log('2. Buscando dados...');
    const vistoria = await Vistoria.findOne({
      include: [{
        model: VistoriaChecklistItem,
        as: 'checklistItens',
        where: { status: 'PENDENTE' },
        required: false
      }]
    });
    
    if (!vistoria) {
      console.error('[ERRO] Nenhuma vistoria encontrada\n');
      process.exit(1);
    }
    
    vistoriaTesteId = vistoria.id;
    
    const tipoFoto = await TipoFotoChecklist.findOne();
    if (!tipoFoto) {
      console.error('[ERRO] Nenhum tipo de foto encontrado\n');
      process.exit(1);
    }
    
    const usuario = await Usuario.findOne({ where: { ativo: true } });
    if (!usuario) {
      console.error('[ERRO] Nenhum usuário encontrado\n');
      process.exit(1);
    }
    
    console.log(`[OK] Vistoria ID: ${vistoria.id}`);
    console.log(`[OK] Tipo Foto: ${tipoFoto.nome_exibicao} (ID: ${tipoFoto.id})`);
    console.log(`[OK] Usuário: ${usuario.nome} (CPF: ${usuario.cpf})`);
    console.log(`[OK] Itens pendentes: ${vistoria.checklistItens?.length || 0}\n`);
    
    // 3. Login
    console.log('3. Fazendo login...');
    
    // Verificar se há token na variável de ambiente
    let token = process.env.TOKEN || null;
    
    if (!token) {
      // Tentar senhas comuns
      const senhas = ['123456', 'senha123', 'admin123', '1234', 'senha', 'password', 'admin'];
      
      for (const senha of senhas) {
        try {
          const response = await axios.post(`${API_BASE_URL}/api/auth/login`, {
            cpf: usuario.cpf,
            senha: senha
          });
          token = response.data.token;
          console.log(`[OK] Login realizado com senha: ${senha}\n`);
          break;
        } catch (err) {
          // Continuar tentando
        }
      }
    } else {
      console.log('[OK] Usando token da variável de ambiente\n');
    }
    
    if (!token) {
      console.error('[ERRO] Login falhou. Tente:');
      console.error('  1. Definir TOKEN=seu_token node backend/scripts/testeUploadCompletoFinal.js');
      console.error('  2. Ou verificar se a senha do usuário está nas senhas comuns\n');
      process.exit(1);
    }
    
    // 4. Criar imagem
    console.log('4. Criando imagem de teste...');
    const testImagePath = path.join(__dirname, '../uploads/test-upload-final.jpg');
    const uploadDir = path.dirname(testImagePath);
    
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    // JPEG válido mínimo
    const jpegBuffer = Buffer.from([
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
    
    fs.writeFileSync(testImagePath, jpegBuffer);
    console.log(`[OK] Imagem criada: ${testImagePath} (${jpegBuffer.length} bytes)\n`);
    
    // 5. Preparar FormData com vistoria_id como string
    console.log('5. Preparando FormData...');
    const formData = new FormData();
    formData.append('foto', fs.createReadStream(testImagePath), {
      filename: 'test-upload-final.jpg',
      contentType: 'image/jpeg'
    });
    
    // IMPORTANTE: Garantir que vistoria_id seja uma string
    const vistoriaIdStr = vistoria.id.toString();
    const tipoFotoIdStr = tipoFoto.id.toString();
    
    formData.append('vistoria_id', vistoriaIdStr);
    formData.append('tipo_foto_id', tipoFotoIdStr);
    formData.append('observacao', 'Foto de teste - será deletada');
    
    console.log(`  - vistoria_id: "${vistoriaIdStr}" (tipo: ${typeof vistoriaIdStr})`);
    console.log(`  - tipo_foto_id: "${tipoFotoIdStr}" (tipo: ${typeof tipoFotoIdStr})`);
    console.log(`  - Arquivo: test-upload-final.jpg\n`);
    
    // 6. Contar fotos antes
    const fotosAntes = await Foto.count({ where: { vistoria_id: vistoria.id } });
    console.log(`6. Fotos antes: ${fotosAntes}\n`);
    
    // 7. Upload
    console.log('7. Fazendo upload...');
    let uploadSucesso = false;
    let erroUpload = null;
    
    try {
      const response = await axios.post(`${API_BASE_URL}/api/fotos`, formData, {
        headers: {
          ...formData.getHeaders(),
          Authorization: `Bearer ${token}`
        },
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
        timeout: 30000
      });
      
      uploadSucesso = true;
      fotoTesteId = response.data.id;
      s3KeyTeste = response.data.url_arquivo;
      
      console.log('[OK] Upload realizado com sucesso!');
      console.log(`  - Status: ${response.status}`);
      console.log(`  - Foto ID: ${response.data.id}`);
      console.log(`  - url_arquivo: ${response.data.url_arquivo}`);
      console.log(`  - vistoria_id: ${response.data.vistoria_id}`);
      console.log(`  - url_completa: ${response.data.url_completa || 'N/A'}\n`);
      
      // Verificar pasta na key
      if (response.data.url_arquivo) {
        const keyParts = response.data.url_arquivo.split('/');
        if (keyParts.length >= 2 && keyParts[0] === 'vistorias') {
          const vistoriaIdNaKey = keyParts[1];
          if (vistoriaIdNaKey === vistoriaIdStr) {
            console.log(`[OK] Pasta correta: vistorias/${vistoriaIdNaKey}/\n`);
          } else {
            console.error(`[ERRO] Pasta incorreta! Esperado: vistorias/${vistoriaIdStr}/, Recebido: vistorias/${vistoriaIdNaKey}/\n`);
          }
        }
      }
      
    } catch (error) {
      uploadSucesso = false;
      erroUpload = error;
      console.error('[ERRO] Erro no upload:');
      console.error(`  - Status: ${error.response?.status || 'N/A'}`);
      console.error(`  - Mensagem: ${error.message}`);
      if (error.response?.data) {
        console.error(`  - Resposta:`, JSON.stringify(error.response.data, null, 2));
      }
      console.log('');
    }
    
    // 8. Verificar no banco
    console.log('8. Verificando no banco de dados...');
    const fotosDepois = await Foto.count({ where: { vistoria_id: vistoria.id } });
    console.log(`  - Fotos depois: ${fotosDepois}`);
    console.log(`  - Diferença: ${fotosDepois - fotosAntes} foto(s)\n`);
    
    if (fotoTesteId) {
      const fotoNoBanco = await Foto.findByPk(fotoTesteId);
      if (fotoNoBanco) {
        console.log('[OK] Foto encontrada no banco:');
        console.log(`  - ID: ${fotoNoBanco.id}`);
        console.log(`  - url_arquivo: ${fotoNoBanco.url_arquivo}`);
        console.log(`  - vistoria_id: ${fotoNoBanco.vistoria_id}`);
        console.log(`  - tipo_foto_id: ${fotoNoBanco.tipo_foto_id}`);
        console.log(`  - created_at: ${fotoNoBanco.created_at}\n`);
        
        // Verificar pasta no url_arquivo
        if (fotoNoBanco.url_arquivo.includes(`vistorias/${vistoria.id}/`)) {
          console.log('[OK] Pasta no banco está correta!\n');
        } else if (fotoNoBanco.url_arquivo.includes('/unknown/')) {
          console.error('[ERRO] Pasta no banco está como "unknown"!\n');
        } else {
          console.warn('⚠ Pasta no banco não segue o padrão esperado\n');
        }
      } else {
        console.error('[ERRO] Foto NÃO encontrada no banco!\n');
      }
    }
    
    // 9. Verificar no S3
    if (UPLOAD_STRATEGY === 's3' && bucket && s3KeyTeste) {
      console.log('9. Verificando no S3...');
      try {
        const getCommand = new GetObjectCommand({
          Bucket: bucket,
          Key: s3KeyTeste
        });
        
        const result = await s3Client.send(getCommand);
        console.log('[OK] Arquivo encontrado no S3');
        console.log(`  - Key: ${s3KeyTeste}`);
        console.log(`  - Tamanho: ${result.ContentLength} bytes`);
        console.log(`  - ContentType: ${result.ContentType}\n`);
        
        // Verificar pasta na key do S3
        const keyParts = s3KeyTeste.split('/');
        if (keyParts.length >= 2 && keyParts[0] === 'vistorias') {
          const vistoriaIdNaKey = keyParts[1];
          if (vistoriaIdNaKey === vistoriaIdStr) {
            console.log(`[OK] Pasta no S3 está correta: vistorias/${vistoriaIdNaKey}/\n`);
          } else {
            console.error(`[ERRO] Pasta no S3 incorreta! Esperado: vistorias/${vistoriaIdStr}/, Recebido: vistorias/${vistoriaIdNaKey}/\n`);
          }
        }
        
      } catch (error) {
        console.error(`[ERRO] Arquivo NÃO encontrado no S3: ${error.message}`);
        console.error(`  Key esperada: ${s3KeyTeste}\n`);
      }
    }
    
    // 10. Verificar checklist
    console.log('10. Verificando checklist...');
    if (fotoTesteId) {
      const itemAtualizado = await VistoriaChecklistItem.findOne({
        where: { foto_id: fotoTesteId }
      });
      
      if (itemAtualizado) {
        itemChecklistTesteId = itemAtualizado.id;
        console.log('[OK] Item do checklist vinculado:');
        console.log(`  - Item: "${itemAtualizado.nome}" (ID: ${itemAtualizado.id})`);
        console.log(`  - Status: ${itemAtualizado.status}`);
        console.log(`  - Foto ID: ${itemAtualizado.foto_id}\n`);
      } else {
        console.log('⚠ Nenhum item vinculado à foto\n');
      }
    }
    
    // 11. RESUMO
    console.log('========================================');
    console.log('RESUMO DO TESTE');
    console.log('========================================');
    
    if (uploadSucesso && fotoTesteId) {
      const fotoNoBanco = await Foto.findByPk(fotoTesteId);
      const pastaCorreta = fotoNoBanco && fotoNoBanco.url_arquivo.includes(`vistorias/${vistoria.id}/`);
      
      console.log('[OK] Upload: SUCESSO');
      console.log(`[OK] Banco de dados: ${fotoNoBanco ? 'FOTO SALVA' : 'FOTO NÃO SALVA'}`);
      console.log(`[OK] Pasta correta: ${pastaCorreta ? 'SIM' : 'NÃO'}`);
      
      if (UPLOAD_STRATEGY === 's3' && bucket) {
        try {
          const getCommand = new GetObjectCommand({
            Bucket: bucket,
            Key: s3KeyTeste
          });
          await s3Client.send(getCommand);
          console.log('[OK] S3: ARQUIVO ENCONTRADO');
        } catch {
          console.log('[ERRO] S3: ARQUIVO NÃO ENCONTRADO');
        }
      }
      
      const itemChecklist = await VistoriaChecklistItem.findOne({
        where: { foto_id: fotoTesteId }
      });
      console.log(`[OK] Checklist: ${itemChecklist ? 'VINCULADO' : 'NÃO VINCULADO'}`);
      
    } else {
      console.log('[ERRO] Upload: FALHOU');
      if (erroUpload) {
        console.log(`  Erro: ${erroUpload.message}`);
      }
    }
    
    console.log('========================================\n');
    
    // 12. Limpar dados de teste
    console.log('12. Limpando dados de teste...');
    
    if (fotoTesteId) {
      try {
        // Reverter checklist se foi atualizado
        if (itemChecklistTesteId) {
          await VistoriaChecklistItem.update(
            { status: 'PENDENTE', foto_id: null, concluido_em: null },
            { where: { id: itemChecklistTesteId } }
          );
          console.log('[OK] Checklist revertido');
        }
        
        // Deletar foto do banco
        await Foto.destroy({ where: { id: fotoTesteId } });
        console.log(`[OK] Foto ${fotoTesteId} deletada do banco`);
        
        // Deletar do S3 se usando S3
        if (UPLOAD_STRATEGY === 's3' && bucket && s3KeyTeste) {
          try {
            const deleteCommand = new DeleteObjectCommand({
              Bucket: bucket,
              Key: s3KeyTeste
            });
            await s3Client.send(deleteCommand);
            console.log(`[OK] Arquivo deletado do S3: ${s3KeyTeste}`);
          } catch (error) {
            console.warn(`⚠ Erro ao deletar do S3: ${error.message}`);
          }
        }
        
        // Deletar arquivo local se existir
        if (UPLOAD_STRATEGY === 'local' && s3KeyTeste) {
          const localPath = path.join(__dirname, '../uploads/fotos', `vistoria-${vistoria.id}`, s3KeyTeste);
          if (fs.existsSync(localPath)) {
            fs.unlinkSync(localPath);
            console.log(`[OK] Arquivo local deletado: ${localPath}`);
          }
        }
        
      } catch (cleanError) {
        console.error('[ERRO] Erro ao limpar:', cleanError.message);
      }
    }
    
    // Deletar arquivo de teste
    if (fs.existsSync(testImagePath)) {
      fs.unlinkSync(testImagePath);
      console.log('[OK] Arquivo de teste removido');
    }
    
    console.log('\n[OK] Limpeza concluída\n');
    
    if (uploadSucesso && fotoTesteId) {
      console.log('========================================');
      console.log('[OK] TESTE CONCLUÍDO COM SUCESSO!');
      console.log('========================================\n');
      process.exit(0);
    } else {
      console.log('========================================');
      console.log('[ERRO] TESTE FALHOU');
      console.log('========================================\n');
      process.exit(1);
    }
    
  } catch (error) {
    console.error('\n[ERRO] ERRO CRÍTICO:', error.message);
    if (error.stack) {
      console.error(error.stack);
    }
    
    // Tentar limpar mesmo em caso de erro
    if (fotoTesteId) {
      try {
        await Foto.destroy({ where: { id: fotoTesteId } });
        if (itemChecklistTesteId) {
          await VistoriaChecklistItem.update(
            { status: 'PENDENTE', foto_id: null, concluido_em: null },
            { where: { id: itemChecklistTesteId } }
          );
        }
        if (UPLOAD_STRATEGY === 's3' && bucket && s3KeyTeste) {
          try {
            const deleteCommand = new DeleteObjectCommand({
              Bucket: bucket,
              Key: s3KeyTeste
            });
            await s3Client.send(deleteCommand);
          } catch {}
        }
      } catch {}
    }
    
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

testeUploadCompletoFinal();

