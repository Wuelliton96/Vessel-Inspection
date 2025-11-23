# Teste Completo de Upload de Foto

Este documento descreve como executar os testes de upload de foto com validação completa.

## Pré-requisitos

1. Backend rodando na porta 3000 (ou configurar `API_BASE_URL` no `.env`)
2. Banco de dados PostgreSQL conectado
3. Dependências instaladas: `npm install`

## Testes Disponíveis

### 1. Teste Completo de Validação

Este teste executa todo o fluxo e valida cada etapa:

```bash
npm run test:upload-validacao
```

**O que este teste faz:**
- Cria dados de teste (vistoria, checklist item, tipo de foto)
- Faz login como vistoriador
- Faz upload de uma foto com `checklist_item_id`
- Verifica se a foto foi salva no banco de dados
- Verifica se o nome do arquivo contém o `checklist_item_id`
- Verifica se o checklist foi marcado como CONCLUIDO
- Verifica se a foto foi vinculada ao checklist
- Valida tudo diretamente no banco de dados
- Limpa os dados de teste

**Resultado esperado:**
```
TODAS AS VALIDACOES PASSARAM!
O sistema está funcionando corretamente!
```

### 2. Teste Básico com Checklist

```bash
npm run test:upload-checklist
```

## Logs Detalhados

### Backend

Os logs do backend mostram:

1. **Recebimento da requisição:**
   ```
   [UPLOAD] Valores recebidos no req.body:
     - vistoria_id: 30
     - tipo_foto_id: 1
     - checklist_item_id: 555
   ```

2. **Processamento do checklist:**
   ```
   [CHECKLIST] === INICIANDO BUSCA DO ITEM DO CHECKLIST ===
   [CHECKLIST] checklist_item_id recebido: 555
   [CHECKLIST] Item do checklist encontrado por ID:
     - ID: 555
     - Nome: "Confirmação do nº de inscrição e nome"
     - Status atual: PENDENTE
   ```

3. **Atualização do checklist:**
   ```
   [CHECKLIST] === ATUALIZANDO ITEM DO CHECKLIST ===
   [CHECKLIST] Item do checklist atualizado:
     - Item ID: 555
     - Foto ID vinculada: 123
     - Status: CONCLUIDO
   ```

4. **Resumo final:**
   ```
   [UPLOAD] === RESUMO FINAL ===
   [UPLOAD]   - Foto ID: 123
   [UPLOAD]   - checklist_item_id_enviado: 555
   [UPLOAD]   - checklist_atualizado: sim
   ```

### Frontend

Os logs do frontend mostram:

1. **Início do upload:**
   ```
   [FRONTEND] === INICIANDO UPLOAD DE FOTO ===
   [FRONTEND]   - checklist_item_id: 555
   [FRONTEND]   - Item do checklist: "Confirmação do nº de inscrição e nome"
   ```

2. **Resposta do servidor:**
   ```
   [FRONTEND] === RESPOSTA DO UPLOAD ===
   [FRONTEND]   - Foto ID: 123
   [FRONTEND]   - checklist_item_id_enviado: 555
   [FRONTEND]   - checklist_atualizado: sim
   [FRONTEND] IDs correspondem: 555 === 555
   ```

## Verificação Manual no Banco

Após o upload, você pode verificar no banco:

```sql
-- Verificar foto
SELECT id, url_arquivo, vistoria_id, tipo_foto_id, created_at 
FROM fotos 
WHERE vistoria_id = 30 
ORDER BY created_at DESC 
LIMIT 1;

-- Verificar checklist atualizado
SELECT id, nome, status, foto_id, concluido_em 
FROM vistoria_checklist_itens 
WHERE vistoria_id = 30 AND foto_id IS NOT NULL;
```

## Formato do Nome do Arquivo

**Com checklist_item_id:**
```
vistorias/id-30/foto-checklist-555-1763521430641-653081032.jpg
```

**Sem checklist_item_id:**
```
vistorias/id-30/foto-1763521430641-653081032.jpg
```

## Troubleshooting

### Problema: Checklist não está sendo atualizado

**Verificar:**
1. Logs do backend mostram `[CHECKLIST]` - verificar se o item foi encontrado
2. Verificar se o `checklist_item_id` enviado existe na vistoria
3. Verificar se o item não está em outro status (já CONCLUIDO)

### Problema: Foto não está sendo salva

**Verificar:**
1. Logs mostram `[UPLOAD] Foto criada no banco`
2. Verificar conexão com banco de dados
3. Verificar permissões de escrita

### Problema: Nome do arquivo não contém checklist_item_id

**Verificar:**
1. O `checklist_item_id` está sendo enviado no FormData
2. Logs mostram `checklist_item_id recebido: XXX`
3. Verificar se o `uploadService.js` está usando o `checklist_item_id` corretamente

## Suporte

Se os testes falharem, verifique:
1. Logs completos do backend
2. Logs do console do navegador (frontend)
3. Status do banco de dados
4. Configuração do `.env`

