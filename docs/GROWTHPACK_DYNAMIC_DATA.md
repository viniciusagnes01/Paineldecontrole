# Growth Pack dinâmico - ST1 Internet e Prime Mecânica

Este pacote adiciona uma camada de dados para puxar o máximo possível de informações dos Growth Packs de ST1 Internet e Prime Mecânica.

## Fontes configuradas

### ST1 Internet
- Growth Pack: `ST1 Internet | GrowthPack V26 (Inside Sales)`
- Spreadsheet: `1BurqRDqYbWq8dPVxXiKjWH6WmfBNoe39AymwJM8LpFA`
- BASE_CRM GID: `1699545222`
- Mensal: `1.0 Mensal`
- Semanal: `2.0 Semanal`
- Comunicação/N8N/Evolution: grupo `120363403300629023@g.us`
- Ekyte: workspace `127063`, projeto `273637`, tipo de tarefa `55820`, task modelo `8851196`

### Prime Mecânica
- Growth Pack: `Prime | GrowthPack V26 (Inside Sales)`
- Spreadsheet de performance: `1BOTJF5ymnYHZ69mhyvCUZZWqyGOEf2boeRFza3L5awI`
- Spreadsheet de leads/BASE_CRM: `1h6-xdgyekZrNLZ4luZU61S0hzh0Z-HLAZR7qCm8NQG8`
- BASE_CRM GID: `1986904416`
- Comunicação/N8N/Evolution: grupo `120363418609215409@g.us`
- Ekyte: workspace `106839`, projeto `291839`, tipo de tarefa `55820`, task modelo `8851196`

## Fallback até o backend/N8N estar pronto

Enquanto o endpoint dinâmico não existir, o painel já recebe os dados do relatório mensal de abril/2026 como fallback:

- métricas gerais;
- divisão Meta Ads / Google Ads;
- aprendizados;
- plano de ação;
- tasks operacionais;
- snapshots de CRM e performance.

## Endpoint recomendado

Criar no N8N/backend:

```txt
GET /api/growthpack/:clientId/summary
```

Resposta sugerida:

```json
{
  "client": {},
  "crmSnapshot": {},
  "performanceSnapshot": {},
  "tasks": [],
  "actionPlan": []
}
```

O front chama `window.V4_GROWTHPACK.syncClient('st1-internet')`, `window.V4_GROWTHPACK.syncClient('prime')` ou `window.V4_GROWTHPACK.syncAll()`.

## Segurança

Tokens de Google, Kommo, Ekyte, Meta, Google Ads e Evolution devem ficar no backend/N8N. O front recebe somente JSON tratado.
