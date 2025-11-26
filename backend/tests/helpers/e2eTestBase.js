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

  /**
   * Executa validação e retorna resultado formatado
   */
  validateAndLog(expectedStatus, expectedFotoId = null, successMessages = []) {
    const validation = this.validateItemState(expectedStatus, expectedFotoId);
    
    if (validation.isValid) {
      if (successMessages.length > 0) {
        successMessages.forEach(msg => console.log(`  OK: ${msg}`));
      }
      return { isValid: true, errors: [] };
    }
    
    validation.errors.forEach(error => {
      console.log(`  ERRO: ${error}`);
    });
    return validation;
  }

  /**
   * Executa teste completo de marcar como concluído e validar
   */
  async runCompleteMarkAsCompletedTest(fotoId = null) {
    console.log('\n=== SIMULANDO ROTA PATCH /api/checklists/vistoria/item/:id/status ===\n');
    this.logItemState('Estado ANTES');
    await this.markItemAsCompleted(fotoId);
    this.logItemState('Estado DEPOIS');
    console.log('');
    
    console.log('=== VALIDAÇÕES ===');
    const validation = this.validateAndLog(
      'CONCLUIDO',
      null,
      [
        'Status atualizado para CONCLUIDO',
        'Foto ID é null',
        'concluido_em foi definido'
      ]
    );
    
    return validation.isValid;
  }

  /**
   * Executa teste completo de voltar para pendente e validar
   */
  async runCompleteMarkAsPendingTest() {
    console.log('\n=== TESTANDO VOLTAR PARA PENDENTE ===');
    await this.markItemAsPending();
    
    const validation = this.validateAndLog(
      'PENDENTE',
      null,
      ['Item voltou para PENDENTE corretamente']
    );
    
    return validation.isValid;
  }

  /**
   * Verifica se item está nas listas corretas
   */
  async verifyItemInLists() {
    const itensConcluidos = await this.getItemsByStatus('CONCLUIDO');
    const itensPendentes = await this.getItemsByStatus('PENDENTE');

    console.log('\n=== VERIFICAÇÃO DE LISTAS ===');
    console.log(`  Itens concluídos na vistoria: ${itensConcluidos.length}`);
    console.log(`  Itens pendentes na vistoria: ${itensPendentes.length}`);

    const itemEstaConcluido = itensConcluidos.some(i => i.id === this.item.id);
    const itemEstaPendente = itensPendentes.some(i => i.id === this.item.id);

    if (itemEstaConcluido && !itemEstaPendente) {
      console.log('  OK: Item aparece apenas na lista de concluídos');
      return true;
    }
    
    console.log('  ERRO: Item não está na lista correta');
    console.log(`    Está em concluídos: ${itemEstaConcluido}`);
    console.log(`    Está em pendentes: ${itemEstaPendente}`);
    return false;
  }

  /**
   * Executa teste completo e retorna resultado final
   */
  async runCompleteTest(options = {}) {
    const {
      testName = 'TESTE',
      requireVistoriador = false,
      itemOptions = {},
      validateLists = false,
      testPending = true
    } = options;

    let todasValido = true;

    try {
      console.log(`=== ${testName} ===\n`);

      if (requireVistoriador) {
        const vistoriador = await this.findVistoriador();
        console.log(`Vistoriador: ${vistoriador.nome} (ID: ${vistoriador.id})\n`);
      }

      const item = await this.findPendingItem(itemOptions);
      if (!item) {
        console.log(`Nenhum item encontrado para teste`);
        process.exit(0);
      }

      this.logItemInfo();
      console.log('');

      todasValido = await this.runCompleteMarkAsCompletedTest();

      if (validateLists) {
        const listsValid = await this.verifyItemInLists();
        todasValido = todasValido && listsValid;
      }

      if (testPending) {
        const pendingValid = await this.runCompleteMarkAsPendingTest();
        todasValido = todasValido && pendingValid;
      }

      console.log('\n=== RESULTADO FINAL ===');
      if (todasValido) {
        console.log('OK: Todos os testes passaram!');
      } else {
        console.log('ERRO: Alguns testes falharam');
      }

      console.log('\n=== TESTE CONCLUÍDO ===\n');
      return todasValido;
    } catch (error) {
      console.error('Erro no teste:', error);
      console.error('Stack:', error.stack);
      throw error;
    }
  }
}

module.exports = E2ETestBase;

