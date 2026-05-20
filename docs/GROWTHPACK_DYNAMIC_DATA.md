# Growth Pack dinâmico - base oficial de clientes

Esta camada puxa o máximo possível de informações dos Growth Packs localizados na base oficial de clientes. O painel mantém o escopo travado por cliente, `groupId`, pasta Drive e planilha GrowthPack para não misturar dados entre operações.

## Clientes com GrowthPack localizado

- Alphaville: `1CtfFiB0q2B72Cwb9VjTkv8gZHYtBv2keICwBNj7Z0ws`, BASE_CRM GID `833926654`.
- YouSafer: `1KLxctUK2ZGaM7jm1y2zj-StwLTgV6qP0PL1a-ZEnMmo`.
- Prime Mecânica: `1h6-xdgyekZrNLZ4luZU61S0hzh0Z-HLAZR7qCm8NQG8`, BASE_CRM GID `1986904416`.
- MultiMed: `1h4obelICw7z1rbYNaEdkbrCH-qYUhFttzW3SopNxodg`.
- Treinando Online: `1rnD4jIpKfX5DAQMETQhOG-ULg81iAglJoej_AY8ArvA`.
- Seg Eletronic: `1-CSmqLVLbfwVuVxkez4Q38fSTkVzyGOudUmj_GIxHAc`, BASE_CRM GID `1929982003`.
- ST1 Internet: `1BurqRDqYbWq8dPVxXiKjWH6WmfBNoe39AymwJM8LpFA`, BASE_CRM GID `1699545222`.

Espaço Master e SindiHoteleiros/Cuidar On continuam no escopo oficial, mas aparecem como `GrowthPack não localizado` até a fonte real ser encontrada.

## Fallback até o backend/N8N estar pronto

Enquanto o endpoint dinâmico não existir, o painel já recebe fallback apenas quando existe evidência local vinculada ao cliente, como Alphaville, ST1 Internet e Prime Mecânica:

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

O front chama `window.V4_GROWTHPACK.syncClient('id-do-cliente')` ou `window.V4_GROWTHPACK.syncAll()`. O botão **Sincronizar todos** executa GrowthPack/eKyte e tenta CRM + mídia para todos os clientes configurados.

## Segurança

Tokens de Google, Kommo, Ekyte, Meta, Google Ads e Evolution devem ficar no backend/N8N. O front recebe somente JSON tratado.
