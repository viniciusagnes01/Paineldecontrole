# V4 Command Center — Codebase Overview

## Summary
Este repositório implementa um painel operacional web em JavaScript puro para a V4 Company, com foco em consolidar clientes, mídia paga, CRM, funil, landing pages, pixels, concorrentes SEMrush, tasks e plano de ação em uma única interface. A aplicação foi desenhada para operar como um protótipo/console local com persistência em `localStorage`, mas já traz pontos de integração para Google Sheets, N8N/backend e serviços externos.  
Na prática, ela serve para gestão comercial e de performance por cliente, com visão global e visão por cliente, além de módulos especializados para CRM dinâmico, relatório de perdas, mídia mensal/semanal, eKyte e Growth Pack oficial.

## Architecture
A arquitetura é de uma SPA leve baseada em DOM APIs nativas, sem framework frontend. O carregamento é feito por `index.html`, que injeta scripts em ordem fixa; cada módulo expõe objetos globais em `window.*` e a composição acontece por cooperação entre esses módulos.

- **Padrão principal:** aplicação modular orientada a estado global no navegador.
- **Estado persistido:** `localStorage` guarda a base principal sob a chave `v4-command-center-state-v6-crm-performance-losses`; `sessionStorage` guarda filtros e estado temporário de algumas telas.
- **Renderização:** `src/app.js` re-renderiza manualmente sidebar e conteúdo principal por `innerHTML` após eventos de navegação e mutação de dados.
- **Integrações:** módulos de CRM, performance, eKyte, Growth Pack e branding são carregados como overlays globais e observam mutações do DOM para se encaixar na UI existente.
- **Fontes de dados:** há três camadas importantes:
  1. `seed.js` para dados iniciais de demonstração.
  2. `active-clients.js` e `official-runtime-fix.js` para “base oficial” de clientes ativos.
  3. conectores de Sheets/CRM/performance para leitura real via CSV ou proxy.
- **Modo operacional:** a aplicação foi pensada para funcionar sem backend, mas com rotas definidas em `V4_INTEGRATIONS.endpoints` e mensagens explícitas para não expor tokens no front-end.

### Como a execução começa
1. `index.html` carrega estilos e templates.
2. Scripts de dados carregam `window.V4_SEED`.
3. `official-runtime-fix.js` e `active-clients.js` podem substituir/normalizar os clientes para o conjunto oficial.
4. `integrations.js`, `ekyte-integration.js`, `growthpack-data.js`, `growthpack-dynamic.js`, `sheets-crm.js`, `sheets-performance.js` e `client-branding.js` registram APIs globais.
5. `src/app.js` monta a interface e registra handlers globais de clique/submit.
6. Módulos de extensão observam o DOM com `MutationObserver` e inserem filtros ou branding quando a tela relevante aparece.

## Directory Structure
```text
project-root/
├── index.html                  — Shell da aplicação e ordem de carregamento dos scripts
├── package.json                — Scripts mínimos de dev/teste
├── README.md                   — Visão funcional e instruções de uso local
├── netlify.toml                — Configuração de deploy estático
├── start-local.bat / .sh       — Atalhos para rodar servidor local
├── docs/                       — Guias de operação e integração
│   ├── EKYTE_INTEGRATION.md
│   └── GROWTHPACK_DYNAMIC_DATA.md
├── src/
│   ├── app.js                  — Orquestrador principal da UI e do estado
│   ├── styles.css              — Estilos da aplicação
│   ├── assets/                 — Imagens e referências visuais
│   ├── data/
│   │   ├── seed.js             — Seed inicial do painel
│   │   └── active-clients.js   — Base oficial de clientes ativos e guardrails
│   └── services/
│       ├── integrations.js     — Catálogo de endpoints e sync agregada
│       ├── official-runtime-fix.js — Normalização da base oficial no boot
│       ├── client-branding.js  — Troca de avatares/branding por cliente
│       ├── crm-filter-panel.js  — Filtro por data/origem sobre snapshot de CRM
│       ├── crm-source-filters.js — Extensão de filtro avançado de CRM
│       ├── ekyte-integration.js — Sincronização e normalização de tasks eKyte
│       ├── ekyte-ui.js         — UI adicional do eKyte
│       ├── fca-dashboard.js     — Dashboard FCA sobre a planilha oficial
│       ├── growthpack-data.js   — Seed e fallback Growth Pack por cliente
│       ├── growthpack-dynamic.js — Sync dinâmica Growth Pack via backend/API
│       ├── sheets-crm.js        — Leitura/normalização de BASE_CRM em CSV
│       ├── sheets-performance.js — Leitura/normalização de mídia mensal/semanal
│       ├── responsive-client-branding.css — Ajustes visuais para branding
│       └── ...
├── alphaville-integrations-ready/   — Artefatos auxiliares/patches de integrações
├── alphaville-pull-data-fallback/   — Fallbacks e patch docs para Alphaville
└── *.patch / *.zip                 — Artefatos de migração/fallback e pacotes auxiliares
```

## Key Abstractions

### `window.V4_SEED`
- **File**: `src/data/seed.js`
- **Responsabilidade**: contém o estado inicial completo do painel: settings, integrations, clients, pixels, competitors, campaigns, creatives, tasks, actionPlan, events e alerts.
- **Interface**: objeto JSON-like com estruturas prontas para renderização e edição.
- **Lifecycle**: carregado no boot; depois pode ser sobrescrito por runtime fix, Growth Pack, ou dados salvos no `localStorage`.
- **Used by**: `src/app.js`, `official-runtime-fix.js`, `growthpack-data.js`, `sheets-*`, `ekyte-integration.js`.

### `window.V4_APPLY_OFFICIAL_DATABASE`
- **File**: `src/data/active-clients.js` e aplicado por `src/services/official-runtime-fix.js`
- **Responsabilidade**: troca o seed para a base oficial de clientes ativos, removendo dados de demo e impondo guardrails.
- **Interface**: função que recebe o seed mutável e injeta clientes oficiais, alertas e flags de política de dados.
- **Lifecycle**: executada no boot, antes da UI principal, e também quando o runtime fix re-hidrata o `localStorage`.
- **Used by**: boot sequence de `index.html` e qualquer módulo que dependa de clientes oficiais.

### `src/app.js` / app shell
- **File**: `src/app.js`
- **Responsabilidade**: controla navegação, estado da aplicação, renderização de todas as telas e handlers de edição/sincronização.
- **Interface**: funções internas para renderizar visão global, tela de cliente, settings, CRUDs e sync de CRM/performance.
- **Lifecycle**: singleton de runtime; inicializa carregando estado, registra listeners globais e renderiza imediatamente.
- **Used by**: todos os módulos que adicionam UI por DOM observation ou que leem/gravam snapshots em `localStorage`.

### `window.V4_CRM_SHEETS`
- **File**: `src/services/sheets-crm.js` e estendido por `src/services/crm-source-filters.js`
- **Responsabilidade**: carregar a planilha BASE_CRM em CSV, parsear linhas, mapear colunas, agregar métricas e produzir snapshot de CRM.
- **Interface**: `load()`, `aggregate()`, `parseCsv()`, `getSpreadsheetId()`.
- **Lifecycle**: usado sob demanda quando o usuário clica em “Sincronizar CRM agora”; o snapshot resultante é persistido e filtrado por módulos auxiliares.
- **Used by**: `src/app.js`, `crm-filter-panel.js`, `crm-source-filters.js`.

### `window.V4_PERFORMANCE_SHEETS`
- **File**: `src/services/sheets-performance.js`
- **Responsabilidade**: carregar abas mensal e semanal de mídia, normalizar métricas por período e derivar CPL, CPC, CTR, conversão e ROAS.
- **Interface**: `load()`, `loadOne()`, `parsePerformanceRows()`, `getSpreadsheetId()`.
- **Lifecycle**: chamado na sincronização de mídia de um cliente; gera snapshot com períodos recentes e período atual.
- **Used by**: `src/app.js` e telas de Ads/Mídia.

### `window.V4_GROWTHPACK`
- **File**: `src/services/growthpack-dynamic.js`
- **Responsabilidade**: sincronizar clientes oficiais via endpoint de backend `/api/growthpack/{client}/summary`.
- **Interface**: `syncClient()`, `syncAll()`.
- **Lifecycle**: atua como integração dinâmica; lê estado local, aplica payloads retornados e grava de volta em `localStorage`.
- **Used by**: `src/services/integrations.js` e fluxos de refresh/sync fora da UI principal.

### `window.V4_GROWTHPACK_CLIENTS`
- **File**: `src/services/growthpack-data.js`
- **Responsabilidade**: registrar os clientes oficiais ST1 e Prime com fallback de relatórios, tarefas e snapshots.
- **Interface**: mapa de clientes com metadados de planilhas, Ekyte e base de comunicação.
- **Lifecycle**: aplicado diretamente ao seed e reaplicado ao estado persistido para garantir consistência inicial.
- **Used by**: `growthpack-dynamic.js`, `app.js`, `official-runtime-fix.js`.

### `window.V4_EKYTE`
- **File**: `src/services/ekyte-integration.js`
- **Responsabilidade**: buscar tasks no eKyte, normalizar campos heterogêneos e injetar tasks/planos no estado.
- **Interface**: `getConfig()`, `saveConfig()`, `setToken()`, `sync()`, `syncAll()`, `normalizeTask()`.
- **Lifecycle**: funciona sob demanda; suporta modo proxy e modo direto com token local.
- **Used by**: `src/services/integrations.js` e qualquer rotina que precise consolidar execução operacional.

### `window.V4_INTEGRATIONS`
- **File**: `src/services/integrations.js`
- **Responsabilidade**: catálogo central de endpoints e orquestrador de sync agregado.
- **Interface**: `syncAll()`, `endpoints`, `growthPack`, `ekyte`, `notes`.
- **Lifecycle**: carregado no boot como documentação executável das integrações.
- **Used by**: tela de configurações gerais e módulos de sincronia.

### `window.V4_FCA`-like dashboard injector
- **File**: `src/services/fca-dashboard.js`
- **Responsabilidade**: ler a planilha FCA “Cockpit Overview”, localizar a linha do cliente ativo por alias e renderizar diagnóstico operacional.
- **Interface**: injeta uma aba “FCA”, busca CSV, transforma campos e monta dashboards contextualizados.
- **Lifecycle**: observa mutações da UI e insere a aba quando o rail de tabs de cliente aparece.
- **Used by**: apenas o cliente ativo na tela de cliente; depende de `localStorage` para detectar escopo.

### `window.V4_CLIENT_LOGOS`
- **File**: `src/services/client-branding.js`
- **Responsabilidade**: substituir o avatar do cliente e a marca no card de identidade por logos reais do Google Drive, com fallback seguro.
- **Interface**: mapa `clientId -> logo fileId/title/source`.
- **Lifecycle**: observa o DOM e re-aplica branding sempre que a sidebar ou o hero do cliente é recriada.
- **Used by**: componentes visuais da sidebar e do hero do cliente.

## Data Flow
1. **Boot e normalização**
   - `index.html` carrega `src/data/seed.js`.
   - `src/data/active-clients.js` e `src/services/official-runtime-fix.js` substituem/ajustam o seed para a base oficial e removem estado legado incompatível.
   - O estado final passa a existir em `localStorage`.

2. **Montagem da UI**
   - `src/app.js` lê o estado, define a rota inicial e monta sidebar + main.
   - A renderização é toda string-based, então qualquer mudança relevante dispara novo `render()`.

3. **Navegação**
   - Clique em cliente altera `route.scope = 'client'`.
   - Clique em “Painel Geral” ou “Configurações Gerais” alterna o escopo global.
   - A aba interna do cliente é controlada por `route.tab`.

4. **Leitura de CRM**
   - Ao acionar “Sincronizar CRM agora”, `syncCrmClient()` chama `window.V4_CRM_SHEETS.load(client.crmSheet)`.
   - O módulo baixa CSV via Google Sheets/proxy, identifica cabeçalho, agrega métricas e retorna snapshot.
   - O snapshot é salvo em `state.crmSnapshots[client.id]`.

5. **Leitura de performance**
   - Ao acionar “Sincronizar mídia agora”, `syncPerformanceClient()` chama `window.V4_PERFORMANCE_SHEETS.load(client.performanceSheets)`.
   - O módulo busca mensal e semanal, parseia períodos, deriva métricas e retorna snapshot com `monthly` e `weekly`.
   - O snapshot é salvo em `state.performanceSnapshots[client.id]`.

6. **Camadas de filtro**
   - `crm-filter-panel.js` e `crm-source-filters.js` observam o DOM e adicionam filtros de período e origem sobre o snapshot de CRM.
   - Eles recalculam o snapshot filtrado e o persistem de volta em `localStorage` para a UI principal reaproveitar os dados filtrados.

7. **Integração eKyte**
   - `ekyte-integration.js` busca tasks no backend/proxy, normaliza títulos, status, progresso e associação ao cliente.
   - As tasks atualizam `state.tasks` e `state.actionPlan`, além de registrar evento de sync.

8. **Growth Pack**
   - `growthpack-data.js` injeta clientes oficiais ST1/Prime, seus fallbacks, tasks e snapshots derivados do relatório de abril/2026.
   - `growthpack-dynamic.js` permite sincronização real via endpoint `/api/growthpack/{clientId}/summary`, substituindo parte do estado com dados frescos.

9. **Branding e dashboards auxiliares**
   - `client-branding.js` e `fca-dashboard.js` observam mutações e adicionam elementos visuais sem que `app.js` precise conhecer esses detalhes.
   - Isso desacopla extensões visuais/funcionais da renderização central.

## Non-Obvious Behaviors & Design Decisions

- **Estado local como fonte de trabalho**
  - O app é desenhado para funcionar sem backend. Isso explica o uso agressivo de `localStorage` e a presença de `reset-demo`, export JSON e CRUDs diretos na UI.
  - Mesmo quando integrações reais existem, o estado local continua sendo o “workspace” da aplicação.

- **Sobrescrita de dados por runtime fix**
  - `official-runtime-fix.js` não só configura clientes, como também remove a possibilidade de dados de demo em ambientes oficiais.
  - Isso indica que o sistema precisa manter separação entre protótipo e operação real, e o código força essa separação ao boot.

- **Extensões por DOM observation**
  - `fca-dashboard.js`, `crm-filter-panel.js`, `crm-source-filters.js` e `client-branding.js` não são chamados diretamente pela app; eles observam o DOM e reagem à presença da UI.
  - Esse padrão evita acoplamento com `app.js`, mas torna a ordem de carregamento e a estabilidade dos seletores críticos para o funcionamento.

- **Abas de cliente são sobrepostas, não roteadas por URL**
  - A navegação interna é controlada por um objeto `route` em memória, sem router real ou URLs dedicadas.
  - Isso simplifica o protótipo, mas significa que deep-linking e estado compartilhável não existem de forma nativa.

- **Snapshots são mutáveis e regravados**
  - Depois de cada sync, o snapshot fica armazenado no estado e alguns módulos de filtro podem sobrescrevê-lo com a versão filtrada.
  - Em outras palavras, o snapshot não é apenas cache; ele é parte da fonte de verdade da interface.

- **Campos e planilhas toleram variação**
  - Os parsers de CRM e performance tentam mapear múltiplas variações de cabeçalho e tratar CSV com formatos híbridos.
  - Isso mostra que a base real vem de planilhas operadas manualmente, com nomes de colunas nem sempre padronizados.

- **Growth Pack como fallback de operação**
  - `growthpack-data.js` já injeta métricas, tasks e planos derivados de relatórios fallback, mesmo sem sync real.
  - O objetivo é manter o painel “vivo” e útil antes da conexão definitiva com backend/Sheets.

- **FCA é um overlay semântico**
  - O dashboard FCA não substitui a tela de cliente; ele é uma aba adicional inserida por selector quando o cliente ativo tem alias conhecido.
  - A base oficial FCA é tratada como uma fonte paralela de diagnóstico operacional, não como parte do modelo principal.

- **Conectores nunca assumem token no front-end**
  - O código insiste em proxy/N8N para produção, e o modo direto do eKyte é explicitamente tratado como exceção de teste local.
  - Isso é uma decisão de segurança importante: o front-end é o consumidor de dados, não o repositório de credenciais.

- **Algumas estruturas são “preparadas”, não completas**
  - Existem telas e campos para eKyte, drawflow, campanhas, criativos, metas e configuração de cliente, mas muita coisa é CRUD local ou placeholder de integração.
  - Isso sugere uma base de produto em amadurecimento, com o modelo de dados já alinhado ao futuro backend.

## Module Reference

| File | Purpose |
|------|---------|
| `index.html` | Shell da aplicação; carrega CSS, templates e scripts na ordem correta. |
| `package.json` | Scripts mínimos de desenvolvimento/teste. |
| `README.md` | Descrição funcional e instruções de uso/deploy. |
| `src/app.js` | Orquestrador principal da UI, do estado e dos eventos. |
| `src/styles.css` | Estilos base do painel. |
| `src/data/seed.js` | Estado inicial com clientes, métricas, integrações e eventos. |
| `src/data/active-clients.js` | Base oficial de clientes ativos, guardrails e configuração de crescimento. |
| `src/services/official-runtime-fix.js` | Hidrata o seed e o storage com a base oficial, removendo legado. |
| `src/services/integrations.js` | Catálogo central de endpoints e sync agregada. |
| `src/services/growthpack-data.js` | Fallback e seed oficial de Growth Pack por cliente. |
| `src/services/growthpack-dynamic.js` | Sincronização dinâmica de Growth Pack via backend/API. |
| `src/services/ekyte-integration.js` | Integração e normalização de tasks eKyte. |
| `src/services/fca-dashboard.js` | Overlay FCA com leitura de planilha oficial e diagnóstico. |
| `src/services/client-branding.js` | Branding dinâmico por cliente com logos do Drive. |
| `src/services/crm-filter-panel.js` | Filtro temporal e por origem sobre snapshot de CRM. |
| `src/services/crm-source-filters.js` | Variante/aperfeiçoamento de filtro de origem e período para CRM. |
| `src/services/sheets-crm.js` | Leitura e agregação da BASE_CRM em CSV. |
| `src/services/sheets-performance.js` | Leitura e agregação de mídia mensal e semanal. |
| `src/services/responsive-client-branding.css` | Ajustes responsivos de branding. |
| `src/services/ekyte-ui.js` | Complemento visual de eKyte. |
| `docs/EKYTE_INTEGRATION.md` | Guia de integração do eKyte. |
| `docs/GROWTHPACK_DYNAMIC_DATA.md` | Guia da camada Growth Pack dinâmica. |
| `alphaville-integrations-ready/` | Materiais auxiliares de integração para Alphaville. |
| `alphaville-pull-data-fallback/` | Fallback/documentação auxiliar para extração de dados. |

## Suggested Reading Order
1. `src/app.js` — para entender o esqueleto da aplicação, o estado, as rotas e como tudo é renderizado.
2. `src/data/seed.js` — para ver o formato real do estado e quais entidades o painel conhece.
3. `src/services/official-runtime-fix.js` — para entender a política oficial de dados e como o runtime é “travado”.
4. `src/services/sheets-crm.js` — para entender o parser central de CRM e a origem do relatório de perdas.
5. `src/services/sheets-performance.js` — para entender como a mídia mensal/semanal é normalizada.
6. `src/services/ekyte-integration.js` e `src/services/growthpack-data.js` — para ver como dados operacionais entram no painel sem backend direto.