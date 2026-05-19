(function () {
  const LOGOS_BY_CLIENT_ID = {
    'st1-internet': {
      fileId: '1tMEzaDgOvwcfdqq8GXe0EvhtyRWs9mYP',
      title: 'logo-ST1-01.png',
      source: 'Drive > ST1 Internet > 1. Identidade Visual > MANUAL DA MARCA + LOGO E MASCOTE > LOGOS'
    }
  };

  function logoUrl(fileId) {
    return `https://drive.google.com/uc?export=view&id=${fileId}`;
  }

  function currentClientId() {
    return document.querySelector('.client-btn.active')?.dataset?.client || null;
  }

  function applyLogoToElement(element, logo) {
    if (!element || !logo) return;
    if (element.querySelector('img')) return;
    const img = document.createElement('img');
    img.src = logoUrl(logo.fileId);
    img.alt = logo.title || 'Logo do cliente';
    img.loading = 'lazy';
    img.referrerPolicy = 'no-referrer';
    img.className = element.classList.contains('identity-mark') ? 'identity-logo-img' : 'client-logo-img';
    img.onerror = () => {
      img.remove();
      element.classList.remove('has-logo');
    };
    element.textContent = '';
    element.classList.add('has-logo');
    element.appendChild(img);
  }

  function applyBranding() {
    document.querySelectorAll('.client-btn').forEach((button) => {
      const logo = LOGOS_BY_CLIENT_ID[button.dataset.client];
      if (!logo) return;
      applyLogoToElement(button.querySelector('.client-avatar'), logo);
    });

    const activeClientId = currentClientId();
    const activeLogo = LOGOS_BY_CLIENT_ID[activeClientId];
    if (activeLogo) {
      applyLogoToElement(document.querySelector('.identity-mark'), activeLogo);
    }
  }

  window.V4_CLIENT_LOGOS = LOGOS_BY_CLIENT_ID;

  document.addEventListener('DOMContentLoaded', () => {
    const observer = new MutationObserver(() => window.requestAnimationFrame(applyBranding));
    observer.observe(document.body, { childList: true, subtree: true });
    applyBranding();
  });
})();
