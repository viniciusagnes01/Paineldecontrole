# Contrato N8N / Backend - Base de Comunicação Real

## Objetivo
Substituir o antigo auto-sync por leitura real sob demanda das bases XLSX oficiais de Espaço Master e ST1 Internet.

O front-end não deve conter token do Google Drive, eKyte, Evolution ou qualquer outra API. Ele deve chamar apenas o proxy seguro.

## Endpoints

### `GET /api/communication-base/espaco-master`
Ler no Drive o arquivo `BASE_COMUNICACAO_Espaco_Master.xlsx`:

- `driveFileId`: `1GU8tVEzA9sSMToJDlhnzp0rTQqWQb_1E`
- `mimeType`: `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`
- pasta do cliente: `1tQgluKulSRjbMB6p0iZbUQ4x6UsDeiCC`
- grupo Evolution/WhatsApp: `120363424198629431@g.us`

### `GET /api/communication-base/st1-internet`
Ler no Drive o arquivo `BASE_COMUNICACAO_ST1_Internet.xlsx`:

- `driveFileId`: `1b2WIFOrC5cCP0npwqAXynnyt8Zd9zDxp`
- `mimeType`: `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`
- pasta do cliente: `1IOElrGUmuVZ37Rqr443lGHdKiJIuVMxw`
- grupo Evolution/WhatsApp: `120363403300629023@g.us`

## Abas esperadas

- `README`
- `Dashboard`
- `config`
- `clientes`
- `stakeholders`
- `mensagens`
- `aprovacoes`
- `pendencias`
- `promessas`
- `riscos`
- `resumos_ia`
- `contexto_cliente`
- `ekyte_config`
- `social_media_historico`
- `listas`

## Payload recomendado

```json
{
  "clientId": "espaco-master",
  "clientName": "Espaço Master",
  "source": {
    "kind": "google-drive-xlsx",
    "driveFileId": "1GU8tVEzA9sSMToJDlhnzp0rTQqWQb_1E",
    "fileName": "BASE_COMUNICACAO_Espaco_Master.xlsx",
    "mimeType": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "generatedAt": "2026-05-19 13:11:32",
    "modifiedTime": "2026-05-19T13:21:16.000Z"
  },
  "dashboard": {
    "mensagensRegistradas": 0,
    "alertasPendentes": 0,
    "aprovacoesAguardando": 0,
    "pendenciasAbertas": 0,
    "promessasEmAberto": 0,
    "riscosAtivos": 0,
    "prioridadeMedia": 0,
    "ultimaMensagem": ""
  },
  "config": {
    "cliente": "Espaço Master",
    "approvalKey": "ESPACOMASTER",
    "grupoWhatsappId": "120363424198629431",
    "grupoWhatsappJid": "120363424198629431@g.us",
    "nicho": "Residencial sênior",
    "palavrasChaveDrive": "Espaço Master, idosos, residencial sênior",
    "pastaDriveId": "1tQgluKulSRjbMB6p0iZbUQ4x6UsDeiCC",
    "statusAutomacao": "preparada"
  },
  "contextoCliente": {},
  "ekyteConfig": {},
  "stakeholders": [],
  "socialMediaHistorico": [],
  "tableStatus": {}
}
```

## Regra de segurança
O cliente recebe somente a resposta aprovada. Análise, risco, prioridade e sugestão de resposta ficam internos no painel.
