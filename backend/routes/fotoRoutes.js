// backend/routes/fotoRoutes.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const { Foto, Vistoria, TipoFotoChecklist } = require('../models');
const { requireAuth, requireVistoriador } = require('../middleware/auth');
const { getUploadConfig, getFileUrl, deleteFile, getStorageInfo } = require('../services/uploadService');

// Configurar upload usando o service
const upload = multer(getUploadConfig());

// Log das configurações ao iniciar
const storageInfo = getStorageInfo();
console.log('[FOTO] Configuracoes de Upload:');
console.log(`[FOTO]   - Estrategia: ${storageInfo.strategy}`);
console.log(`[FOTO]   - Tamanho maximo: ${storageInfo.maxFileSize}`);
console.log(`[FOTO]   - Tipos aceitos: ${storageInfo.allowedTypes.join(', ')}`);
console.log(`[FOTO]   - Localizacao: ${storageInfo.location}`);

// Aplicar middleware de autenticação em todas as rotas
router.use(requireAuth, requireVistoriador);

// GET /api/fotos/vistoria/:id - Buscar fotos de uma vistoria
router.get('/vistoria/:id', async (req, res) => {
  try {
    console.log('=== ROTA GET /api/fotos/vistoria/:id ===');
    console.log('ID da vistoria:', req.params.id);
    console.log('Usuário:', req.user?.nome, '(ID:', req.user?.id, ')');
    
    const vistoria = await Vistoria.findByPk(req.params.id);
    if (!vistoria) {
      return res.status(404).json({ error: 'Vistoria não encontrada' });
    }
    
    // Verificar se o usuário pode acessar esta vistoria
    const isAdmin = req.user.NivelAcesso?.id === 1;
    const isOwner = vistoria.vistoriador_id === req.user.id;
    
    if (!isAdmin && !isOwner) {
      return res.status(403).json({ error: 'Acesso negado' });
    }
    
    const fotos = await Foto.findAll({
      where: { vistoria_id: req.params.id },
      include: [
        { model: TipoFotoChecklist, as: 'TipoFotoChecklist' }
      ],
      order: [['created_at', 'ASC']]
    });
    
    console.log('Fotos encontradas:', fotos.length);
    console.log('=== FIM ROTA GET /api/fotos/vistoria/:id ===\n');
    
    res.json(fotos);
  } catch (error) {
    console.error('Erro ao buscar fotos:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// POST /api/fotos - Upload de foto para vistoria
router.post('/', upload.single('foto'), async (req, res) => {
  try {
    console.log('=== ROTA POST /api/fotos ===');
    console.log('Usuário:', req.user?.nome, '(ID:', req.user?.id, ')');
    console.log('Dados recebidos:', req.body);
    console.log('Arquivo:', req.file);
    
    const { vistoria_id, tipo_foto_id, observacao } = req.body;
    
    if (!vistoria_id || !tipo_foto_id) {
      return res.status(400).json({ error: 'Vistoria ID e Tipo Foto ID são obrigatórios' });
    }
    
    if (!req.file) {
      return res.status(400).json({ error: 'Arquivo de foto é obrigatório' });
    }
    
    const vistoria = await Vistoria.findByPk(vistoria_id);
    if (!vistoria) {
      return res.status(404).json({ error: 'Vistoria não encontrada' });
    }
    
    // Verificar se o usuário pode adicionar fotos a esta vistoria
    const isAdmin = req.user.NivelAcesso?.id === 1;
    const isOwner = vistoria.vistoriador_id === req.user.id;
    
    if (!isAdmin && !isOwner) {
      return res.status(403).json({ error: 'Acesso negado' });
    }
    
    const tipoFoto = await TipoFotoChecklist.findByPk(tipo_foto_id);
    if (!tipoFoto) {
      return res.status(404).json({ error: 'Tipo de foto não encontrado' });
    }
    
    // Obter URL da foto (funciona para local ou S3)
    const fileUrl = getFileUrl(req.file);
    
    const foto = await Foto.create({
      url_arquivo: fileUrl,
      observacao: observacao || null,
      vistoria_id: parseInt(vistoria_id),
      tipo_foto_id: parseInt(tipo_foto_id)
    });
    
    console.log('✅ Foto criada com ID:', foto.id);
    console.log('📍 URL:', fileUrl);
    console.log('=== FIM ROTA POST /api/fotos ===\n');
    
    res.status(201).json(foto);
  } catch (error) {
    console.error('Erro ao criar foto:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// DELETE /api/fotos/:id - Excluir foto
router.delete('/:id', async (req, res) => {
  try {
    console.log('=== ROTA DELETE /api/fotos/:id ===');
    console.log('ID da foto:', req.params.id);
    console.log('Usuário:', req.user?.nome, '(ID:', req.user?.id, ')');
    
    const foto = await Foto.findByPk(req.params.id, {
      include: [{ model: Vistoria, as: 'Vistoria' }]
    });
    
    if (!foto) {
      return res.status(404).json({ error: 'Foto não encontrada' });
    }
    
    // Verificar se o usuário pode excluir esta foto
    const isAdmin = req.user.NivelAcesso?.id === 1;
    const isOwner = foto.Vistoria.vistoriador_id === req.user.id;
    
    if (!isAdmin && !isOwner) {
      return res.status(403).json({ error: 'Acesso negado' });
    }
    
    // Deletar arquivo (local ou S3)
    await deleteFile(foto.url_arquivo);
    
    // Deletar registro do banco
    await foto.destroy();
    
    console.log('✅ Foto excluída com sucesso');
    console.log('=== FIM ROTA DELETE /api/fotos/:id ===\n');
    
    res.json({ message: 'Foto excluída com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir foto:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

module.exports = router;

