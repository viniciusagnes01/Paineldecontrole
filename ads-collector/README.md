# Coletor de Dados de Anúncios (Google & Meta)

Este script automatiza a coleta de métricas do Google Ads e Meta Ads e as envia diretamente para as abas `bd Google Ads` e `bd Meta Ads` das planilhas Growth Pack.

## 🚀 Como Configurar

1. **Instalação de Dependências:**
   ```bash
   python3 -m venv .venv
   source .venv/bin/activate  # No Windows: .venv\Scripts\activate
   pip install -r requirements.txt
   ```

2. **Configuração de Credenciais:**
   - Renomeie o arquivo `.env.example` para `.env`.
   - Preencha as chaves da API conforme o guia de credenciais.
   - Coloque o arquivo `service_account.json` nesta pasta.

3. **IDs dos Clientes:**
   - No arquivo `ads_data_collector.py`, substitua os placeholders `YOUR_..._ID` pelos IDs reais das contas de anúncios de cada cliente.

4. **Execução:**
   ```bash
   python ads_data_collector.py
   ```

## ⚠️ Segurança
O arquivo `.gitignore` na raiz do projeto está configurado para **não enviar** o arquivo `.env` e `service_account.json` para o GitHub. Nunca remova essa proteção.
