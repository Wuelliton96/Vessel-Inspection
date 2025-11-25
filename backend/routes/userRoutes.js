const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { Usuario, NivelAcesso } = require('../models');
const { requireAuth, requireAdmin } = require('../middleware/auth');
const { registrarAuditoria, auditoriaMiddleware, salvarDadosOriginais } = require('../middleware/auditoria');
const { strictRateLimiter, moderateRateLimiter } = require('../middleware/rateLimiting');
const { validarTelefoneE164, converterParaE164, validarEstado, validarCPF, limparCPF } = require('../utils/validators');

router.get('/', requireAuth, requireAdmin, async (req, res) => {
  try {
    const usuarios = await Usuario.findAll({
      include: {
        model: NivelAcesso,
        attributes: ['id', 'nome', 'descricao']
      },
      attributes: ['id', 'nome', 'email', 'cpf', 'nivel_acesso_id', 'ativo', 'telefone_e164', 'estado', 'createdAt', 'updatedAt']
    });

    res.json(usuarios.map(user => ({
      id: user.id,
      nome: user.nome,
      email: user.email,
      cpf: user.cpf,
      nivelAcessoId: user.nivel_acesso_id,
      nivelAcesso: user.NivelAcesso,
      ativo: user.ativo,
      telefone_e164: user.telefone_e164,
      estado: user.estado,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    })));
  } catch (error) {
    console.error('Erro ao listar usuários:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

router.get('/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const usuario = await Usuario.findByPk(req.params.id, {
      include: {
        model: NivelAcesso,
        attributes: ['id', 'nome', 'descricao']
      },
      attributes: ['id', 'nome', 'email', 'cpf', 'ativo', 'telefone_e164', 'estado', 'createdAt', 'updatedAt']
    });

    if (!usuario) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    res.json({
      id: usuario.id,
      nome: usuario.nome,
      email: usuario.email,
      cpf: usuario.cpf,
      nivelAcessoId: usuario.nivel_acesso_id,
      nivelAcesso: usuario.NivelAcesso,
      ativo: usuario.ativo,
      telefone_e164: usuario.telefone_e164,
      estado: usuario.estado,
      createdAt: usuario.createdAt,
      updatedAt: usuario.updatedAt
    });
  } catch (error) {
    console.error('Erro ao obter usuário:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

router.post('/', requireAuth, requireAdmin, moderateRateLimiter, async (req, res) => {
  try {
    const { nome, email, cpf, nivelAcessoId, telefone_e164, estado } = req.body;

    if (!nome || !cpf) {
      return res.status(400).json({ error: 'Nome e CPF são obrigatórios.' });
    }

    // Validar CPF
    const cpfLimpo = limparCPF(cpf);
    if (!validarCPF(cpfLimpo)) {
      return res.status(400).json({ error: 'CPF inválido. Por favor, digite um CPF válido.' });
    }

    // Verificar se CPF já está cadastrado
    const cpfExistente = await Usuario.findOne({ where: { cpf: cpfLimpo } });
    if (cpfExistente) {
      return res.status(400).json({ error: 'Este CPF já está cadastrado no sistema.' });
    }

    // Validar email se fornecido (opcional agora)
    if (email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Formato de email inválido.' });
    }

      // Verificar se email já está cadastrado (se fornecido)
      const emailExistente = await Usuario.findOne({ where: { email: email.toLowerCase() } });
      if (emailExistente) {
      return res.status(400).json({ error: 'Email já cadastrado.' });
      }
    }

    // Validar telefone se fornecido
    let telefoneE164 = null;
    if (telefone_e164) {
      const telefoneConvertido = converterParaE164(telefone_e164);
      if (!validarTelefoneE164(telefoneConvertido)) {
        return res.status(400).json({ error: 'Formato de telefone inválido. Use o formato (11) 99999-8888 ou +5511999998888' });
      }
      telefoneE164 = telefoneConvertido;
    }

    // Validar estado se fornecido
    if (estado && !validarEstado(estado)) {
      return res.status(400).json({ error: 'Estado inválido. Use a sigla do estado (ex: SP, RJ, MG)' });
    }

    const nivelAcesso = await NivelAcesso.findByPk(nivelAcessoId);
    if (!nivelAcesso) {
      return res.status(400).json({ error: 'Nível de acesso não encontrado.' });
    }

    const senhaPadrao = 'mudar123';
    const senhaHash = await bcrypt.hash(senhaPadrao, 10);

    const usuario = await Usuario.create({
      nome,
      email: email ? email.toLowerCase() : null,
      cpf: cpfLimpo,
      senha_hash: senhaHash,
      nivel_acesso_id: nivelAcessoId,
      ativo: true,
      deve_atualizar_senha: true,
      telefone_e164: telefoneE164,
      estado: estado ? estado.toUpperCase() : null
    });

    const usuarioCompleto = await Usuario.findByPk(usuario.id, {
      include: {
        model: NivelAcesso,
        attributes: ['id', 'nome', 'descricao']
      },
      attributes: ['id', 'nome', 'email', 'cpf', 'ativo', 'telefone_e164', 'estado', 'createdAt', 'updatedAt']
    });

    // Registrar auditoria de criação de usuário
    await registrarAuditoria({
      req,
      acao: 'CREATE',
      entidade: 'Usuario',
      entidadeId: usuarioCompleto.id,
      dadosNovos: {
        nome: usuarioCompleto.nome,
        email: usuarioCompleto.email,
        cpf: usuarioCompleto.cpf,
        nivelAcessoId: usuarioCompleto.nivel_acesso_id,
        telefone_e164: usuarioCompleto.telefone_e164,
        estado: usuarioCompleto.estado
      },
      nivelCritico: true,
      detalhes: `Novo usuário criado: ${usuarioCompleto.nome} (CPF: ${usuarioCompleto.cpf})`
    });

    res.status(201).json({
      id: usuarioCompleto.id,
      nome: usuarioCompleto.nome,
      email: usuarioCompleto.email,
      cpf: usuarioCompleto.cpf,
      nivelAcessoId: usuarioCompleto.nivel_acesso_id,
      nivelAcesso: usuarioCompleto.NivelAcesso,
      ativo: usuarioCompleto.ativo,
      telefone_e164: usuarioCompleto.telefone_e164,
      estado: usuarioCompleto.estado,
      createdAt: usuarioCompleto.createdAt,
      updatedAt: usuarioCompleto.updatedAt
    });
  } catch (error) {
    console.error('Erro ao criar usuário:', error);
    
    if (error.name === 'SequelizeUniqueConstraintError') {
      // Verificar qual campo causou o erro de duplicação
      const campo = error.errors && error.errors[0] ? error.errors[0].path : 'campo';
      if (campo === 'cpf') {
        return res.status(400).json({ error: 'Este CPF já está cadastrado no sistema.' });
      } else if (campo === 'email') {
      return res.status(400).json({ error: 'Email já cadastrado.' });
      }
      return res.status(400).json({ error: 'Já existe um registro com este valor.' });
    }
    
    if (error.name === 'SequelizeValidationError') {
      const mensagens = error.errors.map(err => err.message);
      return res.status(400).json({ error: mensagens.join(', ') });
    }
    
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// PUT /api/usuarios/:id - Atualizar usuário (apenas admin)
router.put('/:id', requireAuth, requireAdmin, moderateRateLimiter, salvarDadosOriginais(Usuario), async (req, res) => {
  try {
    const { nome, email, cpf, nivelAcessoId, ativo, telefone_e164, estado } = req.body;
    const userId = req.params.id;

    const usuario = await Usuario.findByPk(userId);
    if (!usuario) {
      return res.status(404).json({ error: 'Usuário não encontrado.' });
    }

    // Validar CPF se fornecido
    let cpfLimpo = null;
    if (cpf !== undefined) {
      if (cpf === null || cpf === '') {
        return res.status(400).json({ error: 'CPF é obrigatório e não pode ser removido.' });
      }
      
      cpfLimpo = limparCPF(cpf);
      if (!validarCPF(cpfLimpo)) {
        return res.status(400).json({ error: 'CPF inválido. Por favor, digite um CPF válido.' });
      }

      // Verificar se CPF já está cadastrado em outro usuário
      const cpfExistente = await Usuario.findOne({ 
        where: { 
          cpf: cpfLimpo,
          id: { [require('sequelize').Op.ne]: userId }
        } 
      });
      if (cpfExistente) {
        return res.status(400).json({ error: 'Este CPF já está cadastrado no sistema.' });
      }
    }

    // Verificar se o email já existe em outro usuário
    if (email !== undefined && email !== null && email !== usuario.email) {
      // Validação de email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (email && !emailRegex.test(email)) {
        return res.status(400).json({ error: 'Formato de email inválido.' });
      }

      if (email) {
      const usuarioExistente = await Usuario.findOne({ 
        where: { 
          email: email.toLowerCase(),
          id: { [require('sequelize').Op.ne]: userId }
        } 
      });
      if (usuarioExistente) {
        return res.status(400).json({ error: 'Email já cadastrado.' });
        }
      }
    }

    // Validar telefone se fornecido
    let telefoneE164 = null;
    if (telefone_e164 !== undefined) {
      if (telefone_e164 === null || telefone_e164 === '') {
        telefoneE164 = null;
      } else {
        const telefoneConvertido = converterParaE164(telefone_e164);
        if (!validarTelefoneE164(telefoneConvertido)) {
          return res.status(400).json({ error: 'Formato de telefone inválido. Use o formato (11) 99999-8888 ou +5511999998888' });
        }
        telefoneE164 = telefoneConvertido;
      }
    }

    // Validar estado se fornecido
    let estadoValidado = null;
    if (estado !== undefined) {
      if (estado === null || estado === '') {
        estadoValidado = null;
      } else if (!validarEstado(estado)) {
        return res.status(400).json({ error: 'Estado inválido. Use a sigla do estado (ex: SP, RJ, MG)' });
      } else {
        estadoValidado = estado.toUpperCase();
      }
    }

    // Verificar se o nível de acesso existe
    if (nivelAcessoId) {
      const nivelAcesso = await NivelAcesso.findByPk(nivelAcessoId);
      if (!nivelAcesso) {
        return res.status(400).json({ error: 'Nível de acesso não encontrado.' });
      }
    }

    // Preparar dados para atualização
    const dadosAtualizacao = {
      nome: nome || usuario.nome,
      nivel_acesso_id: nivelAcessoId || usuario.nivel_acesso_id,
      ativo: ativo !== undefined ? ativo : usuario.ativo
    };

    // Adicionar CPF se fornecido
    if (cpf !== undefined) {
      dadosAtualizacao.cpf = cpfLimpo;
    }

    // Adicionar email se fornecido
    if (email !== undefined) {
      dadosAtualizacao.email = email ? email.toLowerCase() : null;
    } else {
      dadosAtualizacao.email = usuario.email;
    }

    // Adicionar telefone e estado se fornecidos
    if (telefone_e164 !== undefined) {
      dadosAtualizacao.telefone_e164 = telefoneE164;
    }
    if (estado !== undefined) {
      dadosAtualizacao.estado = estadoValidado;
    }

    // Atualizar usuário
    await usuario.update(dadosAtualizacao);

    // Buscar usuário atualizado com associações
    const usuarioAtualizado = await Usuario.findByPk(userId, {
      include: {
        model: NivelAcesso,
        attributes: ['id', 'nome', 'descricao']
      },
      attributes: ['id', 'nome', 'email', 'cpf', 'ativo', 'telefone_e164', 'estado', 'createdAt', 'updatedAt']
    });

    // Registrar auditoria de atualização
    await registrarAuditoria({
      req,
      acao: 'UPDATE',
      entidade: 'Usuario',
      entidadeId: userId,
      dadosAnteriores: req.originalData,
      dadosNovos: {
        nome: usuarioAtualizado.nome,
        email: usuarioAtualizado.email,
        cpf: usuarioAtualizado.cpf,
        nivelAcessoId: usuarioAtualizado.nivel_acesso_id,
        ativo: usuarioAtualizado.ativo,
        telefone_e164: usuarioAtualizado.telefone_e164,
        estado: usuarioAtualizado.estado
      },
      nivelCritico: true,
      detalhes: `Usuário atualizado: ${usuarioAtualizado.nome} (CPF: ${usuarioAtualizado.cpf})`
    });

    res.json({
      id: usuarioAtualizado.id,
      nome: usuarioAtualizado.nome,
      email: usuarioAtualizado.email,
      cpf: usuarioAtualizado.cpf,
      nivelAcessoId: usuarioAtualizado.nivel_acesso_id,
      nivelAcesso: usuarioAtualizado.NivelAcesso,
      ativo: usuarioAtualizado.ativo,
      telefone_e164: usuarioAtualizado.telefone_e164,
      estado: usuarioAtualizado.estado,
      createdAt: usuarioAtualizado.createdAt,
      updatedAt: usuarioAtualizado.updatedAt
    });
  } catch (error) {
    console.error('Erro ao atualizar usuário:', error);
    
    if (error.name === 'SequelizeUniqueConstraintError') {
      // Verificar qual campo causou o erro de duplicação
      const campo = error.errors && error.errors[0] ? error.errors[0].path : 'campo';
      if (campo === 'cpf') {
        return res.status(400).json({ error: 'Este CPF já está cadastrado no sistema.' });
      } else if (campo === 'email') {
      return res.status(400).json({ error: 'Email já cadastrado.' });
      }
      return res.status(400).json({ error: 'Já existe um registro com este valor.' });
    }
    
    if (error.name === 'SequelizeValidationError') {
      const mensagens = error.errors.map(err => err.message);
      return res.status(400).json({ error: mensagens.join(', ') });
    }
    
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// DELETE /api/usuarios/:id - Excluir usuário (soft delete - apenas admin)
router.delete(
  '/:id', 
  requireAuth, 
  requireAdmin, 
  strictRateLimiter, // Rate limiting rigoroso para deleções
  salvarDadosOriginais(Usuario),
  async (req, res) => {
  try {
      const usuarioId = parseInt(req.params.id);
      
      // Proteção 1: Não permitir que o usuário delete a si mesmo
      if (req.user.id === usuarioId) {
        console.warn(`[SEGURANÇA] Usuário ${req.user.email} tentou deletar a si mesmo`);
        return res.status(403).json({ 
          error: 'Operação não permitida',
          message: 'Você não pode deletar sua própria conta. Solicite a outro administrador.' 
        });
      }

      const usuario = await Usuario.findByPk(usuarioId, {
        include: {
          model: NivelAcesso,
          attributes: ['id', 'nome']
        }
      });

    if (!usuario) {
      return res.status(404).json({ error: 'Usuário não encontrado.' });
    }

      // Proteção 2: Não permitir deletar o primeiro admin do sistema (ID 1)
      if (usuarioId === 1) {
        console.error(`[SEGURANÇA] Tentativa de deletar o admin principal (ID: 1) por ${req.user.email}`);
        await registrarAuditoria({
          req,
          acao: 'DELETE_BLOCKED',
          entidade: 'Usuario',
          entidadeId: usuarioId,
          nivelCritico: true,
          detalhes: 'Tentativa bloqueada de deletar o usuário admin principal'
        });
        
        return res.status(403).json({ 
          error: 'Operação bloqueada',
          message: 'O usuário administrador principal não pode ser deletado por segurança do sistema.' 
        });
      }

      // Proteção 3: Verificar se é o último admin do sistema
      if (usuario.NivelAcesso.id === 1) {
        const totalAdmins = await Usuario.count({
          where: { nivel_acesso_id: 1 }
        });

        if (totalAdmins <= 1) {
          console.error(`[SEGURANÇA] Tentativa de deletar o último admin do sistema por ${req.user.email}`);
          await registrarAuditoria({
            req,
            acao: 'DELETE_BLOCKED',
            entidade: 'Usuario',
            entidadeId: usuarioId,
            nivelCritico: true,
            detalhes: 'Tentativa bloqueada de deletar o último administrador do sistema'
          });

          return res.status(403).json({ 
            error: 'Operação bloqueada',
            message: 'Não é possível deletar o último administrador do sistema. Crie outro administrador primeiro.' 
          });
        }
      }

      // Soft delete - apenas marca como deletado, não remove do banco
    await usuario.destroy();

      // Registrar auditoria de deleção
      await registrarAuditoria({
        req,
        acao: 'DELETE',
        entidade: 'Usuario',
        entidadeId: usuarioId,
        dadosAnteriores: req.originalData,
        nivelCritico: true,
        detalhes: `Usuário ${usuario.nome} (${usuario.email}) marcado como deletado`
      });

      console.log(`[SEGURANÇA] Usuário deletado (soft delete): ${usuario.email} por ${req.user.email}`);
      
      res.json({ 
        success: true,
        message: 'Usuário excluído com sucesso.' 
      });
  } catch (error) {
    console.error('Erro ao excluir usuário:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
  }
);

// Função para validar critérios de senha
const validatePassword = (senha) => {
  const errors = [];
  
  if (senha.length < 8) {
    errors.push('Senha deve ter pelo menos 8 caracteres');
  }
  
  if (!/[A-Z]/.test(senha)) {
    errors.push('Senha deve conter pelo menos uma letra maiúscula');
  }
  
  if (!/[a-z]/.test(senha)) {
    errors.push('Senha deve conter pelo menos uma letra minúscula');
  }
  
  if (!/[0-9]/.test(senha)) {
    errors.push('Senha deve conter pelo menos um número');
  }
  
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(senha)) {
    errors.push('Senha deve conter pelo menos um caractere especial');
  }
  
  return {
    isValid: errors.length === 0,
    errors: errors
  };
};

// POST /api/usuarios/:id/reset-password - Redefinir senha (apenas admin)
router.post('/:id/reset-password', requireAuth, requireAdmin, strictRateLimiter, async (req, res) => {
  try {
    const { novaSenha } = req.body;
    const userId = req.params.id;

    if (!novaSenha) {
      return res.status(400).json({ error: 'Nova senha é obrigatória.' });
    }

    // Validar critérios da nova senha
    const senhaValidation = validatePassword(novaSenha);
    if (!senhaValidation.isValid) {
      return res.status(400).json({ 
        error: 'Senha não atende aos critérios',
        details: senhaValidation.errors
      });
    }

    const usuario = await Usuario.findByPk(userId);
    if (!usuario) {
      return res.status(404).json({ error: 'Usuário não encontrado.' });
    }

    const senhaHash = await bcrypt.hash(novaSenha, 10);
    await usuario.update({ 
      senha_hash: senhaHash,
      deve_atualizar_senha: true
    });

    // Registrar auditoria de reset de senha
    await registrarAuditoria({
      req,
      acao: 'RESET_PASSWORD',
      entidade: 'Usuario',
      entidadeId: userId,
      nivelCritico: true,
      detalhes: `Senha redefinida para usuário: ${usuario.nome} (${usuario.email})`
    });

    res.json({ message: 'Senha redefinida com sucesso.' });
  } catch (error) {
    console.error('Erro ao redefinir senha:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// PATCH /api/usuarios/:id/toggle-status - Ativar/Desativar usuário (apenas admin)
router.patch('/:id/toggle-status', requireAuth, requireAdmin, strictRateLimiter, salvarDadosOriginais(Usuario), async (req, res) => {
  try {
    const usuario = await Usuario.findByPk(req.params.id);
    if (!usuario) {
      return res.status(404).json({ error: 'Usuário não encontrado.' });
    }

    const novoStatus = !usuario.ativo;
    await usuario.update({ ativo: novoStatus });

    // Buscar usuário atualizado com associações
    const usuarioAtualizado = await Usuario.findByPk(req.params.id, {
      include: {
        model: NivelAcesso,
        attributes: ['id', 'nome', 'descricao']
      },
      attributes: ['id', 'nome', 'email', 'cpf', 'ativo', 'telefone_e164', 'estado', 'createdAt', 'updatedAt']
    });

    // Registrar auditoria de mudança de status
    await registrarAuditoria({
      req,
      acao: 'TOGGLE_STATUS',
      entidade: 'Usuario',
      entidadeId: req.params.id,
      dadosAnteriores: req.originalData,
      dadosNovos: { ativo: novoStatus },
      nivelCritico: true,
      detalhes: `Status do usuário ${usuario.nome} alterado para: ${novoStatus ? 'ATIVO' : 'INATIVO'}`
    });

    res.json({
      id: usuarioAtualizado.id,
      nome: usuarioAtualizado.nome,
      email: usuarioAtualizado.email,
      cpf: usuarioAtualizado.cpf,
      nivelAcessoId: usuarioAtualizado.nivel_acesso_id,
      nivelAcesso: usuarioAtualizado.NivelAcesso,
      ativo: usuarioAtualizado.ativo,
      telefone_e164: usuarioAtualizado.telefone_e164,
      estado: usuarioAtualizado.estado,
      createdAt: usuarioAtualizado.createdAt,
      updatedAt: usuarioAtualizado.updatedAt
    });
  } catch (error) {
    console.error('Erro ao alterar status do usuário:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

module.exports = router;