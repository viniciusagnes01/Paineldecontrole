# V4 Command Center - Instalacao das dependencias reais

Este pacote transforma o painel estatico em um sistema com backend seguro para ler dados reais do Google Drive/Sheets sem expor tokens no front-end.

## O que este pacote adiciona

- `package.json` com dependencias Node.js.
- Backend Express em `server/src/index.js`.
- Leitor seguro de XLSX do Google Drive com `googleapis` + `xlsx`.
- Endpoints reais para bases de comunicacao:
  - `GET /api/communication-base/espaco-master`
  - `POST /api/communication-base/espaco-master/sync`
  - `GET /api/communication-base/st1-internet`
  - `POST /api/communication-base/st1-internet/sync`
- Arquivo front-end opcional `src/services/runtime-api.js` para consumir o backend.
- Scripts de instalacao local.

## Pre-requisitos

- Node.js 18.18 ou superior.
- NPM.
- Uma service account Google com permissao de leitura nos arquivos do Drive.
- Os arquivos abaixo compartilhados com o e-mail da service account:
  - `BASE_COMUNICACAO_Espaco_Master.xlsx`
  - `BASE_COMUNICACAO_ST1_Internet.xlsx`

## Instalacao

Copie os arquivos deste pacote para a raiz do repositorio `Paineldecontrole`.

Depois rode:

```bash
chmod +x install-dependencies.sh start-local-real.sh
./install-dependencies.sh
```

No Windows:

```bat
npm install
copy .env.example .env
```

## Configuracao do Google

Crie a pasta `secrets` na raiz do projeto e salve o JSON da service account em:

```text
secrets/google-service-account.json
```

Depois confira o `.env`:

```env
PORT=5174
CORS_ORIGIN=http://localhost:5173
GOOGLE_APPLICATION_CREDENTIALS=./secrets/google-service-account.json
CACHE_TTL_SECONDS=120
COMMUNICATION_BASE_ESPACO_MASTER=1GU8tVEzA9sSMToJDlhnzp0rTQqWQb_1E
COMMUNICATION_BASE_ST1_INTERNET=1b2WIFOrC5cCP0npwqAXynnyt8Zd9zDxp
```

## Execucao

Backend/API:

```bash
npm run check
npm run dev
```

Painel estatico, em outro terminal:

```bash
python3 -m http.server 5173
```

Acesse:

```text
http://localhost:5173
```

Teste a API:

```bash
curl http://localhost:5174/health
curl http://localhost:5174/api/communication-base/espaco-master
curl http://localhost:5174/api/communication-base/st1-internet
```

## Como conectar no front-end

Inclua no `index.html`, antes de `src/app.js`:

```html
<script>
  window.V4_RUNTIME_API_URL = 'http://localhost:5174';
</script>
<script src="src/services/runtime-api.js?v=real-runtime-20260522"></script>
```

Remova o carregamento do auto-sync antigo:

```html
<!-- remover -->
<script src="src/services/auto-refresh.js?v=official-all-clients-20260519-02"></script>
```

## Observacao importante

O front-end nao deve guardar tokens do Google, Ekyte, Meta, Evolution ou qualquer API sensivel. O navegador chama apenas o backend local/N8N, e o backend faz a leitura real.
