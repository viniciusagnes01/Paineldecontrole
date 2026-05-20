// Sistema de identidade visual e branding dos clientes via Google Drive
(function () {
  const CACHE_KEY = 'v4-client-logos-cache';
  const CACHE_TTL = 5 * 60 * 1000; // 5 minutos

  const BRANDING_CONFIG = {
    alphaville: {
      folderId: '1lG21qv4S7LCWhHe7gBw73NPlDSJ4m-yi',
      buscarPor: ['logo', 'identidade', 'marca'],
      tipo: 'logo'
    },
    yousafer: {
      folderId: '1Iz2nt_MwESsFCeAZD6z9IjQ8fz45iRmY',
      buscarPor: ['logo', 'identidade', 'marca'],
      tipo: 'logo'
    },
    prime: {
      folderId: '1ynLKciynIzr7gVtgiq3fy5IoTranCFAn',
      buscarPor: ['logo', 'identidade', 'marca'],
      tipo: 'logo'
    },
    multimed: {
      folderId: '1H5kekxtbt-67S4K_ZB9ip_Qag6h9GupB',
      buscarPor: ['logo', 'identidade', 'marca'],
      tipo: 'logo'
    },
    'seg-eletronic': {
      folderId: '1naqEp5-RMWz7XEvsl50T5jpG2ecNDMDW',
      buscarPor: ['logo', 'identidade', 'marca'],
      tipo: 'logo'
    },
    'espaco-master': {
      folderId: '1tQgluKulSRjbMB6p0iZbUQ4x6UsDeiCC',
      buscarPor: ['logo', 'identidade', 'marca'],
      tipo: 'logo'
    },
    'st1-internet': {
      folderId: '1IOElrGUmuVZ37Rqr443lGHdKiJIuVMxw',
      buscarPor: ['logo', 'identidade', 'marca'],
      tipo: 'logo'
    },
    'sindi-hoteleiros': {
      folderId: '17q8l0y5OhxL5qBtbv3RzyDUUVSL9nAPy',
      buscarPor: ['logo', 'identidade', 'marca'],
      tipo: 'logo'
    },
    'treinando-online': {
      folderId: '1Ofe7NY2WooeZFTWvH3zmeK8W1AaEAl9n',
      buscarPor: ['logo', 'identidade', 'marca'],
      tipo: 'logo'
    }
  };

  // Funções auxiliares
  function getCache() {
    try {
      const stored = localStorage.getItem(CACHE_KEY);
      if (!stored) return {};
      const { data, timestamp } = JSON.parse(stored);
      if (Date.now() - timestamp > CACHE_TTL) {
        localStorage.removeItem(CACHE_KEY);
        return {};
      }
      return data || {};
    } catch (error) {
      return {};
    }
  }

  function setCache(data) {
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify({
        data,
        timestamp: Date.now()
      }));
    } catch (error) {
      console.warn('[Branding] Erro ao cachear:', error);
    }
  }

  function getThumbnailUrl(fileId, size = 'w400') {
    return `https://drive.google.com/thumbnail?id=${fileId}&sz=${size}`;
  }

  // Carregar logo de um cliente
  async function loadClientLogo(clientId) {
    const cache = getCache();
    if (cache[clientId]?.url) {
      return cache[clientId];
    }

    const config = BRANDING_CONFIG[clientId];
    if (!config) return null;

    // Para este protótipo, retornamos null pois não temos acesso direto à API Google Drive
    // Em produção, você usaria uma integração N8N ou uma API proxy
    return null;
  }

  // Aplicar logo a um elemento
  function applyLogoToElement(element, clientId) {
    if (!element) return;

    element.dataset.clientId = clientId;
    element.classList.add('branding-loading');

    // Tentar carregar do cache primeiro
    const cache = getCache();
    if (cache[clientId]?.url) {
      renderLogo(element, cache[clientId]);
      return;
    }

    // Se não estiver em cache, usar fallback com iniciais
    const fallback = element.textContent.trim();
    element.dataset.fallback = fallback;
  }

  function renderLogo(element, logoData) {
    if (!element || !logoData?.url) return;

    const img = document.createElement('img');
    img.src = logoData.url;
    img.alt = '';
    img.loading = 'lazy';
    img.referrerPolicy = 'no-referrer';
    img.className = 'client-branding-img';

    img.onerror = () => {
      element.classList.remove('branding-loading');
      element.textContent = element.dataset.fallback || 'V4';
    };

    img.onload = () => {
      element.classList.remove('branding-loading');
      element.textContent = '';
      element.appendChild(img);
      element.classList.add('branding-loaded');
    };

    element.appendChild(img);
  }

  // Aplicar branding a todos os elementos
  function applyClientBranding() {
    document.querySelectorAll('[data-client-branding]').forEach((element) => {
      const clientId = element.dataset.clientBranding;
      if (clientId) applyLogoToElement(element, clientId);
    });
  }

  // Auto-aplicar quando elementos mudarem
  document.addEventListener('DOMContentLoaded', () => {
    applyClientBranding();
    const observer = new MutationObserver(() => {
      requestAnimationFrame(applyClientBranding);
    });
    observer.observe(document.body, { childList: true, subtree: true });
  });

  // Exportar para uso global
  window.V4_BRANDING = {
    loadClientLogo,
    applyLogoToElement,
    applyClientBranding,
    BRANDING_CONFIG,
    getThumbnailUrl
  };
})();
