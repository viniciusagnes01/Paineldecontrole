# Integração eKyte Data-Driven no V4 Command Center

## Decisão de arquitetura

O eKyte deve entrar no Command Center apenas como fonte operacional de execução:

- tasks atuais;
- Gantt / revisão do playbook;
- responsável, prazo, prioridade e status;
- plano de ação derivado das tasks.

Mídia, campanhas, redes sociais, CPL, CTR, investimento e funil continuam vindo das fontes já existentes do painel: Google Sheets, Meta Ads, Google Ads e CRM. Isso evita duplicidade e mantém o eKyte como camada de acompanhamento de execução.

## Segurança

Não coloque o token de acesso do eKyte no repositório nem no front-end. Configure o token em um backend ou fluxo N8N.

Variáveis recomendadas no proxy:

```bash
EKYTE_COMPANY_ID=7773
EKYTE_ACCESS_TOKEN=coloque_o_token_no_backend_ou_n8n
EKYTE_BASE_URL=https://endpoint-real-da-api-ekyte
```

## Contrato esperado pelo front-end

O front-end chama:

```text
GET /api/ekyte/tasks?companyId=7773&resource=tasks
```

O proxy deve responder um array ou um objeto com uma destas chaves:

```json
{
  "data": [
    {
      "id": "9129213",
      "title": "Acompanhar execucao do plano de acao",
      "status": "Em execução",
      "owner": "vinicius.agnes@v4company.com",
      "taskTypeId": "13915",
      "priority": "Alta",
      "startDate": "2026-05-19",
      "dueDate": "2026-05-24",
      "client": "ST1 Internet",
      "url": "https://app.ekyte.com/#/tasks/list/9129213/edit"
    }
  ]
}
```

Também são aceitas chaves em português vindas de exportações/Power BI, como `TITULO`, `DATA INICIO`, `DATA ENTREGA`, `TIPO DE TAREFA`, `EMAIL EXECUTOR`, `PRIORIDADE` e `DESCRICAO`.

## Tipos tratados como relevantes

O filtro mantém apenas itens que fazem sentido para o Command Center:

- 42: Analise / Auditoria;
- 13899: Diagnostico / Planejamento;
- 13900: Auditoria de midia;
- 13901: Configuracao / Tracking;
- 13905: Persona / Oferta;
- 13906: Processo de vendas / CRM;
- 13908: CRM avancado;
- 13909: Relatorio;
- 13911: Social Media;
- 13915: Campanhas;
- 13917: Dashboard / Power BI.

## Arquivos alterados

- `index.html`: inclui `ekyte-integration.js` e `ekyte-ui.js`.
- `src/services/integrations.js`: adiciona endpoints e configuração eKyte.
- `src/services/ekyte-integration.js`: normaliza payloads da API e grava no estado local.
- `src/services/ekyte-ui.js`: adiciona o painel de sincronização no sistema sem mexer no core do `app.js`.
