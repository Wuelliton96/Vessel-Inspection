/**
 * Base class para testes E2E
 * Reduz duplicação entre scripts de teste end-to-end
 */

const { VistoriaChecklistItem, Vistoria, Usuario, NivelAcesso } = require('../../models');

class E2ETestBase {
  constructor() {
    this.vistoriador = null;
    this.item = null;
    this.vistoria = null;
  }

  /**
   * Busca um vistoriador no banco
   */
  async findVistoriador() {
    const nivelVistoriador = await NivelAcesso.findOne({ where: { nome: 'VISTORIADOR' } });
    if (!nivelVistoriador) {
      throw new Error('Nível VISTORIADOR não encontrado');
    }

    this.vistoriador = await Usuario.findOne({
      where: { nivel_acesso_id: nivelVistoriador.id },
      include: [{ model: NivelAcesso, as: 'NivelAcesso' }]
    });

    if (!this.vistoriador) {
      throw new Error('Nenhum vistoriador encontrado');
    }

    return this.vistoriador;
  }

  /**
   * Busca um item de checklist pendente
   */
  async findPendingItem(options = {}) {
    const whereClause = {
      status: 'PENDENTE',
      ...options
    };

    this.item = await VistoriaChecklistItem.findOne({
      where: whereClause,
      include: [
        {
          model: Vistoria,
          as: 'vistoria',
          attributes: ['id', 'vistoriador_id']
        }
      ]
    });

    if (this.item) {
      this.vistoria = this.item.vistoria;
    }

    return this.item;
  }

  /**
   * Atualiza item para concluído
   */
  async markItemAsCompleted(fotoId = null) {
    if (!this.item) {
      throw new Error('Item não encontrado. Chame findPendingItem() primeiro.');
    }

    const updateData = {
      status: 'CONCLUIDO',
      concluido_em: new Date(),
      foto_id: fotoId
    };

    await this.item.update(updateData);
    await this.item.reload();

    return this.item;
  }

  /**
   * Atualiza item para pendente
   */
  async markItemAsPending() {
    if (!this.item) {
      throw new Error('Item não encontrado. Chame findPendingItem() primeiro.');
    }

    const updateData = {
      status: 'PENDENTE',
      concluido_em: null,
      foto_id: null
    };

    await this.item.update(updateData);
    await this.item.reload();

    return this.item;
  }

  /**
   * Valida estado do item
   */
  validateItemState(expectedStatus, expectedFotoId = null) {
    if (!this.item) {
      throw new Error('Item não encontrado.');
    }

    const errors = [];

    if (this.item.status !== expectedStatus) {
      errors.push(`Status esperado: ${expectedStatus}, atual: ${this.item.status}`);
    }

    if (expectedFotoId !== undefined && this.item.foto_id !== expectedFotoId) {
      errors.push(`Foto ID esperado: ${expectedFotoId}, atual: ${this.item.foto_id}`);
    }

    if (expectedStatus === 'CONCLUIDO' && !this.item.concluido_em) {
      errors.push('concluido_em não foi definido');
    }

    if (expectedStatus === 'PENDENTE' && this.item.concluido_em) {
      errors.push('concluido_em deveria ser null para status PENDENTE');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Busca itens de checklist por status
   */
  async getItemsByStatus(status) {
    if (!this.item || !this.item.vistoria_id) {
      throw new Error('Item não encontrado ou sem vistoria_id.');
    }

    return await VistoriaChecklistItem.findAll({
      where: {
        vistoria_id: this.item.vistoria_id,
        status: status
      }
    });
  }

  /**
   * Loga informações do item
   */
  logItemInfo() {
    if (!this.item) {
      console.log('Nenhum item encontrado');
      return;
    }

    console.log('Item encontrado:');
    console.log(`  ID: ${this.item.id}`);
    console.log(`  Nome: ${this.item.nome}`);
    console.log(`  Status: ${this.item.status}`);
    console.log(`  Obrigatório: ${this.item.obrigatorio}`);
    console.log(`  Vistoria ID: ${this.item.vistoria_id}`);
    if (this.vistoria) {
      console.log(`  Vistoriador da vistoria: ${this.vistoria.vistoriador_id || 'N/A'}`);
    }
  }

  /**
   * Loga estado do item
   */
  logItemState(label = 'Estado') {
    if (!this.item) {
      console.log('Nenhum item encontrado');
      return;
    }

    console.log(`=== ${label} ===`);
    console.log(`  Status: ${this.item.status}`);
    console.log(`  Foto ID: ${this.item.foto_id || 'null'}`);
    console.log(`  Concluído em: ${this.item.concluido_em || 'null'}`);
  }
}

module.exports = E2ETestBase;

