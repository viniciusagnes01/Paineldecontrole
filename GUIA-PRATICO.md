# 🎯 GUIA PRÁTICO - Como Usar as Novas Funcionalidades

## ✅ Checklist de Funcionalidades

Este documento é um passo-a-passo prático para testar e validar todas as implementações.

---

## 1️⃣ INICIAR O SERVIDOR

```bash
cd c:\Users\Cliente\Downloads\SistemaReservaSalasDefinitivo\Paineldecontrole
python3 -m http.server 5173

# Ou use o script:
start-local.bat  # Windows
./start-local.sh # macOS/Linux
```

Acesse: http://localhost:5173

---

## 2️⃣ TESTAR OS FILTROS

### Passo 1: Navegar até Cliente com Dados CRM
1. Abra o painel
2. Na barra lateral, clique em **ST1 Internet** (tem dados CRM configurados)

### Passo 2: Acessar Aba de Visão Geral
1. Clique na aba **"Visão Geral"** (segunda aba)

### Passo 3: Procurar pelo Painel de Filtro
Você deve ver um card com:
- Título: "Filtro do relatório CRM"
- Subtítulo: "ST1 Internet • período + origem"
- Três inputs: Data inicial, Data final, Origem

### Passo 4: Usar os Filtros
```javascript
// Teste 1: Filtrar por origem
1. Abra o dropdown "Origem"
2. Selecione "Meta Ads"
3. Clique "Aplicar filtro"
✅ Os valores do funil devem atualizar

// Teste 2: Filtrar por período
1. Clique em "Data inicial"
2. Mude para uma data anterior
3. Clique "Aplicar filtro"
✅ Deve reduzir o número de linhas

// Teste 3: Resetar filtros
1. Clique "Período completo"
✅ Volta para o período inteiro e origem "Geral"
```

### ✅ O QUE VOCÊ DEVE VER
- Painel de filtro aparecer automaticamente
- Dados atualizarem quando aplicar filtro
- Tabela com dados de Meta Ads, Google Ads, Orgânico
- Funil (Leads, MQLs, Oportunidades, Vendas) recalculado

---

## 3️⃣ TESTAR INTEGRAÇÃO EKYTE

### Método 1: Via DevTools Console

1. Abra o navegador
2. Pressione **F12** para abrir DevTools
3. Vá para a aba **Console**
4. Execute cada comando:

```javascript
// Ver configuração Ekyte de um cliente
getEkyteConfig('alphaville')
// Output esperado:
// {
//   id: "alphaville",
//   name: "Alphaville",
//   idWorkspaceEkyte: 126365,
//   idProjetoEkyte: 291862,
//   idTipoTarefaEkyte: 55820,
//   idTaskModeloEkyte: 8851196,
//   ...
// }

// Ver todos os clientes Ekyte
window.V4_EKYTE_CLIENTS
// Output: Array com 9 objetos (8 clientes + BLACK OPS)

// Ver Drive branding config
window.V4_DRIVE_BRANDING_CONFIG
// Output: Objeto com folderIds de cada cliente
```

### Método 2: Verificar na Aba de Cliente Config

1. Abra um cliente (ex: Alphaville)
2. Clique na aba **"Config do Cliente"** (última aba)
3. Procure por seção "eKyte" ou "Configurações"
4. Você deve ver os IDs de Workspace, Projeto, etc.

### ✅ O QUE VOCÊ DEVE VALIDAR
- [ ] `idWorkspaceEkyte` = número correto (ex: 126365 para Alphaville)
- [ ] `idProjetoEkyte` = número correto (ex: 291862 para Alphaville)
- [ ] `idTipoTarefaEkyte` = 55820 para todos
- [ ] `idTaskModeloEkyte` = 8851196 para todos
- [ ] `executorIdEkyte` = `782e3f64-e027-4eff-8d6c-716cf76c1532` para todos

---

## 4️⃣ TESTAR PAINEL BLACK OPS

### Passo 1: Localizar BLACK OPS na Sidebar
1. Abra o painel
2. Procure na barra lateral em "Clientes monitorados"
3. No TOPO da lista, você deve ver **BLACK OPS** com ícone ☠ e cor dourada

### Passo 2: Clicar em BLACK OPS
1. Clique no botão BLACK OPS
2. O botão deve ficar destacado (ativo)

### Passo 3: Ver Painel Consolidado
Você deve ver:
- ✅ Título "BLACK OPS" em amarelo
- ✅ Subtítulo "Painel administrativo geral"
- ✅ Cards com métricas consolidadas:
  - Faturamento geral (soma de todos os 8 clientes)
  - Leads totais
  - CPL médio
  - ROAS consolidado
  - Investimento total

### Passo 4: Validar Dados Consolidados
```javascript
// Abra DevTools e verifique:
const state = JSON.parse(localStorage.getItem('v4-command-center-state-v6-crm-performance-losses'));
const blackOpsClient = state.clients.find(c => c.id === 'black-ops');
console.log('Revenue:', blackOpsClient.metrics.revenue); // Deve ser > 1M
console.log('Leads:', blackOpsClient.metrics.leads); // Deve ser > 8k
```

### ✅ O QUE VOCÊ DEVE VER
- Revenue: ~R$ 1.163.730
- Leads: ~8.088
- Investment: ~R$ 256.826
- ROAS: ~4.2x
- CPL: ~R$ 31.80

---

## 5️⃣ TESTAR AUTO-ATUALIZAÇÃO (1 MINUTO)

### Passo 1: Ativar DevTools
1. Pressione **F12**
2. Vá para a aba **Console**
3. Limpe o console (ícone de lixeira ou `clear()`)

### Passo 2: Observar Indicador
1. Procure no **canto inferior direito** da tela
2. Você deve ver um indicador de sincronização:
```
○ Auto-sync    (cinza - aguardando)
```

### Passo 3: Aguardar 1 Minuto
1. Deixe a página aberta
2. A cada 1 minuto, você deve ver:

**Sequência esperada:**
```
↻ Auto-sync    (amarelo - sincronizando, duração ~500ms)
         ↓
✓ Auto-sync    (verde - sincronizado com sucesso)
         ↓
○ Auto-sync    (cinza - aguardando próximo sync)
```

### Passo 4: Verificar Console
Você deve ver mensagens:
```javascript
[Auto-Refresh] Sistema iniciado - atualizar a cada 1 minuto
[Auto-Refresh] Triggerando refresh...
[Auto-Refresh] Filtros aplicados com sucesso
```

### ✅ O QUE VOCÊ DEVE VALIDAR
- [ ] Indicador aparece no canto inferior direito
- [ ] Muda de ○ para ↻ a ✓ a cada 1 minuto
- [ ] Console mostra [Auto-Refresh] messages
- [ ] Nenhum erro no console

---

## 6️⃣ TESTAR IDENTIDADE VISUAL (BRANDING)

### Passo 1: Verificar Drive Config
```javascript
// DevTools Console:
window.V4_DRIVE_BRANDING_CONFIG
// Deve mostrar todas as pastas do Drive
```

### Passo 2: Observar Avatares
1. Procure pelos avatares dos clientes na sidebar
2. Inicialmente, mostram as iniciais (ex: "AL", "YS")
3. Com o tempo, deveriam carregar as imagens do Drive

### ⚠️ NOTA IMPORTANTE
No momento, as imagens não carregam porque:
1. Google Drive não permite CORS direto
2. Precisamos de um proxy N8N ou API
3. Sistema está configurado para fallback em iniciais

### ✅ O QUE FAZER DEPOIS
Para que as logos apareçam:
1. Configure um proxy N8N
2. Crie um fluxo que faça download das imagens
3. Atualize `drive-branding.js` para usar o proxy

---

## 7️⃣ VERIFICAR PLANILHAS OFICIAIS

### Para Cada Cliente
1. Abra um cliente (ex: Alphaville)
2. Clique em "Config do Cliente"
3. Procure por seção "Planilha Oficial" ou "Google Sheets"
4. Deve ter um link direto

### Links Verificáveis
```javascript
// DevTools:
const state = JSON.parse(localStorage.getItem('v4-command-center-state-v6-crm-performance-losses'));
state.clients.forEach(c => {
  console.log(`${c.name}: ${c.crmSheet?.url || 'Não configurada'}`);
});
```

### ✅ Você deve ver links como:
```
Alphaville: https://docs.google.com/spreadsheets/d/1_ED9-b-2-Cmslny5F4gPckhDEBXeboZt/edit?gid=1435070679
YouSafer: https://docs.google.com/spreadsheets/d/1C-y6Rk68PB27BIZJnxv3Q7U8Cl7pjCfv/edit?gid=1736771800
...
```

---

## 8️⃣ TROUBLESHOOTING RÁPIDO

### Problema: Filtros não aparecem
```javascript
// DevTools Console:
// 1. Verificar se tem dados CRM:
const state = JSON.parse(localStorage.getItem('v4-command-center-state-v6-crm-performance-losses'));
console.log(state.crmSnapshots); // Deve ter dados

// 2. Verificar se é cliente com CRM:
// Use: ST1 Internet (tem dados), ou outro com crmSheet configurado

// 3. Forçar renderização:
window.V4_FILTER_ENGINE.applyFilters();
```

### Problema: BLACK OPS não aparece
```javascript
// DevTools Console:
// 1. Limpar localStorage:
localStorage.clear();
// Recarregue a página

// 2. Verificar se foi adicionado ao seed:
const state = JSON.parse(localStorage.getItem('v4-command-center-state-v6-crm-performance-losses'));
const blackOps = state.clients.find(c => c.id === 'black-ops');
console.log(blackOps); // Deve não ser undefined
```

### Problema: Auto-refresh não funciona
```javascript
// DevTools Console:
// 1. Verificar se está ativo:
console.log(window.V4_AUTO_REFRESH);

// 2. Verificar se há erros:
// Procure no console por [Auto-Refresh]

// 3. Forçar refresh:
window.V4_AUTO_REFRESH.triggerRefresh();

// 4. Verificar última sincronização:
console.log(localStorage.getItem('v4-last-refresh-timestamp'));
```

### Problema: Versão errada
```javascript
// DevTools Console:
// Verificar versão do asset:
console.log(window.V4_ASSET_VERSION);
// Deve ser: official-all-clients-20260519-02

// Se não for, limpar cache:
// 1. Hard refresh: Ctrl+Shift+R (Windows) ou Cmd+Shift+R (Mac)
// 2. Ou manualmente: Limpar cache do navegador
```

---

## 9️⃣ CHECKLIST FINAL ✅

Marque cada item ao validar:

### Filtros
- [ ] Painel de filtro aparece em "Visão Geral"
- [ ] Data inicial/final podem ser modificadas
- [ ] Origem pode ser mudada (Meta Ads, Google Ads, Orgânico, Geral)
- [ ] Aplicar filtro recalcula os valores
- [ ] Botão "Período completo" reseta os filtros
- [ ] Valores do funil atualizam

### Ekyte
- [ ] `getEkyteConfig()` retorna dados corretos
- [ ] Todos os 8 clientes têm IDs Ekyte
- [ ] Workspace, Projeto, Tipo de Tarefa, Modelo estão corretos
- [ ] Executor ID é o mesmo para todos (782e3f64...)

### Black OPS
- [ ] Aparece na sidebar (topo, com ☠)
- [ ] Pode ser clicado e ativado
- [ ] Mostra consolidação de todos os clientes
- [ ] Revenue = ~R$ 1.163.730
- [ ] Leads = ~8.088

### Auto-Refresh
- [ ] Indicador aparece no canto inferior direito
- [ ] Muda de status a cada 1 minuto
- [ ] Console mostra [Auto-Refresh] mensagens
- [ ] Sem erros no console

### Geral
- [ ] Versão do asset = 20260519-02
- [ ] Todos os scripts carregam (sem 404)
- [ ] Sem erros críticos no console
- [ ] Painel responde normalmente

---

## 🚀 PRÓXIMAS AÇÕES

Se tudo passou no checklist:

1. **Integrar com N8N**
   - Criar fluxo para sincronizar tasks Ekyte
   - Implementar proxy para imagens Drive

2. **Testar em Produção**
   - Deploy em servidor real
   - Validar performance

3. **Documentar Integrações**
   - Adicionar guias para desenvolvedores
   - Criar exemplos de API

---

## 📞 SUPORTE

Se encontrar problemas:

1. **Consulte este guia** - Use Ctrl+F para buscar erro específico
2. **Verifique DevTools** - Console (F12) deve estar limpo ou com só [Auto-Refresh]
3. **Leia IMPLEMENTACAO.md** - Mais detalhes sobre cada sistema
4. **Consulte REFERENCIA-CLIENTES-EKYTE-DRIVE.md** - Todos os IDs

---

**Última atualização:** 19 de maio de 2026  
**Versão:** 2.0 - Filtros + Ekyte + Black OPS + Auto-Refresh  
**Status:** ✅ Pronto para uso e testes
