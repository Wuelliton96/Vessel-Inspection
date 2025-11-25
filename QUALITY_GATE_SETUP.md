# Configuração do Quality Gate no SonarCloud

## Problema: Quality Gate Falhando

O Quality Gate está falhando com os seguintes problemas:

1. **34 Security Hotspots** - Pontos de atenção de segurança
2. **4.6% Duplication on New Code** (requerido <= 3%) - Código duplicado acima do limite
3. **E Security Rating on New Code** (requerido >= A) - Classificação de segurança muito baixa
4. **D Reliability Rating on New Code** (requerido >= A) - Classificação de confiabilidade baixa

## Soluções

### Opção 1: Ajustar Thresholds do Quality Gate (Recomendado para Desenvolvimento)

Se você está em fase de desenvolvimento e quer permitir que o código passe mesmo com alguns problemas:

1. **Acesse o SonarCloud:**
   - Vá para: https://sonarcloud.io
   - Faça login e selecione a organização `wuelliton96`

2. **Acesse o Quality Gate do Projeto:**
   - Backend: https://sonarcloud.io/project/quality_gate?id=Wuelliton96_Vessel-Inspection
   - Frontend: https://sonarcloud.io/project/quality_gate?id=Wuelliton96_Vessel-Inspection-Frontend

3. **Ajuste os Thresholds:**
   - Clique em "Edit" no Quality Gate
   - Ajuste os seguintes critérios:
     - **Duplication on New Code:** Aumente de 3% para 5% (temporariamente)
     - **Security Rating:** Mude de ">= A" para ">= C" (temporariamente)
     - **Reliability Rating:** Mude de ">= A" para ">= C" (temporariamente)
     - **Security Hotspots:** Pode ser configurado para não bloquear (apenas avisar)

4. **Salve as alterações**

### Opção 2: Corrigir os Problemas no Código (Recomendado para Produção)

#### 1. Reduzir Duplicação de Código (4.6% → <= 3%)

**Problema:** Código duplicado acima do limite permitido.

**Solução:**
- Identifique blocos de código duplicados
- Extraia código comum para funções/componentes reutilizáveis
- Use helpers/utilities para lógica compartilhada
- Considere usar padrões como HOCs (Higher-Order Components) no React

**Exemplo:**
```typescript
// ❌ Antes (duplicado)
function ComponentA() {
  const handleSubmit = async (data) => {
    try {
      const response = await api.post('/endpoint', data);
      if (response.status === 200) {
        toast.success('Sucesso!');
      }
    } catch (error) {
      toast.error('Erro!');
    }
  };
}

function ComponentB() {
  const handleSubmit = async (data) => {
    try {
      const response = await api.post('/endpoint', data);
      if (response.status === 200) {
        toast.success('Sucesso!');
      }
    } catch (error) {
      toast.error('Erro!');
    }
  };
}

// ✅ Depois (reutilizável)
function useApiSubmit(endpoint) {
  return async (data) => {
    try {
      const response = await api.post(endpoint, data);
      if (response.status === 200) {
        toast.success('Sucesso!');
      }
    } catch (error) {
      toast.error('Erro!');
    }
  };
}
```

#### 2. Melhorar Security Rating (E → A)

**Problema:** 34 Security Hotspots identificados.

**Soluções:**
- Revise todos os Security Hotspots no SonarCloud
- Corrija vulnerabilidades críticas primeiro
- Use bibliotecas atualizadas e seguras
- Implemente validação de entrada adequada
- Use HTTPS para todas as comunicações
- Sanitize dados do usuário antes de processar

**Problemas Comuns:**
- **SQL Injection:** Use prepared statements/ORM (já está usando Sequelize ✅)
- **XSS:** Sanitize inputs do usuário (já está usando Express Validator ✅)
- **Secrets em código:** Use variáveis de ambiente (já está usando ✅)
- **Dependências desatualizadas:** Execute `npm audit fix`

#### 3. Melhorar Reliability Rating (D → A)

**Problema:** Código com baixa confiabilidade.

**Soluções:**
- Adicione tratamento de erros adequado
- Implemente validações robustas
- Adicione testes para casos de erro
- Use TypeScript para type safety (já está usando ✅)
- Evite código morto (dead code)
- Remova código comentado não utilizado

**Exemplo:**
```typescript
// ❌ Antes
function processData(data) {
  return data.map(item => item.value * 2);
}

// ✅ Depois
function processData(data: DataItem[]): number[] {
  if (!Array.isArray(data)) {
    throw new Error('Data must be an array');
  }
  
  return data.map(item => {
    if (typeof item.value !== 'number') {
      throw new Error('Item value must be a number');
    }
    return item.value * 2;
  });
}
```

### Opção 3: Desabilitar Verificação do Quality Gate no Workflow (Temporário)

O workflow já está configurado com `continue-on-error: true`, então o Quality Gate não bloqueia o pipeline. Os problemas são apenas reportados como avisos.

## Verificar Status do Quality Gate

Você pode verificar o status do Quality Gate acessando:

- **Backend:** https://sonarcloud.io/project/overview?id=Wuelliton96_Vessel-Inspection
- **Frontend:** https://sonarcloud.io/project/overview?id=Wuelliton96_Vessel-Inspection-Frontend

## Prioridades de Correção

1. **Alta Prioridade:**
   - Security Hotspots críticos (vulnerabilidades reais)
   - Security Rating E → pelo menos C

2. **Média Prioridade:**
   - Reduzir duplicação de código (4.6% → 3%)
   - Reliability Rating D → pelo menos C

3. **Baixa Prioridade:**
   - Melhorar ratings de C para A (otimização)
   - Refatoração de código duplicado restante

## Comandos Úteis

### Verificar dependências vulneráveis:
```bash
cd frontend-react
npm audit
npm audit fix
```

### Verificar código duplicado localmente:
```bash
# Instalar ferramenta de análise
npm install -g jscpd

# Verificar duplicação
jscpd frontend-react/src --min-lines 5 --min-tokens 50
```

## Links Úteis

- SonarCloud Dashboard: https://sonarcloud.io/dashboard
- Quality Gate Configuration: https://sonarcloud.io/quality_gates
- Security Hotspots: https://sonarcloud.io/security_hotspots
- Documentação: https://docs.sonarcloud.io/

## Nota Importante

O workflow do GitHub Actions está configurado para **não bloquear** quando o Quality Gate falhar. Isso permite que você continue desenvolvendo enquanto corrige os problemas gradualmente. No entanto, é recomendado corrigir os problemas antes de fazer merge para produção.

