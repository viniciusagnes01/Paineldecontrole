(function () {
  window.V4_MEDIA_ACCOUNTS_CONFIG = Object.freeze({
    providerMode: 'central_mcc_and_business_manager',
    credentialsLocation: 'server_environment_variables_only',
    syncStrategy: 'single_central_media_sync',
    clients: {
      alphaville: { googleCustomerId: '', metaAdAccountId: '', status: 'pending_account_ids' },
      yousafer: { googleCustomerId: '', metaAdAccountId: '', status: 'pending_account_ids' },
      prime: { googleCustomerId: '', metaAdAccountId: '', status: 'pending_account_ids' },
      multimed: { googleCustomerId: '', metaAdAccountId: '', status: 'alternative_crm_source_pending_media_ids' },
      'seg-eletronic': { googleCustomerId: '', metaAdAccountId: '', status: 'pending_account_ids' },
      'espaco-master': { googleCustomerId: '', metaAdAccountId: '', status: 'alternative_crm_source_pending_media_ids' },
      'st1-internet': { googleCustomerId: '', metaAdAccountId: '', status: 'pending_account_ids' }
    },
    notes: [
      'Credenciais de Meta e Google devem ficar somente no backend/Vercel.',
      'O front-end deve armazenar apenas ids de contas e status por cliente.',
      'Treinando Online foi removido da lista operacional.'
    ]
  });
})();
