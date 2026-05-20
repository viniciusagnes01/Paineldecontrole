
import os
import json
from datetime import datetime, timedelta
from dotenv import load_dotenv

# Carrega variáveis de ambiente do arquivo .env
load_dotenv()

# Google Ads API
from google.ads.googleads.client import GoogleAdsClient
from google.ads.googleads.errors import GoogleAdsException

# Meta Ads API
from facebook_business.api import FacebookAdsApi
from facebook_business.adobjects.adaccount import AdAccount
from facebook_business.adobjects.adsinsights import AdsInsights

# Google Sheets API
import gspread
from google.oauth2.service_account import Credentials

# --- Configurações (Preencher com suas credenciais e IDs no arquivo .env) ---

# Google Ads API
GOOGLE_ADS_CLIENT_ID = os.getenv("GOOGLE_ADS_CLIENT_ID")
GOOGLE_ADS_CLIENT_SECRET = os.getenv("GOOGLE_ADS_CLIENT_SECRET")
GOOGLE_ADS_DEVELOPER_TOKEN = os.getenv("GOOGLE_ADS_DEVELOPER_TOKEN")
GOOGLE_ADS_REFRESH_TOKEN = os.getenv("GOOGLE_ADS_REFRESH_TOKEN")
GOOGLE_ADS_LOGIN_CUSTOMER_ID = os.getenv("GOOGLE_ADS_LOGIN_CUSTOMER_ID")

# Meta Ads API
META_ADS_APP_ID = os.getenv("META_ADS_APP_ID")
META_ADS_APP_SECRET = os.getenv("META_ADS_APP_SECRET")
META_ADS_ACCESS_TOKEN = os.getenv("META_ADS_ACCESS_TOKEN")

# Google Sheets API (Service Account)
GOOGLE_SHEETS_SERVICE_ACCOUNT_PATH = os.getenv("GOOGLE_SHEETS_SERVICE_ACCOUNT_PATH", "./service_account.json")

# Lista de projetos e seus respectivos IDs de planilhas e IDs de contas de anúncios
PROJECTS = [
    {
        'name': 'Alphaville',
        'spreadsheet_id': '1CtfFiB0q2B72Cwb9VjTkv8gZHYtBv2keICwBNj7Z0ws',
        'google_ads_customer_id': 'YOUR_ALPHAVILLE_GOOGLE_ADS_ID',
        'meta_ads_account_id': 'YOUR_ALPHAVILLE_META_ADS_ID'
    },
    {
        'name': 'YouSafer',
        'spreadsheet_id': '1KLxctUK2ZGaM7jm1y2zj-StwLTgV6qP0PL1a-ZEnMmo',
        'google_ads_customer_id': 'YOUR_YOUSAFTER_GOOGLE_ADS_ID',
        'meta_ads_account_id': 'YOUR_YOUSAFTER_META_ADS_ID'
    },
    {
        'name': 'Prime Mecânica',
        'spreadsheet_id': '1h6-xdgyekZrNLZ4luZU61S0hzh0Z-HLAZR7qCm8NQG8',
        'google_ads_customer_id': 'YOUR_PRIME_GOOGLE_ADS_ID',
        'meta_ads_account_id': 'YOUR_PRIME_META_ADS_ID'
    },
    {
        'name': 'MultiMed',
        'spreadsheet_id': '1h4obelICw7z1rbYNaEdkbrCH-qYUhFttzW3SopNxodg',
        'google_ads_customer_id': 'YOUR_MULTIMED_GOOGLE_ADS_ID',
        'meta_ads_account_id': 'YOUR_MULTIMED_META_ADS_ID'
    },
    {
        'name': 'Treinando Online',
        'spreadsheet_id': '1rnD4jIpKfX5DAQMETQhOG-ULg81iAglJoej_AY8ArvA',
        'google_ads_customer_id': 'YOUR_TREINANDO_ONLINE_GOOGLE_ADS_ID',
        'meta_ads_account_id': 'YOUR_TREINANDO_ONLINE_META_ADS_ID'
    },
    {
        'name': 'Seg Eletronic',
        'spreadsheet_id': '1-CSmqLVLbfwVuVxkez4Q38fSTkVzyGOudUmj_GIxHAc',
        'google_ads_customer_id': 'YOUR_SEG_ELETRONIC_GOOGLE_ADS_ID',
        'meta_ads_account_id': 'YOUR_SEG_ELETRONIC_META_ADS_ID'
    },
    {
        'name': 'ST1 Internet',
        'spreadsheet_id': '1BurqRDqYbWq8dPVxXiKjWH6WmfBNoe39AymwJM8LpFA',
        'google_ads_customer_id': 'YOUR_ST1_INTERNET_GOOGLE_ADS_ID',
        'meta_ads_account_id': 'YOUR_ST1_INTERNET_META_ADS_ID'
    }
]

# --- Funções Auxiliares ---

def is_configured(value):
    """Verifica se um valor de ID foi configurado (não é um placeholder)."""
    return value and not str(value).startswith("YOUR_")

# --- Funções de Coleta de Dados ---

def get_google_ads_data(customer_id, google_ads_client):
    """Coleta dados do Google Ads para um cliente específico."""
    print(f"Coletando dados do Google Ads para o cliente: {customer_id}")
    ga_service = google_ads_client.get_service("GoogleAdsService")

    end_date = datetime.now()
    start_date = end_date - timedelta(days=7)

    query = f"""
        SELECT
            segments.date,
            campaign.name,
            metrics.impressions,
            metrics.clicks,
            metrics.cost_micros,
            metrics.conversions
        FROM campaign
        WHERE segments.date BETWEEN '{start_date.strftime('%Y-%m-%d')}' AND '{end_date.strftime('%Y-%m-%d')}'
        ORDER BY segments.date DESC
    """

    data = []
    headers = ["Date", "Campaign Name", "Impressions", "Clicks", "Cost", "Conversions"]
    data.append(headers)

    try:
        customer_id_clean = customer_id.replace('-', '')
        response = ga_service.search(customer_id=customer_id_clean, query=query)

        for row in response:
            date = row.segments.date
            campaign_name = row.campaign.name
            impressions = row.metrics.impressions
            clicks = row.metrics.clicks
            cost = row.metrics.cost_micros / 1_000_000
            conversions = row.metrics.conversions
            data.append([date, campaign_name, impressions, clicks, cost, conversions])
    except GoogleAdsException as ex:
        print(f"Erro na API do Google Ads: {ex}")
        return []
    except Exception as e:
        print(f"Erro inesperado no Google Ads: {e}")
        return []

    return data

def get_meta_ads_data(account_id):
    """Coleta dados do Meta Ads para uma conta específica."""
    print(f"Coletando dados do Meta Ads para a conta: {account_id}")

    end_date = datetime.now()
    start_date = end_date - timedelta(days=7)

    params = {
        'time_range': {
            'since': start_date.strftime('%Y-%m-%d'),
            'until': end_date.strftime('%Y-%m-%d')
        },
        'level': 'campaign',
        'fields': 'campaign_name,impressions,clicks,spend,conversions',
    }

    data = []
    headers = ["Date", "Campaign Name", "Impressions", "Clicks", "Spend", "Conversions"]
    data.append(headers)

    try:
        account = AdAccount(account_id)
        insights = account.get_insights(fields=params['fields'].split(','), params=params)

        for insight in insights:
            date = insight['date_start']
            campaign_name = insight.get('campaign_name', 'N/A')
            impressions = insight.get('impressions', 0)
            clicks = insight.get('clicks', 0)
            spend = insight.get('spend', 0.0)
            conversions = insight.get('conversions', [{'action_type': 'N/A', 'value': 0}])
            total_conversions = sum([float(c['value']) for c in conversions if 'value' in c])

            data.append([date, campaign_name, impressions, clicks, float(spend), total_conversions])
    except Exception as e:
        print(f"Erro ao coletar dados do Meta Ads: {e}")
        return []

    return data

# --- Funções de Atualização do Google Sheets ---

def update_google_sheet(spreadsheet_id, sheet_name, data):
    """Atualiza uma aba específica em uma planilha do Google Sheets."""
    print(f"Atualizando planilha {spreadsheet_id}, aba {sheet_name}")
    try:
        scope = ["https://spreadsheets.google.com/feeds", "https://www.googleapis.com/auth/drive"]
        creds = Credentials.from_service_account_file(GOOGLE_SHEETS_SERVICE_ACCOUNT_PATH, scopes=scope)
        client = gspread.authorize(creds)

        spreadsheet = client.open_by_id(spreadsheet_id)
        worksheet = spreadsheet.worksheet(sheet_name)

        if data:
            worksheet.clear()
            worksheet.update(data, value_input_option='RAW')
            print(f"Planilha {sheet_name} atualizada com sucesso.")
        else:
            print(f"Nenhum dado para atualizar na planilha {sheet_name}.")
    except Exception as e:
        print(f"Erro ao atualizar a planilha {sheet_name}: {e}")

# --- Função Principal ---

def main():
    print("Iniciando a coleta e atualização de dados de anúncios...")

    # Inicializa o cliente do Google Ads
    google_ads_client = None
    try:
        google_ads_client = GoogleAdsClient.load_from_dict({
            'developer_token': GOOGLE_ADS_DEVELOPER_TOKEN,
            'refresh_token': GOOGLE_ADS_REFRESH_TOKEN,
            'client_id': GOOGLE_ADS_CLIENT_ID,
            'client_secret': GOOGLE_ADS_CLIENT_SECRET,
            'login_customer_id': GOOGLE_ADS_LOGIN_CUSTOMER_ID
        })
    except Exception as e:
        print(f"Aviso: Google Ads não inicializado. Verifique suas credenciais no .env.")

    # Inicializa o cliente do Meta Ads
    try:
        FacebookAdsApi.init(META_ADS_APP_ID, META_ADS_APP_SECRET, META_ADS_ACCESS_TOKEN)
    except Exception as e:
        print(f"Aviso: Meta Ads não inicializado. Verifique suas credenciais no .env.")

    for project in PROJECTS:
        print(f"\nProcessando projeto: {project['name']}")

        # Google Ads
        if google_ads_client and is_configured(project.get('google_ads_customer_id')):
            google_ads_data = get_google_ads_data(project['google_ads_customer_id'], google_ads_client)
            if google_ads_data:
                update_google_sheet(project['spreadsheet_id'], 'bd Google Ads', google_ads_data)
        
        # Meta Ads
        if META_ADS_ACCESS_TOKEN and is_configured(project.get('meta_ads_account_id')):
            meta_ads_data = get_meta_ads_data(project['meta_ads_account_id'])
            if meta_ads_data:
                update_google_sheet(project['spreadsheet_id'], 'bd Meta Ads', meta_ads_data)

    print("\nProcesso concluído.")

if __name__ == '__main__':
    main()
