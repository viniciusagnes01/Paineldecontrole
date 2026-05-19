# Integrações Alphaville

Esta camada adiciona o máximo de integrações já localizadas para Alphaville sem expor tokens no front-end.

## Fontes vinculadas

- GrowthPack / BASE_CRM: `1CtfFiB0q2B72Cwb9VjTkv8gZHYtBv2keICwBNj7Z0ws`
- GID BASE_CRM: `833926654`
- Atualização de Leads: `12LkM4ip_uS74DNtxFdIpPMAGyBrAPmAH8Pz0WsHT9GI`
- Relatório Mensal Abril: `1_UDzNAOXLpy2zgwW4p5lOhxfp1M2T_ZL`
- Relatório Mensal Março: `1U4xFvx6q-JOKH8DHeufk61KH0THdAorn`
- Check-in 13/05/2026: `1jgtkJk-Qa1KJupbCj8KLjTdmkvnZEokewFhdfStUzsM`
- Check-in 29/04/2026: `1GTC2DW_Bha8IWqcfJGAfw7nLVFpIn2ZyOFds67eWBSc`
- Diagnóstico e Planejamento: `1VXKR_EiLiopxEgKZRcfTwnOpuHen-rBEKbY-HrI3Kuc`

## Endpoints esperados no N8N/backend

- `/api/growthpack/alphaville/crm`
- `/api/growthpack/alphaville/performance/monthly`
- `/api/growthpack/alphaville/performance/weekly`

Enquanto esses endpoints não existirem, o painel usa fallback interno com dados confirmados por GrowthPack, relatório e check-ins.
