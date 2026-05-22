(function () {
  window.V4_MONITORING_ALERTS_CONFIG = Object.freeze({
    provider: 'evolution_whatsapp',
    credentialsLocation: 'server_environment_variables_only',
    alertStrategy: 'single_central_monitoring_engine',
    defaultRecipient: {
      name: 'Vinicius Agnes',
      channel: 'whatsapp',
      phoneE164: ''
    },
    checks: {
      landingPages: {
        enabled: true,
        label: 'LP online/offline',
        severityWhenDown: 'critical',
        intervalMinutes: 15,
        timeoutMs: 12000
      },
      gtmContainer: {
        enabled: true,
        label: 'GTM instalado/publicado',
        severityWhenMissing: 'warning',
        intervalMinutes: 60
      },
      ga4Events: {
        enabled: true,
        label: 'GA4 recebendo eventos',
        severityWhenSilent: 'warning',
        silentHoursThreshold: 24,
        intervalMinutes: 180
      },
      metaPixel: {
        enabled: true,
        label: 'Pixel Meta ativo',
        severityWhenSilent: 'warning',
        silentHoursThreshold: 24,
        intervalMinutes: 180
      },
      googleAdsConnection: {
        enabled: true,
        label: 'Google Ads conectado',
        severityWhenError: 'warning',
        intervalMinutes: 180
      },
      metaAdsConnection: {
        enabled: true,
        label: 'Meta Ads conectado',
        severityWhenError: 'warning',
        intervalMinutes: 180
      },
      growthPackApi: {
        enabled: true,
        label: 'GrowthPack/API funcionando',
        severityWhenError: 'warning',
        intervalMinutes: 120
      },
      crmSource: {
        enabled: true,
        label: 'CRM/fonte alternativa funcionando',
        severityWhenError: 'warning',
        intervalMinutes: 180
      }
    },
    clients: {
      alphaville: { enabled: true, landingPages: [], alertPhoneE164: '' },
      yousafer: { enabled: true, landingPages: [], alertPhoneE164: '' },
      prime: { enabled: true, landingPages: [], alertPhoneE164: '' },
      multimed: { enabled: true, landingPages: [], alertPhoneE164: '' },
      'seg-eletronic': { enabled: true, landingPages: [], alertPhoneE164: '' },
      'espaco-master': { enabled: true, landingPages: [], alertPhoneE164: '' },
      'st1-internet': { enabled: true, landingPages: [], alertPhoneE164: '' }
    },
    alertTemplates: {
      critical: '🚨 ALERTA V4 Command Center\n\nCliente: {{clientName}}\nProblema: {{problem}}\nDetalhe: {{detail}}\nDetectado em: {{detectedAt}}\n\nAção sugerida:\n{{suggestedAction}}',
      warning: '⚠️ ALERTA V4 Command Center\n\nCliente: {{clientName}}\nProblema: {{problem}}\nDetalhe: {{detail}}\nDetectado em: {{detectedAt}}\n\nAção sugerida:\n{{suggestedAction}}',
      recovered: '✅ Recuperado V4 Command Center\n\nCliente: {{clientName}}\nItem: {{problem}}\nStatus: voltou a funcionar\nDetectado em: {{detectedAt}}'
    },
    notes: [
      'Evolution API deve ser chamada somente no backend/Vercel.',
      'O front-end apenas exibe status de monitoramento e histórico de alertas.',
      'Cada alerta deve ter deduplicação para evitar spam no WhatsApp.',
      'Alertas críticos: LP fora do ar, API indisponível, falha geral de tracking.',
      'Alertas de aviso: Pixel/GA4 sem evento, conta Ads desconectada, CRM pendente.'
    ]
  });
})();
