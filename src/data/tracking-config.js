(function () {
  window.V4_TRACKING_CONFIG = Object.freeze({
    providerMode: 'client_level_ga4_and_gtm',
    credentialsLocation: 'server_environment_variables_only',
    syncStrategy: 'single_tracking_health_sync',
    clients: {
      alphaville: {
        ga4: { propertyId: '', measurementId: '', streamId: '', status: 'pending_ids' },
        gtm: { accountId: '', containerId: '', workspaceId: '', publicId: '', status: 'pending_ids' }
      },
      yousafer: {
        ga4: { propertyId: '', measurementId: '', streamId: '', status: 'pending_ids' },
        gtm: { accountId: '', containerId: '', workspaceId: '', publicId: '', status: 'pending_ids' }
      },
      prime: {
        ga4: { propertyId: '', measurementId: '', streamId: '', status: 'pending_ids' },
        gtm: { accountId: '', containerId: '', workspaceId: '', publicId: '', status: 'pending_ids' }
      },
      multimed: {
        ga4: { propertyId: '', measurementId: '', streamId: '', status: 'pending_ids' },
        gtm: { accountId: '', containerId: '', workspaceId: '', publicId: '', status: 'pending_ids' }
      },
      'seg-eletronic': {
        ga4: { propertyId: '', measurementId: '', streamId: '', status: 'pending_ids' },
        gtm: { accountId: '', containerId: '', workspaceId: '', publicId: '', status: 'pending_ids' }
      },
      'espaco-master': {
        ga4: { propertyId: '', measurementId: '', streamId: '', status: 'pending_ids' },
        gtm: { accountId: '', containerId: '', workspaceId: '', publicId: '', status: 'pending_ids' }
      },
      'st1-internet': {
        ga4: { propertyId: '', measurementId: '', streamId: '', status: 'pending_ids' },
        gtm: { accountId: '', containerId: '', workspaceId: '', publicId: '', status: 'pending_ids' }
      }
    },
    notes: [
      'GA4 propertyId e GTM containerId ficam por cliente.',
      'Credenciais OAuth/Admin API ficam somente no backend/Vercel.',
      'O front-end pode exibir status, ids públicos e saúde da medição.',
      'Treinando Online não faz parte da base operacional.'
    ]
  });
})();
