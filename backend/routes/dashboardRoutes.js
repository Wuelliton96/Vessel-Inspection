// backend/routes/dashboardRoutes.js

const express = require('express');
const router = express.Router();
const { Vistoria, Embarcacao, Usuario, StatusVistoria, LotePagamento } = require('../models');
const { requireAuth, requireAdmin } = require('../middleware/auth');
const { Op } = require('sequelize');
const sequelize = require('../config/database');

// Aplicar middleware de autenticação de admin
router.use(requireAuth, requireAdmin);

// GET /api/dashboard/estatisticas - Estatísticas gerais do dashboard
router.get('/estatisticas', async (req, res) => {
  try {
    console.log('=== ROTA GET /api/dashboard/estatisticas ===');
    
    const hoje = new Date();
    const mesAtual = hoje.getMonth();
    const anoAtual = hoje.getFullYear();
    
    // Primeiro dia do mês atual
    const inicioMesAtual = new Date(anoAtual, mesAtual, 1);
    // Último dia do mês atual
    const fimMesAtual = new Date(anoAtual, mesAtual + 1, 0, 23, 59, 59);
    
    // Primeiro dia do mês anterior
    const inicioMesAnterior = new Date(anoAtual, mesAtual - 1, 1);
    // Último dia do mês anterior
    const fimMesAnterior = new Date(anoAtual, mesAtual, 0, 23, 59, 59);

    // 1. Total de vistorias por status
    const vistoriasPorStatus = await Vistoria.findAll({
      attributes: [
        'status_id',
        [sequelize.fn('COUNT', sequelize.col('Vistoria.id')), 'quantidade']
      ],
      include: [
        { 
          model: StatusVistoria, 
          as: 'StatusVistoria',
          attributes: ['nome']
        }
      ],
      group: ['status_id', 'StatusVistoria.id', 'StatusVistoria.nome']
    });

    // 2. Vistorias do mês atual
    const vistoriasMesAtual = await Vistoria.count({
      where: {
        created_at: {
          [Op.between]: [inicioMesAtual, fimMesAtual]
        }
      }
    });

    // 3. Vistorias do mês anterior
    const vistoriasMesAnterior = await Vistoria.count({
      where: {
        created_at: {
          [Op.between]: [inicioMesAnterior, fimMesAnterior]
        }
      }
    });

    // 4. Vistorias concluídas no mês atual
    const vistoriasConcluidasMesAtual = await Vistoria.count({
      where: {
        data_conclusao: {
          [Op.between]: [inicioMesAtual, fimMesAtual]
        }
      }
    });

    // 5. Vistorias concluídas no mês anterior
    const vistoriasConcluidasMesAnterior = await Vistoria.count({
      where: {
        data_conclusao: {
          [Op.between]: [inicioMesAnterior, fimMesAnterior]
        }
      }
    });

    // 6. Receita total (valor_vistoria) do mês atual
    const receitaMesAtual = await Vistoria.sum('valor_vistoria', {
      where: {
        data_conclusao: {
          [Op.between]: [inicioMesAtual, fimMesAtual]
        },
        valor_vistoria: {
          [Op.not]: null
        }
      }
    });

    // 7. Receita total do mês anterior
    const receitaMesAnterior = await Vistoria.sum('valor_vistoria', {
      where: {
        data_conclusao: {
          [Op.between]: [inicioMesAnterior, fimMesAnterior]
        },
        valor_vistoria: {
          [Op.not]: null
        }
      }
    });

    // 8. Despesa com vistoriadores (valor_vistoriador) do mês atual
    const despesaMesAtual = await Vistoria.sum('valor_vistoriador', {
      where: {
        data_conclusao: {
          [Op.between]: [inicioMesAtual, fimMesAtual]
        },
        valor_vistoriador: {
          [Op.not]: null
        }
      }
    });

    // 9. Despesa com vistoriadores do mês anterior
    const despesaMesAnterior = await Vistoria.sum('valor_vistoriador', {
      where: {
        data_conclusao: {
          [Op.between]: [inicioMesAnterior, fimMesAnterior]
        },
        valor_vistoriador: {
          [Op.not]: null
        }
      }
    });

    // 10. Lucro (receita - despesa)
    const lucroMesAtual = (parseFloat(receitaMesAtual || 0) - parseFloat(despesaMesAtual || 0));
    const lucroMesAnterior = (parseFloat(receitaMesAnterior || 0) - parseFloat(despesaMesAnterior || 0));

    // 11. Ranking de vistoriadores (mês atual)
    const rankingVistoriadores = await Vistoria.findAll({
      attributes: [
        'vistoriador_id',
        [sequelize.fn('COUNT', sequelize.col('Vistoria.id')), 'total_vistorias'],
        [sequelize.fn('SUM', sequelize.col('valor_vistoriador')), 'total_ganho']
      ],
      where: {
        data_conclusao: {
          [Op.between]: [inicioMesAtual, fimMesAtual]
        }
      },
      include: [
        {
          model: Usuario,
          as: 'vistoriador',
          attributes: ['id', 'nome', 'email']
        }
      ],
      group: ['vistoriador_id', 'vistoriador.id', 'vistoriador.nome', 'vistoriador.email'],
      order: [[sequelize.fn('COUNT', sequelize.col('Vistoria.id')), 'DESC']],
      limit: 5
    });

    // 12. Totais gerais
    const totalVistorias = await Vistoria.count();
    const totalEmbarcacoes = await Embarcacao.count();
    const totalVistoriadores = await Usuario.count({
      where: { nivel_acesso_id: 2 }
    });

    // 13. Pagamentos pendentes e pagos (mês atual)
    const pagamentosPendentesMesAtual = await LotePagamento.sum('valor_total', {
      where: {
        status: 'PENDENTE',
        data_inicio: {
          [Op.gte]: inicioMesAtual
        }
      }
    }) || 0;

    const pagamentosPagosMesAtual = await LotePagamento.sum('valor_total', {
      where: {
        status: 'PAGO',
        data_pagamento: {
          [Op.between]: [inicioMesAtual, fimMesAtual]
        }
      }
    }) || 0;

    // Montar resposta
    const estatisticas = {
      mes_atual: {
        mes: mesAtual + 1,
        ano: anoAtual,
        nome_mes: new Date(anoAtual, mesAtual).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }),
        vistorias: {
          total: vistoriasMesAtual,
          concluidas: vistoriasConcluidasMesAtual,
          em_andamento: vistoriasMesAtual - vistoriasConcluidasMesAtual
        },
        financeiro: {
          receita: parseFloat(receitaMesAtual || 0),
          despesa: parseFloat(despesaMesAtual || 0),
          lucro: lucroMesAtual,
          pagamentos_pendentes: parseFloat(pagamentosPendentesMesAtual),
          pagamentos_pagos: parseFloat(pagamentosPagosMesAtual)
        }
      },
      mes_anterior: {
        mes: mesAtual === 0 ? 12 : mesAtual,
        ano: mesAtual === 0 ? anoAtual - 1 : anoAtual,
        nome_mes: new Date(anoAtual, mesAtual - 1).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }),
        vistorias: {
          total: vistoriasMesAnterior,
          concluidas: vistoriasConcluidasMesAnterior
        },
        financeiro: {
          receita: parseFloat(receitaMesAnterior || 0),
          despesa: parseFloat(despesaMesAnterior || 0),
          lucro: lucroMesAnterior
        }
      },
      comparacao: {
        vistorias: {
          variacao: vistoriasMesAtual - vistoriasMesAnterior,
          percentual: vistoriasMesAnterior > 0 
            ? ((vistoriasMesAtual - vistoriasMesAnterior) / vistoriasMesAnterior * 100).toFixed(1)
            : (vistoriasMesAtual > 0 ? 100 : 0)
        },
        receita: {
          variacao: parseFloat(receitaMesAtual || 0) - parseFloat(receitaMesAnterior || 0),
          percentual: receitaMesAnterior > 0 
            ? (((receitaMesAtual || 0) - (receitaMesAnterior || 0)) / receitaMesAnterior * 100).toFixed(1)
            : ((receitaMesAtual || 0) > 0 ? 100 : 0)
        },
        lucro: {
          variacao: lucroMesAtual - lucroMesAnterior,
          percentual: lucroMesAnterior > 0 
            ? ((lucroMesAtual - lucroMesAnterior) / lucroMesAnterior * 100).toFixed(1)
            : (lucroMesAtual > 0 ? 100 : 0)
        }
      },
      vistorias_por_status: vistoriasPorStatus.map(v => ({
        status: v.StatusVistoria?.nome || 'Desconhecido',
        quantidade: parseInt(v.dataValues.quantidade)
      })),
      ranking_vistoriadores: rankingVistoriadores.map(v => ({
        id: v.vistoriador_id,
        nome: v.vistoriador?.nome || 'Desconhecido',
        email: v.vistoriador?.email,
        total_vistorias: parseInt(v.dataValues.total_vistorias),
        total_ganho: parseFloat(v.dataValues.total_ganho || 0)
      })),
      totais_gerais: {
        total_vistorias: totalVistorias,
        total_embarcacoes: totalEmbarcacoes,
        total_vistoriadores: totalVistoriadores
      }
    };

    console.log('Estatísticas calculadas com sucesso');
    res.json(estatisticas);
  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error);
    res.status(500).json({ error: 'Erro ao buscar estatísticas do dashboard' });
  }
});

module.exports = router;

