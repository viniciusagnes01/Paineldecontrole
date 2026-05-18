# V4 Command Center v6

Painel operacional responsivo para centralizar clientes, mídia paga, CRM, funil, landing pages, pixels, concorrentes SEMrush, tasks eKyte, plano de ação em drawflow, metas, configurações e relatórios de perdas.

## Como abrir localmente

Opção simples: abra `index.html` no navegador.

Opção recomendada:

```bash
cd v4-command-center-v4
python3 -m http.server 5173
```

Depois acesse `http://localhost:5173`.

No Windows, execute `start-local.bat`.

## Como subir sem domínio

Arraste a pasta para Netlify Drop ou publique como site estático no Vercel/GitHub Pages. O projeto não precisa de build.

## O que existe nesta versão

- Layout responsivo para desktop, notebook, tablet e mobile.
- Painel Geral consolidado.
- Painel de Controle por cliente.
- ST1 Internet com CRM dinâmico via `BASE_CRM`.
- ST1 Internet com mídia dinâmica via `1.0 Mensal` e `2.0 Semanal`.
- Relatório de perdas completo com motivo, responsável, origem, matriz responsável x motivo e últimos leads perdidos.
- Aba Mídia & Ads usando mensal/semanal como visão principal e Meta/Google brutos como camada de drill-down.
- Config do Cliente com edição de fontes CRM e mídia.
- Configurações Gerais com CRUD local de clientes.
- Concorrentes SEMrush, LPs, pixels, campanhas, criativos, tasks e plano de ação editáveis.
- Exportação JSON da base local.

## Dados e integrações

A versão atual salva no navegador via `localStorage`. Para produção, conecte as rotas em `src/services/integrations.js` a um backend ou N8N.

Não coloque tokens de Meta Ads, Google Ads, LinkedIn Ads, SEMrush, Moskit, Kommo, Evolution ou Google no front-end.

## Guias

- `docs/CRM_GOOGLE_SHEETS.md`
- `docs/PERFORMANCE_GOOGLE_SHEETS.md`
- `docs/RELATORIO_DE_PERDAS.md`
