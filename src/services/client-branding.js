(function () {
  const LOGOS_BY_CLIENT_ID = {
    'st1-internet': {
      fileId: '1tMEzaDgOvwcfdqq8GXe0EvhtyRWs9mYP',
      title: 'logo-ST1-01.png',
      source: 'Drive > ST1 Internet > Identidade Visual > LOGOS'
    }
  };

  const verifiedLogoCache = {};

  function logoUrl(fileId) {
    return `https://drive.google.com/thumbnail?id=${fileId}&sz=w400`;
  }

  function currentClientId() {
    return document.querySelector('.client-btn.active')?.dataset?.client || null;
  }

  function restoreFallback(element) {
    if (!element) return;
    element.querySelectorAll('img').forEach((img) => img.remove());
    element.classList.remove('has-logo');
    const fallback = element.dataset.logoFallback || element.textContent || '';
    if (fallback) element.textContent = fallback;
  }

  function preloadLogo(logo, callback) {
    if (!logo?.fileId) return callback(null);
    if (verifiedLogoCache[logo.fileId] === false) return callback(null);
    if (verifiedLogoCache[logo.fileId]) return callback(verifiedLogoCache[logo.fileId]);

    const src = logoUrl(logo.fileId);
    const img = new Image();
    img.referrerPolicy = 'no-referrer';
    img.onload = () => {
      if (!img.naturalWidth || img.naturalWidth < 20) {
        verifiedLogoCache[logo.fileId] = false;
        callback(null);
        return;
      }
      verifiedLogoCache[logo.fileId] = src;
      callback(src);
    };
    img.onerror = () => {
      verifiedLogoCache[logo.fileId] = false;
      callback(null);
    };
    img.src = src;
  }

  function applyLogoToElement(element, logo) {
    if (!element || !logo) return;
    if (!element.dataset.logoFallback) element.dataset.logoFallback = element.textContent.trim();
    preloadLogo(logo, (src) => {
      if (!src) {
        restoreFallback(element);
        return;
      }
      const current = element.querySelector('img');
      if (current?.dataset?.fileId === logo.fileId) return;
      element.textContent = '';
      element.classList.add('has-logo');
      const img = document.createElement('img');
      img.src = src;
      img.alt = '';
      img.loading = 'lazy';
      img.referrerPolicy = 'no-referrer';
      img.dataset.fileId = logo.fileId;
      img.className = element.classList.contains('identity-mark') ? 'identity-logo-img' : 'client-logo-img';
      img.onerror = () => restoreFallback(element);
      element.appendChild(img);
    });
  }

  function applyBranding() {
    document.querySelectorAll('.client-btn').forEach((button) => {
      const logo = LOGOS_BY_CLIENT_ID[button.dataset.client];
      if (!logo) return;
      applyLogoToElement(button.querySelector('.client-avatar'), logo);
    });

    const activeClientId = currentClientId();
    const activeLogo = LOGOS_BY_CLIENT_ID[activeClientId];
    if (activeLogo) applyLogoToElement(document.querySelector('.identity-mark'), activeLogo);
  }

  window.V4_CLIENT_LOGOS = LOGOS_BY_CLIENT_ID;

  document.addEventListener('DOMContentLoaded', () => {
    const observer = new MutationObserver(() => window.requestAnimationFrame(applyBranding));
    observer.observe(document.body, { childList: true, subtree: true });
    applyBranding();
  });
})();
